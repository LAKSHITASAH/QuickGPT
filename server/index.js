import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// ✅ DEBUG LINE — proves which file Render is running
console.log("✅ RUNNING: server/index.js (Render)");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ✅ Debug route (important)
app.get("/__whoami", (_, res) =>
  res.json({ running: "server/index.js", status: "ok" })
);

// Root route
app.get("/", (_, res) => res.send("QuickGPT backend running ✅"));

// Health route
app.get("/health", (_, res) => res.json({ ok: true }));

// Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const model = process.env.HF_MODEL || "HuggingFaceH4/zephyr-7b-beta";

    const prompt =
      (messages || [])
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n") + "\nASSISTANT:";

    const r = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 250, temperature: 0.7 },
        }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "HF error", details: data });
    }

    const full = data?.[0]?.generated_text || "";
    const answer = full.split("ASSISTANT:").pop().trim();

    res.json({ text: answer });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Port (Render-compatible)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));