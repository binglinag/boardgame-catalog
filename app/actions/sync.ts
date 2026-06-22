"use server";

import { Client } from "@notionhq/client";
import { extractBggId, fetchBggData } from "@/lib/bgg";

const notion = new Client({ auth: process.env.NOTION_API_KEY, fetch });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

function verifyPassword(pw: string): boolean {
  return pw === process.env.ADMIN_PASSWORD;
}

/** 格式化人数 "2-5" */
function formatPlayers(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max && min === max) return `${min}`;
  if (min && max) return `${min}-${max}`;
  return `${min ?? max}`;
}

/** 格式化时长：BGG 原始格式 "60-120min" */
function formatTime(bgg: { playingTime: number | null; minPlayTime: number | null; maxPlayTime: number | null }): string | null {
  const min = bgg.minPlayTime;
  const max = bgg.maxPlayTime;
  if (min && max && min !== max) return `${min}-${max}min`;
  if (bgg.playingTime) return `${bgg.playingTime}min`;
  if (min) return `${min}min`;
  return null;
}

export interface SyncResult {
  total: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: { title: string; changes: string[]; error?: string }[];
}

export async function syncBgg(password: string): Promise<SyncResult> {
  if (!verifyPassword(password)) {
    return { total: 0, updated: 0, skipped: 0, errors: ["密码错误"], details: [] };
  }

  const details: SyncResult["details"] = [];
  let total = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // 1. 查询所有桌游
    let pages: { id: string; props: Record<string, unknown> }[] = [];
    let cursor: string | undefined | null = undefined;

    do {
      const res = await notion.databases.query({
        database_id: DATABASE_ID,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      for (const p of res.results) {
        if ("properties" in p) {
          pages.push({ id: p.id, props: p.properties as Record<string, unknown> });
        }
      }
      cursor = res.next_cursor;
    } while (cursor);

    // 2. 逐条处理
    for (const page of pages) {
      total++;
      const bggUrl = getUrlFromProps(page.props);
      if (!bggUrl) {
        skipped++;
        continue;
      }

      const bggId = extractBggId(bggUrl);
      if (!bggId) {
        details.push({ title: getTitleFromProps(page.props), changes: [], error: `无法解析 BGG ID: ${bggUrl}` });
        errors.push(`无法解析 BGG ID: ${bggUrl}`);
        continue;
      }

      const bgg = await fetchBggData(bggId);
      if (!bgg) {
        details.push({ title: getTitleFromProps(page.props), changes: [], error: `BGG ${bggId} 抓取失败` });
        errors.push(`BGG ${bggId} 抓取失败`);
        continue;
      }

      // 构建更新 payload（只更新空字段）
      const properties: Record<string, unknown> = {};
      const changes: string[] = [];

      // 英文名
      if (bgg.titleEn && !getRichText(page.props["英文名"])) {
        properties["英文名"] = { rich_text: [{ text: { content: bgg.titleEn } }] };
        changes.push(`英文名 → ${bgg.titleEn}`);
      }

      // 玩家人数
      const players = formatPlayers(bgg.minPlayers, bgg.maxPlayers);
      if (players && !getRichText(page.props["玩家人数"])) {
        properties["玩家人数"] = { rich_text: [{ text: { content: players } }] };
        changes.push(`人数 → ${players}`);
      }

      // 时长
      const time = formatTime(bgg);
      if (time && !getRichText(page.props["时长"])) {
        properties["时长"] = { rich_text: [{ text: { content: time } }] };
        changes.push(`时长 → ${time}`);
      }

      // 中文名（BGG alternate name 中含中文的）
      if (bgg.titleCn && !getTitle(page.props["名称"])) {
        properties["名称"] = { title: [{ text: { content: bgg.titleCn } }] };
        changes.push(`名称 → ${bgg.titleCn}`);
      }

      // 出版年份
      if (bgg.yearPublished && !getNumber(page.props["出版年份"])) {
        properties["出版年份"] = { number: bgg.yearPublished };
        changes.push(`年份 → ${bgg.yearPublished}`);
      }

      // 设计师
      if (bgg.designers.length > 0 && !getRichText(page.props["设计师"])) {
        properties["设计师"] = { rich_text: [{ text: { content: bgg.designers.join("、") } }] };
        changes.push(`设计师 → ${bgg.designers.join("、")}`);
      }

      // 评分
      if (bgg.rating !== null && !getNumber(page.props["评分"])) {
        properties["评分"] = { number: bgg.rating };
        changes.push(`评分 → ${bgg.rating}`);
      }

      // 重度
      if (bgg.weight !== null && !getNumber(page.props["重度"])) {
        properties["重度"] = { number: bgg.weight };
        changes.push(`重度 → ${bgg.weight}`);
      }

      // 封面图
      const coverUrl = bgg.image || bgg.thumbnail;
      if (coverUrl && !getFilesProperty(page.props["封面图"])) {
        properties["封面图"] = { files: [{ external: { url: coverUrl }, name: "bgg-cover" }] };
        changes.push("封面图");
      }

      if (changes.length === 0) {
        details.push({ title: getTitleFromProps(page.props), changes: [], error: "" });
        skipped++;
        continue;
      }

      // 执行更新
      try {
        await notion.pages.update({ page_id: page.id, properties: properties as never });
        details.push({ title: getTitleFromProps(page.props), changes });
        updated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        details.push({ title: getTitleFromProps(page.props), changes: [], error: msg });
        errors.push(`${getTitleFromProps(page.props)}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`全局错误: ${msg}`);
  }

  return { total, updated, skipped, errors, details };
}

// ── 属性读取辅助 ──

function getRichText(prop: unknown): string {
  if (prop && typeof prop === "object" && "rich_text" in prop) {
    return ((prop as { rich_text: Array<{ plain_text: string }> }).rich_text ?? [])
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getNumber(prop: unknown): number | null {
  if (prop && typeof prop === "object" && "number" in prop) {
    const n = (prop as { number: number | null }).number;
    return n ?? null;
  }
  return null;
}

function getTitleFromProps(props: Record<string, unknown>): string {
  return getTitle(props["名称"]);
}

function getTitle(prop: unknown): string {
  if (prop && typeof prop === "object" && "title" in prop) {
    return ((prop as { title: Array<{ plain_text: string }> }).title ?? [])
      .map((t) => t.plain_text)
      .join("");
  }
  return "(未知)";
}

function getUrlFromProps(props: Record<string, unknown>): string | null {
  const names = ["BGG链接", "BGG 链接", "BGG连接", "BGG地址", "bgg链接", "BGG"];
  for (const n of names) {
    if (n in props) {
      const prop = props[n];
      if (prop && typeof prop === "object" && "url" in prop) {
        return (prop as { url: string | null }).url || null;
      }
    }
  }
  return null;
}

function getFilesProperty(prop: unknown): boolean {
  if (prop && typeof prop === "object" && "files" in prop) {
    const files = (prop as { files: unknown[] }).files ?? [];
    return files.length > 0;
  }
  return false;
}
