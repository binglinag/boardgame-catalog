"use server";

import { Client } from "@notionhq/client";
import { revalidatePath } from "next/cache";
import { BGG_URL_ALIASES } from "@/lib/notion-schema";

const notion = new Client({ auth: process.env.NOTION_API_KEY, fetch });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

function verifyPassword(pw: string): boolean {
  return pw === process.env.ADMIN_PASSWORD;
}

/** 从 BGG URL 提取游戏名（URL 末尾的 slug 部分）作为临时标题 */
function guessTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    // /boardgame/224517/wingspan → "wingspan"
    if (parts.length >= 3) {
      return parts[parts.length - 1].replace(/-/g, " ");
    }
  } catch { /* ignore */ }
  return "新桌游";
}

export async function addGameByBggUrl(
  password: string,
  bggUrl: string,
): Promise<{ success: boolean; message: string }> {
  if (!verifyPassword(password)) {
    return { success: false, message: "密码错误" };
  }

  const trimmed = bggUrl.trim();
  if (!trimmed) {
    return { success: false, message: "请输入 BGG 链接" };
  }

  // 验证 URL 格式
  if (!/boardgamegeek\.com\/boardgame\/\d+/i.test(trimmed)) {
    return { success: false, message: "链接格式不正确，需要 boardgamegeek.com/boardgame/{id}/..." };
  }

  try {
    // 用 BGG URL 中的游戏名作为临时标题
    const title = guessTitle(trimmed);

    // 尝试第一个别名作为属性名创建，失败则尝试其他
    let lastError: Error | null = null;
    for (const propName of BGG_URL_ALIASES) {
      try {
        await notion.pages.create({
          parent: { database_id: DATABASE_ID },
          properties: {
            "名称": { title: [{ text: { content: title } }] },
            [propName]: { url: trimmed },
          },
        });

        revalidatePath("/");
        return {
          success: true,
          message: `已添加「${title}」到 Notion\n链接列名: ${propName}`,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // 如果不是 "property not found" 错误，直接抛出
        if (!lastError.message.includes("property") && !lastError.message.includes("does not exist")) {
          throw lastError;
        }
        // 否则尝试下一个别名
      }
    }

    throw lastError ?? new Error("所有 BGG 链接列名均不匹配");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `添加失败: ${msg}` };
  }
}
