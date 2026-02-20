import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const model = process.env.HF_MODEL || "HuggingFaceH4/zephyr-7b-beta";

    // Convert chat to prompt
    const prompt = (messages || [])
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n") + "\nASSISTANT:";

    const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 250, temperature: 0.7 }
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "HF error", details: data });
    }

    // Hugging Face returns [{ generated_text: "..."}]
    const full = data?.[0]?.generated_text || "";
    const answer = full.split("ASSISTANT:").pop().trim();

    res.json({ text: answer });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(8080, () => console.log("✅ Server running http://localhost:8080"));