import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// CORS: allow your Vercel domain + local dev.
// (You can tighten this later.)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

app.get("/", (_, res) => res.send("QuickGPT backend running ✅"));

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    provider: "groq",
    model: GROQ_MODEL,
    visionModel: GROQ_VISION_MODEL,
  });
});

function hasImages(messages) {
  for (const m of messages || []) {
    const c = m?.content;
    if (Array.isArray(c) && c.some((p) => p?.type === "image_url")) return true;
  }
  return false;
}

function normalizeMessages(messages) {
  const out = [];
  for (const m of messages || []) {
    if (!m?.role) continue;
    if (!["system", "user", "assistant"].includes(m.role)) continue;

    const c = m.content;

    if (typeof c === "string") {
      out.push({ role: m.role, content: c });
      continue;
    }

    if (Array.isArray(c)) {
      const parts = c
        .map((p) => {
          if (p?.type === "text" && typeof p.text === "string")
            return { type: "text", text: p.text };
          if (p?.type === "image_url" && p?.image_url?.url)
            return { type: "image_url", image_url: { url: p.image_url.url } };
          return null;
        })
        .filter(Boolean);

      if (parts.length) out.push({ role: m.role, content: parts });
    }
  }

  if (!out.length) out.push({ role: "user", content: "Hello" });
  return out;
}

async function callGroq({ model, messages }) {
  if (!GROQ_API_KEY) {
    const err = new Error("Missing GROQ_API_KEY in environment");
    err.status = 500;
    throw err;
  }

  const resp = await fetch(GROQ_CHAT_URL, {
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
      max_tokens: 600,
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
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

app.post("/api/chat", async (req, res) => {
  try {
    const messages = normalizeMessages(req.body?.messages || []);
    const wantVision = hasImages(messages);
    const model = wantVision ? GROQ_VISION_MODEL : GROQ_MODEL;

    const text = await callGroq({ model, messages });
    res.json({ text });
  } catch (e) {
    res.status(e?.status || 500).json({
      error: "Backend error",
      details: e?.message || String(e),
    });
  }
});

// --- SSE streaming (ChatGPT-like typing) ---
function sse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function chunkText(text, size = 24) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

app.post("/api/chat/stream", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const messages = normalizeMessages(req.body?.messages || []);
    const wantVision = hasImages(messages);
    const model = wantVision ? GROQ_VISION_MODEL : GROQ_MODEL;

    sse(res, "status", { stage: "calling_model" });
    const full = await callGroq({ model, messages });

    for (const part of chunkText(full, 24)) {
      sse(res, "delta", { text: part });
      await new Promise((r) => setTimeout(r, 20));
    }

    sse(res, "done", { ok: true });
    res.end();
  } catch (e) {
    sse(res, "error", { message: e?.message || String(e) });
    res.end();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));