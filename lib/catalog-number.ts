import { Client } from "@notionhq/client";
import { GAME_PROPS } from "@/lib/notion-schema";

/**
 * 图鉴编号
 *
 * 编号是「藏书」的骨架：一旦分配就固定不动，删掉某款游戏也不会重排，
 * 所以这里不做「按当前顺序现算」，而是存进 Notion 的「编号」列（number）。
 *
 * 分配策略：
 * - 新建时取当前最大值 + 1
 * - 存量条目由 backfillCatalogNumbers() 按创建时间升序补齐
 *
 * 关于并发：Notion 没有原子自增，两个标签页同时新建理论上有极小概率撞号
 * （单人使用基本不会发生）。真撞了用 backfill 的重号检测修即可。
 */

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  fetch,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

/** Notion 里的列名，与 notion-schema.json 保持一致 */
export const NUMBER_PROP = GAME_PROPS.number;

function ready(): boolean {
  return Boolean(DATABASE_ID && process.env.NOTION_API_KEY);
}

/**
 * 确保「编号」列存在（number 类型）
 * 不存在就用 databases.update 建一列，返回是否新建
 */
export async function ensureNumberColumn(): Promise<{ created: boolean }> {
  if (!ready()) return { created: false };

  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  if (!("properties" in db)) return { created: false };

  const props = db.properties as Record<string, unknown>;
  if (NUMBER_PROP in props) return { created: false };

  await notion.databases.update({
    database_id: DATABASE_ID,
    properties: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [NUMBER_PROP]: { number: {} } as any,
    },
  });
  return { created: true };
}

interface NumberRow {
  id: string;
  createdTime: string;
  number: number | null;
}

/** 拉全量条目，只取 id / 创建时间 / 编号 */
async function readNumberRows(): Promise<NumberRow[]> {
  const rows: NumberRow[] = [];
  let cursor: string | null | undefined = undefined;

  do {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const page of res.results) {
      if (!("properties" in page)) continue;
      const prop = (page.properties as Record<string, unknown>)[NUMBER_PROP];
      const value =
        prop && typeof prop === "object" && "number" in prop
          ? ((prop as { number: number | null }).number ?? null)
          : null;
      rows.push({
        id: page.id,
        createdTime: "created_time" in page ? String(page.created_time) : "",
        number: value,
      });
    }

    cursor = res.next_cursor;
  } while (cursor);

  return rows;
}

/**
 * 下一个可用编号：取「最小未使用的正整数」
 *
 * 用补洞而不是 max+1，是因为这个图鉴里删条目很常见：
 * 留一堆 037 → 041 的空洞比号被复用更让人困惑。
 * 代价是被删掉的号会被后来的新游戏捡走，不再「永不重用」。
 */
export async function nextCatalogNumber(): Promise<number | null> {
  if (!ready()) return null;
  try {
    await ensureNumberColumn();
    const rows = await readNumberRows();
    const used = new Set(
      rows.map((r) => r.number).filter((n): n is number => n !== null),
    );
    let n = 1;
    while (used.has(n)) n += 1;
    return n;
  } catch (err) {
    console.error("[catalog-number] 分配编号失败:", err);
    return null;
  }
}

/**
 * 存量回填：给还没有编号的条目按创建时间升序补号
 * 已有编号的条目一律不动，所以可以反复执行
 */
export async function backfillCatalogNumbers(): Promise<{
  total: number;
  assigned: number;
  duplicates: number[];
}> {
  if (!ready()) return { total: 0, assigned: 0, duplicates: [] };

  await ensureNumberColumn();
  const rows = await readNumberRows();

  const used = new Set<number>();
  const duplicates = new Set<number>();
  for (const r of rows) {
    if (r.number === null) continue;
    if (used.has(r.number)) duplicates.add(r.number);
    used.add(r.number);
  }

  // 缺号的按创建时间升序排队，依次捡最小未用的号
  const missing = rows
    .filter((r) => r.number === null)
    .sort((a, b) => a.createdTime.localeCompare(b.createdTime));

  const taken = new Set(used);
  let assigned = 0;

  for (const row of missing) {
    let n = 1;
    while (taken.has(n)) n += 1;
    taken.add(n);

    await notion.pages.update({
      page_id: row.id,
      properties: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [NUMBER_PROP]: { number: n } as any,
      },
    });
    assigned += 1;
  }

  return { total: rows.length, assigned, duplicates: [...duplicates] };
}
