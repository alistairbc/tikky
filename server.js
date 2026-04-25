import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "dist")));

// ─── POST /api/analyze ────────────────────────────────────────────────────────
// Classify raw entry text into type, priority, dueDate, emoji.
// Falls back gracefully — if Claude fails the frontend uses its local regex.
app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "text required" });

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 128,
      system: `You are a productivity classifier for Tikky. Given raw text, return ONLY valid JSON (no markdown, no explanation) with exactly these fields:
- "type": one of "task" | "event" | "note" | "thought"
- "priority": one of "high" | "medium" | "low"
- "dueDate": human-readable string like "Tuesday", "Tomorrow 5pm", "Next week" — or null
- "emoji": single most relevant emoji — or null

Classification rules:
• task  — action verb present, or contains: todo, need to, have to, don't forget, follow up
• event — meeting, appointment, call, sync, standup, lunch, dinner, or a specific time is mentioned
• note  — FYI, info, reference material, no action required
• thought — idea, reflection, brain dump, or none of the above
• high priority — urgent, ASAP, critical, blocking, today, EOD, end of day
• low priority  — whenever, no rush, low priority, someday
• medium — everything else`,
      messages: [{ role: "user", content: text }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error("[/api/analyze]", err.message);
    res.status(500).json({ error: "classification failed" });
  }
});

// ─── POST /api/assistant ──────────────────────────────────────────────────────
// Answer a natural language query about the user's stream.
app.post("/api/assistant", async (req, res) => {
  const { query, entries } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "query required" });

  // Build a concise context — cap at 40 items, skip done entries, never send full objects
  const context = (entries || [])
    .filter((e) => !e.done)
    .slice(0, 40)
    .map((e) => {
      const due = e.dueDate ? ` | due: ${e.dueDate}` : "";
      const tags = e.tags?.length ? ` ${e.tags.join(" ")}` : "";
      return `[${e.type}|${e.priority}${due}] ${e.text}${tags}`;
    })
    .join("\n");

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 384,
      system: `You are Tikky, a smart productivity assistant embedded in a task management app.

The user's active items (up to 40, excluding completed):
${context || "(no active items)"}

Rules:
• Answer concisely — under 80 words unless a list is genuinely needed
• Use **bold** for key task names or important terms
• Use markdown lists only when ranking/listing multiple items
• Be direct and practical, not motivational or verbose
• If you recommend a specific task, quote its name exactly as shown above`,
      messages: [{ role: "user", content: query }],
    });

    const message = msg.content[0].type === "text" ? msg.content[0].text : "";
    res.json({ message });
  } catch (err) {
    console.error("[/api/assistant]", err.message);
    res.status(500).json({ error: "assistant unavailable" });
  }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Tikky running on port ${PORT}`);
});
