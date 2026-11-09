import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  fetch,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

/** 表单支持渲染的列类型 */
export type FieldType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "url"
  | "files"
  | "date"
  | "checkbox";

export interface FieldDef {
  /** Notion 里的真实列名 */
  name: string;
  type: FieldType | "unsupported";
  /** select / multi_select 的可选值 */
  options: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropDef = Record<string, any>;

const SUPPORTED: FieldType[] = [
  "title",
  "rich_text",
  "number",
  "select",
  "multi_select",
  "url",
  "files",
  "date",
  "checkbox",
];

/**
 * 读取桌游数据库的真实表结构
 * 顺序就是 Notion 表头的顺序，新增页面据此动态生成输入项
 */
export async function getGameFieldDefs(): Promise<FieldDef[]> {
  if (!DATABASE_ID || !process.env.NOTION_API_KEY) {
    console.warn("[Notion] missing env vars, 无法读取表结构");
    return [];
  }

  try {
    const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
    if (!("properties" in db)) return [];

    const props = db.properties as Record<string, PropDef>;

    return Object.entries(props).map(([name, def]) => {
      const rawType = (def.type ?? "") as string;
      const type = (SUPPORTED as string[]).includes(rawType)
        ? (rawType as FieldType)
        : ("unsupported" as const);

      let options: string[] = [];
      if (rawType === "select") {
        options = ((def.select?.options ?? []) as Array<{ name: string }>).map((o) => o.name);
      } else if (rawType === "multi_select") {
        options = ((def.multi_select?.options ?? []) as Array<{ name: string }>).map((o) => o.name);
      }

      return { name, type, options };
    });
  } catch (err) {
    console.error("[Notion] 读取表结构失败:", err);
    return [];
  }
}

// ============================================================
// 字段排序：常用的拍照顺序，不常填的沉到最下面
// ============================================================

/** 用户习惯的录入顺序（title 列不在此表，始终排第一） */
const FIELD_PRIORITY: string[][] = [
  ["英文名", "englishname", "english name", "nameen", "name en"],
  ["出版年份", "出版时间", "年份", "year", "yearpublished"],
  ["评分", "rating", "score"],
  ["重度", "难度", "weight", "averageweight"],
  ["时长", "游戏时长", "时间", "playtime", "playingtime"],
  ["玩家人数", "支持人数", "人数", "players", "playercount"],
  ["最佳人数", "bestplayers", "best players"],
  ["设计师", "设计者", "designer", "designers"],
  ["BGG链接", "BGG 链接", "BGG连接", "BGG地址", "bgg链接", "BGG", "链接", "bggurl", "bgg url"],
  ["标签", "tags", "tag"],
  ["封面图", "封面", "cover"],
];

function priorityOf(field: FieldDef): number {
  if (field.type === "title") return -1;

  const name = field.name.trim().toLowerCase();
  const idx = FIELD_PRIORITY.findIndex((group) =>
    group.some((alias) => alias.toLowerCase() === name),
  );
  return idx === -1 ? FIELD_PRIORITY.length : idx;
}

/**
 * 按录入习惯重排字段：
 * 中文名(title) → 英文名 → 出版年份 → 评分 → 重度 → 时长
 * → 支持人数 → 最佳人数 → 设计师 → BGG链接 → 标签 → 封面图 → 其余
 * 同优先级内保持 Notion 表头原顺序（稳定排序）
 */
export function orderFieldDefs(fields: FieldDef[]): FieldDef[] {
  return fields
    .map((field, index) => ({ field, index, priority: priorityOf(field) }))
    .sort((a, b) =>
      a.priority !== b.priority ? a.priority - b.priority : a.index - b.index,
    )
    .map((item) => item.field);
}
