/**
 * 图鉴编号的显示格式
 *
 * 单独放在这里是为了让「详情页」这类纯展示组件不必 import catalog-number
 * （那边会在模块顶层创建 Notion 客户端）。
 */

/** 补零到三位：37 → "037"，超过 999 就自然溢出 */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return String(Math.trunc(n)).padStart(3, "0");
}

/** ISO 时间戳 → "2025-09-14"，取不到就返回空串 */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** 从 BGG 链接里抠出游戏 id */
export function bggIdOf(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/boardgame\/(\d+)/i) ?? url.match(/\/(\d{3,})(?:[/?#]|$)/);
  return m ? m[1] : null;
}
