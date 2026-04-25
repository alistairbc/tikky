/**
 * api.ts — Frontend API client for Claude-backed features.
 *
 * All calls go to the Express backend (/api/*), which holds the API key
 * server-side. Every function returns null on failure so callers can fall
 * back to the local regex layer without crashing.
 */

import type { EntryType, Priority } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  type: EntryType;
  priority: Priority;
  dueDate: string | null;
  emoji: string | null;
}

// ─── classifyEntry ────────────────────────────────────────────────────────────
// Ask Claude to classify raw entry text. Returns null on any failure so
// callers transparently fall back to the local analyze() result.

export async function classifyEntry(text: string): Promise<AnalysisResult | null> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Guard against unexpected shapes from the model
    if (!data.type || !data.priority) return null;
    return data as AnalysisResult;
  } catch {
    return null;
  }
}

// ─── queryAssistant ───────────────────────────────────────────────────────────
// Send a natural-language question about the user's stream to Claude.
// entries is the full Entry array — the server condenses it before sending.
// Returns the assistant's markdown response string, or null on failure.

export async function queryAssistant(
  query: string,
  entries: unknown[],
): Promise<string | null> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, entries }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.message === "string" ? data.message : null;
  } catch {
    return null;
  }
}
