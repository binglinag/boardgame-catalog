import type { PlayerScore } from "@/types/session";

export interface SessionData {
  players: PlayerScore[];
  scenario?: string;
  narrative?: string;
  completion?: "完整通关" | "中途放弃" | null;
}

export function parseSessionData(raw: string): SessionData {
  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.players)) {
      return {
        players: parsed.players.map(normalizePlayerScore),
        scenario: typeof parsed.scenario === "string" ? parsed.scenario : undefined,
        narrative: typeof parsed.narrative === "string" ? parsed.narrative : undefined,
        completion: parsed.completion === "完整通关" || parsed.completion === "中途放弃" ? parsed.completion : null,
      };
    }

    if (Array.isArray(parsed)) {
      return {
        players: parsed.map(normalizePlayerScore),
      };
    }
  } catch {
    return { players: [] };
  }

  return { players: [] };
}

export function serializeSessionData(data: SessionData): string {
  return JSON.stringify(data);
}

function normalizePlayerScore(p: Record<string, unknown>): PlayerScore {
  return {
    name: String(p.name ?? ""),
    score: Number(p.score ?? 0),
    result: (p.result as PlayerScore["result"]) ?? null,
    rank: p.rank != null ? Number(p.rank) : null,
  };
}
