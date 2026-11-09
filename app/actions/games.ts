"use server";

import { Client } from "@notionhq/client";
import { revalidatePath } from "next/cache";
import { BGG_URL_ALIASES, GAME_PROPS } from "@/lib/notion-schema";
import { verifyAdmin } from "@/lib/auth";
import type { GameEditForm } from "@/types/game";

const notion = new Client({ auth: process.env.NOTION_API_KEY, fetch });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

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
  const auth = verifyAdmin(password);
  if (!auth.ok) {
    return { success: false, message: auth.reason ?? "密码错误" };
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

// ============================================================
// 网页编辑器：把表单写回 Notion 页面
// ============================================================

/** Notion 单个 rich_text 片段上限 2000 字符，长文本要切块 */
const RICH_TEXT_CHUNK = 1900;

type RichTextItem = { type: "text"; text: { content: string } };

function richText(value: string): RichTextItem[] {
  const v = value.trim();
  if (!v) return [];
  const chunks: RichTextItem[] = [];
  for (let i = 0; i < v.length; i += RICH_TEXT_CHUNK) {
    chunks.push({ type: "text", text: { content: v.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

function toNumber(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 多行/逗号分隔的 URL 字符串 → Notion files 属性 */
function toExternalFiles(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .map((url, i) => ({ name: `image-${i + 1}`, external: { url } }));
}

/**
 * 更新桌游信息（网页编辑器提交入口）
 * - 只写 Notion 里真实存在的列，避免因某列被删掉导致整次更新失败
 * - 空字符串会写成 null / 空数组，等于清空该字段
 */
export async function updateGame(
  password: string,
  pageId: string,
  form: GameEditForm,
): Promise<{ success: boolean; message: string; updated?: string[] }> {
  const auth = verifyAdmin(password);
  if (!auth.ok) {
    return { success: false, message: auth.reason ?? "密码错误" };
  }
  if (!pageId) {
    return { success: false, message: "缺少页面 ID" };
  }

  const title = form.title.trim();
  if (!title) {
    return { success: false, message: "名称不能为空" };
  }

  try {
    // 先读一遍真实列名，做一次白名单过滤
    const page = await notion.pages.retrieve({ page_id: pageId });
    if (!("properties" in page)) {
      return { success: false, message: "无法读取该页面" };
    }
    const existingKeys = Object.keys(page.properties as Record<string, unknown>);

    // BGG 链接列名有多个别名，找数据库里真实存在的那个
    const bggKey = BGG_URL_ALIASES.find((k) => existingKeys.includes(k));

    const wanted: Record<string, unknown> = {
      [GAME_PROPS.title]: { title: richText(title) },
      [GAME_PROPS.nameEn]: { rich_text: richText(form.nameEn) },
      [GAME_PROPS.players]: { rich_text: richText(form.players) },
      [GAME_PROPS.bestPlayers]: { rich_text: richText(form.bestPlayers) },
      [GAME_PROPS.playTime]: { rich_text: richText(form.playTime) },
      [GAME_PROPS.year]: { number: toNumber(form.year) },
      [GAME_PROPS.designer]: { rich_text: richText(form.designer) },
      [GAME_PROPS.rating]: { number: toNumber(form.rating) },
      [GAME_PROPS.weight]: { number: toNumber(form.weight) },
      [GAME_PROPS.status]: {
        multi_select: form.status.filter(Boolean).map((name) => ({ name })),
      },
      [GAME_PROPS.tags]: {
        multi_select: form.tags
          .split(/[,，\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      },
      [GAME_PROPS.cover]: { files: toExternalFiles(form.coverUrl) },
      [GAME_PROPS.extraImages]: { files: toExternalFiles(form.extraImages) },
      [GAME_PROPS.price]: { number: toNumber(form.price) },
      [GAME_PROPS.priceNotes]: { rich_text: richText(form.priceNotes) },
      [GAME_PROPS.review]: { rich_text: richText(form.review) },
    };

    if (bggKey) {
      const url = form.bggUrl.trim();
      wanted[bggKey] = {
        url: url && /^https?:\/\//i.test(url) ? url : url ? `https://${url}` : null,
      };
    }

    // 过滤掉数据库里不存在的列
    const properties: Record<string, unknown> = {};
    const skipped: string[] = [];
    for (const [key, value] of Object.entries(wanted)) {
      if (existingKeys.includes(key)) {
        properties[key] = value;
      } else {
        skipped.push(key);
      }
    }

    if (Object.keys(properties).length === 0) {
      return { success: false, message: "没有可写入的列，请检查 Notion 数据库表头" };
    }

    await notion.pages.update({
      page_id: pageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: properties as any,
    });

    // 让详情页、首页、排行榜的 ISR 缓存立即失效
    revalidatePath(`/${pageId}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");

    const updated = Object.keys(properties);
    return {
      success: true,
      message:
        skipped.length > 0
          ? `已保存 ${updated.length} 个字段（跳过不存在的列：${skipped.join("、")}）`
          : `已保存 ${updated.length} 个字段`,
      updated,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `保存失败: ${msg}` };
  }
}

// ============================================================
// 新增页：按数据库真实表结构动态写入
// ============================================================

/**
 * 在桌游数据库中创建一条新记录
 * values 的 key 是 Notion 的真实列名，value 是字符串或字符串数组（多选/多图）
 * 服务端会重新读一次表结构，按真实列类型构造属性，不信任客户端传来的类型
 */
export async function createGame(
  password: string,
  values: Record<string, string | string[]>,
): Promise<{ success: boolean; message: string; pageId?: string }> {
  const auth = verifyAdmin(password);
  if (!auth.ok) {
    return { success: false, message: auth.reason ?? "密码错误" };
  }

  try {
    const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
    if (!("properties" in db)) {
      return { success: false, message: "无法读取数据库表结构" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = db.properties as Record<string, any>;

    const properties: Record<string, unknown> = {};
    const skipped: string[] = [];
    let titleValue = "";

    for (const [name, def] of Object.entries(schema)) {
      const type = (def.type ?? "") as string;
      const raw = values[name];
      const asArray = Array.isArray(raw) ? raw : [];
      const text = Array.isArray(raw) ? raw.join(",") : (raw ?? "").trim();

      if (type === "title") {
        titleValue = text;
        properties[name] = { title: richText(text) };
        continue;
      }

      // 其余列：没传值就跳过，创建时不写空值
      if (raw === undefined) continue;

      switch (type) {
        case "rich_text":
          if (text) properties[name] = { rich_text: richText(text) };
          break;
        case "number": {
          const n = toNumber(text);
          if (n !== null) properties[name] = { number: n };
          break;
        }
        case "select":
          if (text) properties[name] = { select: { name: text } };
          break;
        case "multi_select":
          if (asArray.length > 0) {
            properties[name] = { multi_select: asArray.map((n) => ({ name: n })) };
          }
          break;
        case "url":
          if (text) {
            properties[name] = {
              url: /^https?:\/\//i.test(text) ? text : `https://${text}`,
            };
          }
          break;
        case "files":
          if (text) properties[name] = { files: toExternalFiles(text) };
          break;
        case "date":
          if (text) properties[name] = { date: { start: text } };
          break;
        case "checkbox":
          properties[name] = { checkbox: text === "true" || text === "1" };
          break;
        default:
          skipped.push(name);
      }
    }

    if (!titleValue) {
      return { success: false, message: "标题列不能为空" };
    }

    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: properties as any,
    });

    revalidatePath("/");
    revalidatePath("/leaderboard");

    return {
      success: true,
      message:
        skipped.length > 0
          ? `已创建「${titleValue}」（跳过不支持的列：${skipped.join("、")}）`
          : `已创建「${titleValue}」`,
      pageId: page.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `创建失败: ${msg}` };
  }
}
