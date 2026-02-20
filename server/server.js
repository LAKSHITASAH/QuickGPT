import http from "http";
import fs from "fs";

// If you're on Node < 18, uncomment the next line:
// import fetch from "node-fetch";

// --- Env loading (keep your original file-reading approach) ---
const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";

function getEnv(k, d = "") {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim() : process.env[k] || d;
}

const PORT = Number(getEnv("PORT", "8080"));
const GROQ_API_KEY = getEnv("GROQ_API_KEY", "");

const GROQ_MODEL = getEnv("GROQ_MODEL", "llama-3.1-8b-instant");
// ✅ FIX: use Llama 4 vision model by default
const GROQ_VISION_MODEL = getEnv(
  "GROQ_VISION_MODEL",
  "meta-llama/llama-4-scout-17b-16e-instruct"
);

// Optional fallback list (in case Groq deprecates again)
const VISION_FALLBACKS = [
  GROQ_VISION_MODEL,
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
];

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

function readJson(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function hasImages(messages) {
  for (const m of messages || []) {
    const c = m?.content;
    if (Array.isArray(c)) {
      if (c.some((p) => p?.type === "image_url")) return true;
    }
  }
  return false;
}

function normalizeMessages(messages) {
  const out = [];
  for (const m of messages || []) {
    if (!m?.role) continue;
    if (m.role !== "system" && m.role !== "user" && m.role !== "assistant") continue;

    const c = m.content;

    if (typeof c === "string") {
      out.push({ role: m.role, content: c });
      continue;
    }

    if (Array.isArray(c)) {
      const parts = c
        .map((p) => {
          if (p?.type === "text" && typeof p.text === "string") return { type: "text", text: p.text };
          if (p?.type === "image_url" && p?.image_url?.url) {
            return { type: "image_url", image_url: { url: p.image_url.url } };
          }
          return null;
        })
        .filter(Boolean);

      if (parts.length > 0) out.push({ role: m.role, content: parts });
    }
  }

  if (out.length === 0) out.push({ role: "user", content: "Hello" });
  return out;
}

async function callGroq({ model, messages }) {
  // Ensure fetch exists (Node 18+ has global fetch)
  const _fetch = typeof fetch !== "undefined" ? fetch : null;
  if (!_fetch) throw new Error("fetch is not available. Use Node 18+ or install node-fetch.");

  const resp = await _fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 450,
      stream: false,
    }),
  });

  const raw = await resp.text();

  if (!resp.ok) {
    let msg = raw;
    try {
      const j = JSON.parse(raw);
      msg = j?.error?.message || j?.message || j?.detail || raw;
    } catch {}
    const err = new Error(`Groq ${resp.status}: ${msg}`);
    err.status = resp.status;
    err.raw = raw;
    throw err;
  }

  const data = JSON.parse(raw);
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq: empty response");
  return String(text).trim();
}

async function groqGenerate(messages) {
  if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY in server/.env");

  const normalized = normalizeMessages(messages);
  const wantVision = hasImages(normalized);

  if (!wantVision) {
    return await callGroq({ model: GROQ_MODEL, messages: normalized });
  }

  // ✅ Vision call with fallbacks
  let lastErr = null;
  for (const model of VISION_FALLBACKS) {
    try {
      return await callGroq({ model, messages: normalized });
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error("Vision model failed");
}

// --- Streaming via SSE (fake streaming: chunk final text) ---
function sse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function chunkText(text, size = 22) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // ✅ Add "/" route here (replaces your invalid app.get)
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("QuickGPT backend running ✅");
  }

  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        ok: true,
        provider: "groq",
        textModel: GROQ_MODEL,
        visionModel: GROQ_VISION_MODEL,
        visionFallbacks: VISION_FALLBACKS,
      })
    );
  }

  if (req.url === "/api/chat" && req.method === "POST") {
    try {
      const body = await readJson(req);
      const messages = body?.messages || [];
      const text = await groqGenerate(messages);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ text }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Backend error", details: e?.message || String(e) }));
    }
  }

  if (req.url === "/api/chat/stream" && req.method === "POST") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    try {
      const body = await readJson(req);
      const messages = body?.messages || [];

      sse(res, "status", { stage: "calling_model" });
      const full = await groqGenerate(messages);

      for (const part of chunkText(full, 22)) {
        sse(res, "delta", { text: part });
        await new Promise((r) => setTimeout(r, 20));
      }

      sse(res, "done", { ok: true });
      res.end();
    } catch (e) {
      sse(res, "error", { message: e?.message || String(e) });
      res.end();
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Backend on http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`✅ Text model: ${GROQ_MODEL}`);
  console.log(`✅ Vision model: ${GROQ_VISION_MODEL}`);
});