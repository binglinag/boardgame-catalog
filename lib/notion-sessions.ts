import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { PlaySession, PlayerScore, ScoringTemplate } from "@/types/session";
import { SESSION_PROPS } from "@/lib/notion-schema";
import { parseSessionData, serializeSessionData } from "@/lib/session-data";

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
// Notion Page → PlaySession
// ============================================================

function mapPageToSession(page: PageObjectResponse): PlaySession {
  const props = page.properties as Record<string, unknown>;
  const templateRaw = getSelect(props[SESSION_PROPS.template]);
  const validTemplates: ScoringTemplate[] = ["标准计分", "胜负记录", "排名顺序", "单一赢家", "合作胜负", "战役叙事"];
  const template: ScoringTemplate = validTemplates.includes(templateRaw as ScoringTemplate)
    ? (templateRaw as ScoringTemplate)
    : "标准计分";

  const sessionData = parseSessionData(getRichText(props[SESSION_PROPS.playersData]));

  return {
    id: page.id,
    gameTitle: getTitle(props[SESSION_PROPS.gameTitle]),
    date: getDate(props[SESSION_PROPS.date]),
    players: sessionData.players,
    notes: getRichText(props[SESSION_PROPS.notes]),
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
        sorts: [{ property: SESSION_PROPS.date, direction: "descending" }],
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
          property: SESSION_PROPS.gameTitle,
          title: {
            equals: gameTitle,
          },
        },
        sorts: [{ property: SESSION_PROPS.date, direction: "descending" }],
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
        [SESSION_PROPS.gameTitle]: {
          title: [{ text: { content: gameTitle } }],
        },
        [SESSION_PROPS.date]: {
          date: { start: date },
        },
        [SESSION_PROPS.playersData]: {
          rich_text: [{ text: { content: sessionData } }],
        },
        [SESSION_PROPS.notes]: {
          rich_text: notes ? [{ text: { content: notes } }] : [],
        },
        [SESSION_PROPS.template]: {
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
