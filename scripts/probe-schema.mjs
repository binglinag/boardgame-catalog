// 探测桌游库真实表结构 + 条目数 + created_time 分布（只读）
import { readFileSync } from "node:fs";
import { Client } from "@notionhq/client";

// 手动读 .env.local，避开额外依赖
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const notion = new Client({ auth: env.NOTION_API_KEY });
const dbId = env.NOTION_DATABASE_ID;

const db = await notion.databases.retrieve({ database_id: dbId });
const props = db.properties ?? {};
console.log("列数:", Object.keys(props).length);
for (const [name, def] of Object.entries(props)) {
  console.log(`- ${name} :: ${def.type}`);
}

const hasNumber = "编号" in props;
console.log("\n已有「编号」列:", hasNumber);

let cursor = undefined;
let count = 0;
const missing = [];
const byCreated = [];
do {
  const res = await notion.databases.query({
    database_id: dbId,
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  for (const p of res.results) {
    if (!("properties" in p)) continue;
    count++;
    byCreated.push({ id: p.id, created: p.created_time });
    if (!hasNumber) continue;
    const n = p.properties["编号"];
    if (!n || n.type !== "number" || n.number === null) missing.push(p.id);
  }
  cursor = res.next_cursor;
} while (cursor);

byCreated.sort((a, b) => a.created.localeCompare(b.created));
console.log("条目总数:", count);
console.log("缺编号的条目:", missing.length);
console.log("最早创建:", byCreated[0]?.created);
console.log("最晚创建:", byCreated[byCreated.length - 1]?.created);
