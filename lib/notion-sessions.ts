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

/**
 * 「游戏ID」列是否存在
 * 缓存结果，避免每次读写都检索库结构（同实例内有效）
 */
let gameIdColumnState: boolean | null = null;

async function supportsGameIdColumn(): Promise<boolean> {
  if (gameIdColumnState !== null) return gameIdColumnState;
  try {
    const db = await notion.databases.retrieve({ database_id: SESSIONS_DB_ID });
    gameIdColumnState =
      "properties" in db &&
      SESSION_PROPS.gameId in (db.properties as Record<string, unknown>);
  } catch {
    gameIdColumnState = false;
  }
  return gameIdColumnState;
}

/** 供回填页调用：清理缓存，让新加的列立刻生效 */
export function resetGameIdColumnCache() {
  gameIdColumnState = null;
}

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
    gameId: getRichText(props[SESSION_PROPS.gameId]) || undefined,
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
 * @param opts.strict 为 true 时，查询失败会抛错而不是返回部分数据（导出备份用）
 */
export async function getAllSessions(opts?: {
  strict?: boolean;
}): Promise<PlaySession[]> {
  const strict = opts?.strict ?? false;
  const sessions: PlaySession[] = [];

  if (!SESSIONS_DB_ID || !process.env.NOTION_API_KEY) {
    console.warn("[Notion Sessions] missing env vars");
    if (strict) {
      throw new Error("对局数据库未配置（NOTION_SESSIONS_DATABASE_ID）");
    }
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
    if (strict) throw err;
  }

  return sessions;
}

/**
 * 获取某个桌游的所有对局记录
 * 优先按「游戏ID」关联（游戏改名后仍能查到历史），同时用名称做兜底：
 * 未回填 ID 的老数据只有名称，加了 or 之后新旧都能命中
 */
export async function getSessionsByGame(
  gameId: string,
  gameTitle: string,
): Promise<PlaySession[]> {
  const sessions: PlaySession[] = [];

  if (!SESSIONS_DB_ID || !process.env.NOTION_API_KEY) {
    return sessions;
  }

  const useId = !!gameId && (await supportsGameIdColumn());
  const filter = useId
    ? {
        or: [
          { property: SESSION_PROPS.gameId, rich_text: { equals: gameId } },
          { property: SESSION_PROPS.gameTitle, title: { equals: gameTitle } },
        ],
      }
    : {
        property: SESSION_PROPS.gameTitle,
        title: { equals: gameTitle },
      };

  try {
    let cursor: string | null | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: SESSIONS_DB_ID,
        filter: filter as never,
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

/** Notion 单个 rich_text 片段上限 2000 字符，长文本（如战役叙事）要切块 */
const RICH_TEXT_CHUNK = 1900;

function splitRichText(text: string) {
  if (!text) return [];
  const chunks: Array<{ type: "text"; text: { content: string } }> = [];
  for (let i = 0; i < text.length; i += RICH_TEXT_CHUNK) {
    chunks.push({ type: "text", text: { content: text.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

/**
 * 新增一条对局记录
 * @param gameId 桌游的 Notion 页 ID；列不存在时会自动省略
 */
export async function createSession(
  gameTitle: string,
  date: string,
  players: PlayerScore[],
  notes: string,
  template: ScoringTemplate = "标准计分",
  scenario?: string,
  narrative?: string,
  completion?: "完整通关" | "中途放弃" | null,
  gameId?: string
): Promise<PlaySession | null> {
  try {
    const sessionData = serializeSessionData({
      players,
      scenario,
      narrative,
      completion,
    });

    const properties: Record<string, unknown> = {
      [SESSION_PROPS.gameTitle]: {
        title: [{ text: { content: gameTitle } }],
      },
      [SESSION_PROPS.date]: {
        date: { start: date },
      },
      [SESSION_PROPS.playersData]: {
        rich_text: splitRichText(sessionData),
      },
      [SESSION_PROPS.notes]: {
        rich_text: splitRichText(notes),
      },
      [SESSION_PROPS.template]: {
        select: { name: template },
      },
    };

    // 「游戏ID」列存在才写，避免在没有该列的库上报错
    if (gameId && (await supportsGameIdColumn())) {
      properties[SESSION_PROPS.gameId] = {
        rich_text: [{ text: { content: gameId } }],
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: SESSIONS_DB_ID },
      properties: properties as never,
    });

    if (isFullPage(response)) {
      return mapPageToSession(response);
    }
    return null;
  } catch {
    return null;
  }
}
