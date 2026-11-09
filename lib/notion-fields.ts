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
