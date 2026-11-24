/**
 * 端到端验证：新建时能否在 Notion 里带上「编号」
 *
 * 做三件事：
 * 1. 按 min-unused 算出下一个编号
 * 2. 用 pages.create 建一条临时条目，编号一起写进去
 * 3. 读回来确认，然后归档删掉（编号随之释放）
 *
 * 跑完不会在库里留东西。用法：node scripts/test-number-create.mjs
 */
import { readFileSync } from "node:fs";
import { Client } from "@notionhq/client";

const PROP = "编号";
const TITLE = "名称";
const MARK = "__编号自测__";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const notion = new Client({ auth: env.NOTION_API_KEY });
const dbId = env.NOTION_DATABASE_ID;

// 1. 收集已用编号
const used = new Set();
let cursor = undefined;
do {
  const res = await notion.databases.query({
    database_id: dbId,
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  for (const p of res.results) {
    if (!("properties" in p)) continue;
    const n = p.properties[PROP]?.number;
    if (typeof n === "number") used.add(n);
  }
  cursor = res.next_cursor;
} while (cursor);

let next = 1;
while (used.has(next)) next += 1;
console.log(`已用编号 ${used.size} 个，本次应分配：${String(next).padStart(3, "0")}`);

// 2. 创建（模拟 createGame 的写法：编号与其他属性一次写入）
const created = await notion.pages.create({
  parent: { database_id: dbId },
  properties: {
    [TITLE]: { title: [{ type: "text", text: { content: MARK } }] },
    [PROP]: { number: next },
  },
});
console.log("已创建临时页面:", created.id);

// 3. 读回校验
const readBack = await notion.pages.retrieve({ page_id: created.id });
const got = readBack.properties[PROP]?.number;
console.log(`读回编号：${got} → ${got === next ? "一致 ✓" : "不一致 ✗"}`);

// 4. 清理
await notion.pages.update({ page_id: created.id, archived: true });
console.log("已归档临时页面，编号已释放");
