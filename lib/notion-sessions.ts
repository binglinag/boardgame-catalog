import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { PlaySession, PlayerScore, ScoringTemplate } from "@/types/session";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  fetch,
});

const SESSIONS_DB_ID = process.env.NOTION_SESSIONS_DATABASE_ID ?? "";

// ============================================================
// 类型守卫 & 提取工具
// ============================================================

function isFullPage(page: unknown): page is PageObjectResponse {
  return (
    typeof page === "object" &&
    page !== null &&
    "properties" in page &&
    "cover" in page
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPropType(prop: unknown, type: string): prop is Record<string, any> {
  return (
    typeof prop === "object" &&
    prop !== null &&
    "type" in prop &&
    (prop as Record<string, string>).type === type
  );
}

function getTitle(prop: unknown): string {
  if (isPropType(prop, "title")) {
    return (((prop as Record<string, unknown>).title ?? []) as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getRichText(prop: unknown): string {
  if (isPropType(prop, "rich_text")) {
    return (((prop as Record<string, unknown>).rich_text ?? []) as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getDate(prop: unknown): string {
  if (isPropType(prop, "date")) {
    const d = (prop as Record<string, { start: string } | null>).date;
    return d?.start ?? "";
  }
  return "";
}

function getSelect(prop: unknown): string {
  if (isPropType(prop, "select")) {
    const sel = (prop as Record<string, { name: string } | null>).select;
    return sel?.name ?? "";
  }
  return "";
}

// ============================================================
// 解析 & 序列化玩家数据（含战役元数据）
// ============================================================

interface SessionData {
  players: PlayerScore[];
  scenario?: string;
  narrative?: string;
  completion?: "完整通关" | "中途放弃" | null;
}

function parseSessionData(raw: string): SessionData {
  try {
    const parsed = JSON.parse(raw);
    // 新格式：{ players: [...], scenario, narrative, completion }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.players)) {
      return {
        players: parsed.players.map((p: Record<string, unknown>) => ({
          name: String(p.name ?? ""),
          score: Number(p.score ?? 0),
          result: (p.result as PlayerScore["result"]) ?? null,
          rank: p.rank != null ? Number(p.rank) : null,
        })),
        scenario: typeof parsed.scenario === "string" ? parsed.scenario : undefined,
        narrative: typeof parsed.narrative === "string" ? parsed.narrative : undefined,
        completion: (parsed.completion === "完整通关" || parsed.completion === "中途放弃") ? parsed.completion : null,
      };
    }
    // 旧格式：直接是玩家数组
    if (Array.isArray(parsed)) {
      return {
        players: parsed.map((p: Record<string, unknown>) => ({
          name: String(p.name ?? ""),
          score: Number(p.score ?? 0),
          result: (p.result as PlayerScore["result"]) ?? null,
          rank: p.rank != null ? Number(p.rank) : null,
        })),
      };
    }
  } catch {
    return { players: [] };
  }
  return { players: [] };
}

function serializeSessionData(data: SessionData): string {
  return JSON.stringify(data);
}

// ============================================================
// Notion Page → PlaySession
// ============================================================

function mapPageToSession(page: PageObjectResponse): PlaySession {
  const props = page.properties as Record<string, unknown>;
  const templateRaw = getSelect(props["计分模板"]);
  const validTemplates: ScoringTemplate[] = ["标准计分", "胜负记录", "排名顺序", "单一赢家", "合作胜负", "战役叙事"];
  const template: ScoringTemplate = validTemplates.includes(templateRaw as ScoringTemplate)
    ? (templateRaw as ScoringTemplate)
    : "标准计分";

  const sessionData = parseSessionData(getRichText(props["玩家数据"]));

  return {
    id: page.id,
    gameTitle: getTitle(props["桌游名称"]),
    date: getDate(props["日期"]),
    players: sessionData.players,
    notes: getRichText(props["备注"]),
    template,
    scenario: sessionData.scenario,
    narrative: sessionData.narrative,
    completion: sessionData.completion,
  };
}

// ============================================================
// 读取
// ============================================================

/**
 * 获取所有对局记录
 */
export async function getAllSessions(): Promise<PlaySession[]> {
  const sessions: PlaySession[] = [];

  if (!SESSIONS_DB_ID || !process.env.NOTION_API_KEY) {
    console.warn("[Notion Sessions] missing env vars");
    return sessions;
  }

  try {
    let cursor: string | null | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: SESSIONS_DB_ID,
        sorts: [{ property: "日期", direction: "descending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });

      for (const page of response.results) {
        if (isFullPage(page)) {
          try {
            sessions.push(mapPageToSession(page));
          } catch {
            // skip
          }
        }
      }
      cursor = response.next_cursor;
    } while (cursor);
  } catch (err) {
    console.error("[Notion Sessions] getAllSessions failed:", err);
  }

  return sessions;
}

/**
 * 获取某个桌游的所有对局记录
 */
export async function getSessionsByGame(gameTitle: string): Promise<PlaySession[]> {
  const sessions: PlaySession[] = [];

  if (!SESSIONS_DB_ID || !process.env.NOTION_API_KEY) {
    return sessions;
  }

  try {
    let cursor: string | null | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: SESSIONS_DB_ID,
        filter: {
          property: "桌游名称",
          title: {
            equals: gameTitle,
          },
        },
        sorts: [{ property: "日期", direction: "descending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });

      for (const page of response.results) {
        if (isFullPage(page)) {
          try {
            sessions.push(mapPageToSession(page));
          } catch {
            // skip
          }
        }
      }

      cursor = response.next_cursor;
    } while (cursor);
  } catch (err) {
    console.error("[Notion Sessions] getSessionsByGame failed:", err);
  }

  return sessions;
}

// ============================================================
// 写入（Server Action 调用）
// ============================================================

/**
 * 新增一条对局记录
 */
export async function createSession(
  gameTitle: string,
  date: string,
  players: PlayerScore[],
  notes: string,
  template: ScoringTemplate = "标准计分",
  scenario?: string,
  narrative?: string,
  completion?: "完整通关" | "中途放弃" | null
): Promise<PlaySession | null> {
  try {
    const sessionData = serializeSessionData({
      players,
      scenario,
      narrative,
      completion,
    });

    const response = await notion.pages.create({
      parent: { database_id: SESSIONS_DB_ID },
      properties: {
        "桌游名称": {
          title: [{ text: { content: gameTitle } }],
        },
        "日期": {
          date: { start: date },
        },
        "玩家数据": {
          rich_text: [{ text: { content: sessionData } }],
        },
        "备注": {
          rich_text: notes ? [{ text: { content: notes } }] : [],
        },
        "计分模板": {
          select: { name: template },
        },
      },
    });

    if (isFullPage(response)) {
      return mapPageToSession(response);
    }
    return null;
  } catch {
    return null;
  }
}
