"use server";

import { Client } from "@notionhq/client";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth";
import { GAME_PROPS, SESSION_PROPS } from "@/lib/notion-schema";
import { resetGameIdColumnCache } from "@/lib/notion-sessions";

const notion = new Client({ auth: process.env.NOTION_API_KEY, fetch });

const GAMES_DB_ID = process.env.NOTION_DATABASE_ID ?? "";
const SESSIONS_DB_ID = process.env.NOTION_SESSIONS_DATABASE_ID ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;

function plainTitle(props: Record<string, Page>, key: string): string {
  const p = props[key];
  if (!p || p.type !== "title") return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((p.title ?? []) as any[]).map((t) => t.plain_text).join("");
}

function richTextValue(props: Record<string, Page>, key: string): string {
  const p = props[key];
  if (!p || p.type !== "rich_text") return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((p.rich_text ?? []) as any[]).map((t) => t.plain_text).join("");
}

function formatDate(props: Record<string, Page>, key: string): string {
  const p = props[key];
  return p?.date?.start ?? "";
}

async function fetchAll(dbId: string, sorts?: unknown): Promise<Page[]> {
  const all: Page[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
      ...(sorts ? { sorts: sorts as never } : {}),
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    all.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return all;
}

/** 确保「游戏ID」列存在，缺则自动创建（Notion API 支持改表结构） */
async function ensureGameIdColumn(): Promise<void> {
  if (!SESSIONS_DB_ID) throw new Error("未配置 NOTION_SESSIONS_DATABASE_ID");

  const db = await notion.databases.retrieve({ database_id: SESSIONS_DB_ID });
  if ("properties" in db && SESSION_PROPS.gameId in db.properties) return;

  await notion.databases.update({
    database_id: SESSIONS_DB_ID,
    properties: { [SESSION_PROPS.gameId]: { rich_text: {} } },
  });
  resetGameIdColumnCache();
}

export interface BackfillResult {
  success: boolean;
  message?: string;
  columnCreated?: boolean;
  totalSessions: number;
  alreadyHasId: number;
  updated: number;
  pending: number;
  /** 对局里出现的、在游戏表中找不到同名的记录（按标题去重） */
  unmatched: Array<{ title: string; count: number }>;
  /** 玩家数据里缺少 id 的对局数（历史遗漏，需人工确认） */
  sessionsMissingPlayerId: number;
  done: boolean;
}

/**
 * 分批回填对局的「游戏ID」
 * 每轮最多处理 limit 条，浏览器端循环调用直到 done
 * 幂等：已有 ID 的对局直接跳过
 */
export async function backfillSessionGameIds(
  password: string,
  limit = 8,
): Promise<BackfillResult> {
  const empty: BackfillResult = {
    success: false,
    totalSessions: 0,
    alreadyHasId: 0,
    updated: 0,
    pending: 0,
    unmatched: [],
    sessionsMissingPlayerId: 0,
    done: true,
  };

  const auth = verifyAdmin(password);
  if (!auth.ok) return { ...empty, message: auth.reason ?? "密码错误" };

  if (!GAMES_DB_ID || !SESSIONS_DB_ID) {
    return { ...empty, message: "未配置 NOTION_DATABASE_ID / NOTION_SESSIONS_DATABASE_ID" };
  }

  try {
    const hadColumn = await (async () => {
      const db = await notion.databases.retrieve({ database_id: SESSIONS_DB_ID });
      return "properties" in db && SESSION_PROPS.gameId in db.properties;
    })();
    await ensureGameIdColumn();

    // 游戏名 → 游戏 ID（同名取第一个）
    const games = await fetchAll(GAMES_DB_ID);
    const titleToId = new Map<string, string>();
    for (const g of games) {
      const t = plainTitle(g.properties, GAME_PROPS.title).trim();
      if (t && !titleToId.has(t)) titleToId.set(t, g.id);
    }

    const sessions = await fetchAll(SESSIONS_DB_ID, [
      { property: SESSION_PROPS.date, direction: "descending" },
    ]);

    const todo: Array<{ pageId: string; gameId: string }> = [];
    const unmatchedCount = new Map<string, number>();
    let alreadyHasId = 0;
    let missingPlayerId = 0;

    for (const s of sessions) {
      const props = s.properties as Record<string, Page>;
      const existingId = richTextValue(props, SESSION_PROPS.gameId).trim();
      if (existingId) {
        alreadyHasId++;
        continue;
      }

      // 统计玩家数据缺 id 的对局
      const rawPlayers = richTextValue(props, SESSION_PROPS.playersData);
      try {
        const parsed = JSON.parse(rawPlayers);
        const list = Array.isArray(parsed) ? parsed : parsed?.players;
        if (Array.isArray(list) && list.some((p) => !p?.id)) missingPlayerId++;
      } catch {
        /* 解析不了就跳过统计 */
      }

      const title = plainTitle(props, SESSION_PROPS.gameTitle).trim();
      const gameId = titleToId.get(title);
      if (gameId) {
        todo.push({ pageId: s.id, gameId });
      } else if (title) {
        unmatchedCount.set(title, (unmatchedCount.get(title) ?? 0) + 1);
      }
    }

    const batch = todo.slice(0, limit);
    for (const item of batch) {
      try {
        await notion.pages.update({
          page_id: item.pageId,
          properties: {
            [SESSION_PROPS.gameId]: { rich_text: [{ text: { content: item.gameId } }] },
          },
        });
      } catch {
        /* 单条失败不阻塞，下一轮会重试 */
      }
    }

    const pending = Math.max(0, todo.length - batch.length);
    if (batch.length > 0) {
      revalidatePath("/");
      revalidatePath("/leaderboard");
    }

    const unmatched = Array.from(unmatchedCount.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      columnCreated: !hadColumn,
      totalSessions: sessions.length,
      alreadyHasId,
      updated: batch.length,
      pending,
      unmatched,
      sessionsMissingPlayerId: missingPlayerId,
      done: pending === 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...empty, message: `回填失败: ${msg}` };
  }
}

/** 只做检测与建列，不写数据（给页面初次加载时用） */
export async function inspectSessionIdColumn(password: string): Promise<{
  success: boolean;
  message?: string;
  hasColumn: boolean;
}> {
  const auth = verifyAdmin(password);
  if (!auth.ok) return { success: false, message: auth.reason ?? "密码错误", hasColumn: false };
  if (!SESSIONS_DB_ID) return { success: false, message: "未配置对局数据库", hasColumn: false };

  try {
    const db = await notion.databases.retrieve({ database_id: SESSIONS_DB_ID });
    const has = "properties" in db && SESSION_PROPS.gameId in db.properties;
    return { success: true, hasColumn: has };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg, hasColumn: false };
  }
}
