import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { BoardGame } from "@/types/game";

// ============================================================
// Notion 客户端初始化
// ============================================================

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  fetch,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

// ============================================================
// 类型守卫 & 辅助类型
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropObject = Record<string, any>;

function isFullPage(page: unknown): page is PageObjectResponse {
  return (
    typeof page === "object" &&
    page !== null &&
    "properties" in page &&
    "cover" in page
  );
}

function isPropType(prop: unknown, type: string): prop is PropObject {
  return (
    typeof prop === "object" &&
    prop !== null &&
    "type" in prop &&
    (prop as PropObject).type === type
  );
}

// ============================================================
// 属性提取工具
// ============================================================

function getTitle(prop: unknown): string {
  if (isPropType(prop, "title")) {
    return ((prop.title ?? []) as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getRichText(prop: unknown): string {
  if (isPropType(prop, "rich_text")) {
    return ((prop.rich_text ?? []) as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getNumber(prop: unknown): number | null {
  if (isPropType(prop, "number")) {
    return typeof prop.number === "number" ? prop.number : null;
  }
  return null;
}

function getSelect(prop: unknown): string | null {
  if (isPropType(prop, "select")) {
    return prop.select?.name ?? null;
  }
  return null;
}

function getMultiSelect(prop: unknown): string[] {
  if (isPropType(prop, "multi_select")) {
    return ((prop.multi_select ?? []) as Array<{ name: string }>).map(
      (s) => s.name
    );
  }
  return [];
}

function getUrl(prop: unknown): string | null {
  if (isPropType(prop, "url")) {
    return typeof prop.url === "string" ? prop.url : null;
  }
  return null;
}

function getFiles(prop: unknown): string | null {
  if (isPropType(prop, "files")) {
    const files = (prop.files ?? []) as Array<{
      file?: { url: string };
      external?: { url: string };
      name: string;
    }>;
    if (files.length > 0) {
      return files[0].file?.url ?? files[0].external?.url ?? null;
    }
  }
  return null;
}

/** 提取所有文件 URL（用于多图字段） */
function getAllFiles(prop: unknown): string[] {
  if (isPropType(prop, "files")) {
    const files = (prop.files ?? []) as Array<{
      file?: { url: string };
      external?: { url: string };
      name: string;
    }>;
    return files.map((f) => f.file?.url ?? f.external?.url ?? "").filter(Boolean);
  }
  return [];
}

// ============================================================
// Notion Page → BoardGame 映射
// ============================================================

function mapPageToGame(page: PageObjectResponse): BoardGame {
  const props = page.properties as Record<string, unknown>;

  // 封面图优先级: Files & media 列 > Notion 页面封面
  const coverUrl =
    getFiles(props["封面图"]) ??
    (page.cover?.type === "external"
      ? page.cover.external.url
      : page.cover?.type === "file"
        ? page.cover.file.url
        : null);

  return {
    id: page.id,
    slug: page.id,
    title: getTitle(props["名称"]),
    nameEn: getRichText(props["英文名"]),
    players: getRichText(props["玩家人数"]),
    bestPlayers: getRichText(props["最佳人数"]),
    playTime: getRichText(props["时长"]),
    year: getNumber(props["出版年份"]),
    designer: getRichText(props["设计师"]),
    rating: getNumber(props["评分"]),
    weight: getNumber(props["重度"]),
    status: getMultiSelect(props["状态"]) as BoardGame["status"],
    playCount: null, // 不再读取 Notion，改为根据对局记录自动统计
    tags: getMultiSelect(props["标签"]),
    coverUrl,
    extraImages: getAllFiles(props["相关图片"]),
    bggUrl: getUrl(props["BGG链接"]),
    price: getNumber(props["购买价格"]),
    priceNotes: getRichText(props["价格备注"]),
    review: getRichText(props["个人评价"]),
  };
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 获取所有桌游列表
 */
export async function getAllGames(): Promise<BoardGame[]> {
  const games: BoardGame[] = [];

  if (!DATABASE_ID || !process.env.NOTION_API_KEY) {
    console.warn("[Notion] missing env vars");
    return games;
  }

  try {
    let cursor: string | null | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        sorts: [{ property: "评分", direction: "descending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });

      for (const page of response.results) {
        if (isFullPage(page)) {
          try {
            games.push(mapPageToGame(page));
          } catch {
            // 跳过解析失败的条目
          }
        }
      }

      cursor = response.next_cursor;
    } while (cursor);
  } catch (err) {
    console.error("[Notion] getAllGames failed:", err);
  }

  return games;
}

/**
 * 根据 slug（page ID）获取单个桌游详情
 */
export async function getGameBySlug(slug: string): Promise<BoardGame | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: slug });
    if (isFullPage(page)) {
      return mapPageToGame(page);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取所有标签（用于筛选栏）
 */
export async function getAllTags(): Promise<string[]> {
  const games = await getAllGames();
  const tagSet = new Set<string>();
  for (const game of games) {
    for (const tag of game.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export const ISR_REVALIDATE = 60;
