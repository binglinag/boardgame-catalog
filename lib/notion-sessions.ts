import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { PlaySession, PlayerScore } from "@/types/session";

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

// ============================================================
// 解析 & 序列化玩家数据
// ============================================================

function parsePlayers(raw: string): PlayerScore[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((p: Record<string, unknown>) => ({
        name: String(p.name ?? ""),
        score: Number(p.score ?? 0),
      }));
    }
  } catch {
    return [];
  }
  return [];
}

function serializePlayers(players: PlayerScore[]): string {
  return JSON.stringify(players);
}

// ============================================================
// Notion Page → PlaySession
// ============================================================

function mapPageToSession(page: PageObjectResponse): PlaySession {
  const props = page.properties as Record<string, unknown>;
  return {
    id: page.id,
    gameTitle: getTitle(props["桌游名称"]),
    date: getDate(props["日期"]),
    players: parsePlayers(getRichText(props["玩家数据"])),
    notes: getRichText(props["备注"]),
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
        sessions.push(mapPageToSession(page));
      }
    }
    cursor = response.next_cursor;
  } while (cursor);

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
  notes: string
): Promise<PlaySession | null> {
  try {
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
          rich_text: [{ text: { content: serializePlayers(players) } }],
        },
        "备注": {
          rich_text: notes ? [{ text: { content: notes } }] : [],
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
