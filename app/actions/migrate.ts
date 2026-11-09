"use server";

import { Client } from "@notionhq/client";
import { revalidatePath } from "next/cache";
import { uploadCoverToBlob, hasBlobToken } from "@/lib/blob";
import { GAME_PROPS } from "@/lib/notion-schema";
import type { MigrateResult } from "@/types/migrate";

const notion = new Client({ auth: process.env.NOTION_API_KEY, fetch });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

const BLOB_HOST = "blob.vercel-storage.com";

function verifyPassword(pw: string): boolean {
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

interface FileItem {
  name: string;
  url: string;
  isBlob: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readFiles(prop: any): FileItem[] {
  if (!prop || prop.type !== "files") return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((prop.files ?? []) as any[])
    .map((f) => {
      const url: string = f.file?.url ?? f.external?.url ?? "";
      return { name: f.name ?? "cover", url, isBlob: url.includes(BLOB_HOST) };
    })
    .filter((f) => !!f.url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readTitle(props: Record<string, any>): string {
  const p = props[GAME_PROPS.title];
  if (!p || p.type !== "title") return "未命名";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((p.title ?? []) as any[]).map((t) => t.plain_text).join("") || "未命名";
}

/** 拉全库分页 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllPages(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    all.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  return all;
}

/**
 * 分批把 Notion 里的历史封面图搬到 Vercel Blob，并写回 Notion
 * 每次只处理 limit 款游戏（浏览器端循环调用，避免函数超时）
 * 天然幂等：已在 Blob 上的图会跳过，反复调用不会重复上传
 */
export async function migrateCoversBatch(
  password: string,
  limit = 3,
): Promise<MigrateResult> {
  const empty: MigrateResult = {
    success: false,
    totalGames: 0,
    migrated: 0,
    alreadyMigrated: 0,
    failed: 0,
    pending: 0,
    details: [],
    done: true,
  };

  if (!verifyPassword(password)) {
    return { ...empty, message: "密码错误" };
  }
  if (!hasBlobToken()) {
    return { ...empty, message: "未配置 Blob token，请先创建 Blob Store 并勾选 read-write token" };
  }

  try {
    const pages = await fetchAllPages();

    // 找出还有非 Blob 封面图的游戏
    const tasks: Array<{ pageId: string; title: string; files: FileItem[] }> = [];
    let totalGames = 0;
    let alreadyMigrated = 0;

    for (const page of pages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = ((page as any).properties ?? {}) as Record<string, any>;
      const files = readFiles(props[GAME_PROPS.cover]);
      if (files.length === 0) continue;

      totalGames++;
      const todo = files.filter((f) => !f.isBlob);
      if (todo.length === 0) {
        alreadyMigrated++;
        continue;
      }
      tasks.push({ pageId: page.id, title: readTitle(props), files });
    }

    const batch = tasks.slice(0, limit);
    const details: MigrateResult["details"] = [];
    let migrated = 0;
    let failed = 0;

    for (const task of batch) {
      try {
        const nextFiles: FileItem[] = [];
        let changed = false;

        for (const f of task.files) {
          if (f.isBlob) {
            nextFiles.push(f);
            continue;
          }
          const blobUrl = await uploadCoverToBlob(f.url, task.title);
          if (blobUrl) {
            nextFiles.push({ name: f.name, url: blobUrl, isBlob: true });
            changed = true;
          } else {
            // 单张失败就保留原图，不阻塞整款游戏
            nextFiles.push(f);
          }
        }

        if (!changed) {
          failed++;
          details.push({ title: task.title, status: "failed", message: "图片下载或上传失败，已保留原图" });
          continue;
        }

        await notion.pages.update({
          page_id: task.pageId,
          properties: {
            [GAME_PROPS.cover]: {
              files: nextFiles.map((f) => ({ name: f.name, external: { url: f.url } })),
            },
          },
        });

        migrated++;
        details.push({ title: task.title, status: "migrated", message: "已迁入 Blob 并写回 Notion" });
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        details.push({ title: task.title, status: "failed", message: msg.slice(0, 120) });
      }
    }

    const pending = Math.max(0, tasks.length - batch.length);
    if (migrated > 0) {
      revalidatePath("/");
      revalidatePath("/leaderboard");
    }

    return {
      success: true,
      totalGames,
      migrated,
      alreadyMigrated,
      failed,
      pending,
      details,
      done: pending === 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...empty, message: `迁移失败: ${msg}` };
  }
}
