/**
 * 一次性回填：给桌游库建「编号」列，并按创建时间升序补号
 *
 * 用法：node scripts/backfill-numbers.mjs [--dry]
 * 逻辑与 lib/catalog-number.ts 的 backfillCatalogNumbers 一致，
 * 这里用 node 直接跑，避免为了跑一次去开一个页面。
 */
import { readFileSync } from "node:fs";
import { Client } from "@notionhq/client";

const DRY = process.argv.includes("--dry");
const PROP = "编号";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const notion = new Client({ auth: env.NOTION_API_KEY });
const dbId = env.NOTION_DATABASE_ID;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 429 时退避重试
async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const code = err?.code ?? err?.status;
      if (attempt === 4) throw err;
      console.log(`  · ${label} 失败(${code})，${attempt * 400}ms 后重试`);
      await sleep(attempt * 400);
    }
  }
}

// 1. 确认列存在
const db = await notion.databases.retrieve({ database_id: dbId });
if (!("properties" in db)) throw new Error("读不到数据库表结构");

const hasCol = PROP in db.properties;
console.log(`「${PROP}」列：${hasCol ? "已存在" : "不存在"}`);

if (!hasCol) {
  if (DRY) {
    console.log("[dry] 将创建 number 类型的「编号」列");
  } else {
    await notion.databases.update({
      database_id: dbId,
      properties: { [PROP]: { number: {} } },
    });
    console.log("已创建「编号」列（number）");
  }
}

// 2. 拉全量
const rows = [];
let cursor = undefined;
do {
  const res = await notion.databases.query({
    database_id: dbId,
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  for (const p of res.results) {
    if (!("properties" in p)) continue;
    const raw = hasCol ? p.properties[PROP] : null;
    const num = raw && raw.type === "number" ? raw.number : null;
    const titleProp = Object.values(p.properties).find((v) => v.type === "title");
    const title = (titleProp?.title ?? []).map((t) => t.plain_text).join("");
    rows.push({ id: p.id, created: p.created_time, number: num, title });
  }
  cursor = res.next_cursor;
} while (cursor);

rows.sort((a, b) => a.created.localeCompare(b.created));
console.log(`条目总数：${rows.length}`);

const used = new Set(rows.filter((r) => r.number !== null).map((r) => r.number));
const missing = rows.filter((r) => r.number === null);
console.log(`已有编号：${used.size} 条，待分配：${missing.length} 条`);

let next = used.size > 0 ? Math.max(...used) : 0;

if (missing.length === 0) {
  console.log("没有需要补号的条目");
  process.exit(0);
}

for (const [i, row] of missing.entries()) {
  next += 1;
  const label = String(next).padStart(3, "0");
  console.log(`  ${label} ← ${row.title}（${row.created.slice(0, 10)}）`);
  if (DRY) continue;

  await withRetry(
    () =>
      notion.pages.update({
        page_id: row.id,
        properties: { [PROP]: { number: next } },
      }),
    `写入 ${label}`,
  );

  // Notion 限制约 3 req/s，留点余量
  if (i < missing.length - 1) await sleep(360);
}

console.log(DRY ? "[dry] 未写入" : `完成：回填 ${missing.length} 条，最大编号 ${next}`);
