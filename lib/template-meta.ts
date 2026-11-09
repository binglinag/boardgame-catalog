import type { PlaySession, ScoringTemplate } from "@/types/session";

/** 模板的展示元信息 */
export const TEMPLATE_META: Record<
  ScoringTemplate,
  { label: string; emoji: string; badge: string }
> = {
  标准计分: {
    label: "标准计分",
    emoji: "🔢",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  },
  胜负记录: {
    label: "胜负记录",
    emoji: "⚔️",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  },
  排名顺序: {
    label: "排名顺序",
    emoji: "🏅",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  单一赢家: {
    label: "单一赢家",
    emoji: "👑",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  },
  合作胜负: {
    label: "合作胜负",
    emoji: "🤝",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  },
  战役叙事: {
    label: "战役叙事",
    emoji: "📖",
    badge:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
  },
};

/** 统计各模板出现次数 */
export function countByTemplate(
  sessions: PlaySession[],
): Partial<Record<ScoringTemplate, number>> {
  const counts: Partial<Record<ScoringTemplate, number>> = {};
  for (const s of sessions) {
    counts[s.template] = (counts[s.template] ?? 0) + 1;
  }
  return counts;
}

/**
 * 取该游戏的主导模板（出现次数最多）
 * 用于决定详情页排行榜显示哪种指标
 */
export function getDominantTemplate(
  sessions: PlaySession[],
): ScoringTemplate | null {
  if (sessions.length === 0) return null;
  const counts = countByTemplate(sessions);

  let best: ScoringTemplate | null = null;
  let bestCount = -1;
  for (const [tpl, count] of Object.entries(counts) as Array<
    [ScoringTemplate, number]
  >) {
    if (count > bestCount) {
      best = tpl;
      bestCount = count;
    }
  }
  return best;
}

/** 混用模板时的说明文字，如「共 8 局 · 标准计分 5 / 战役叙事 3」 */
export function describeTemplateMix(sessions: PlaySession[]): string {
  const counts = countByTemplate(sessions);
  const entries = Object.entries(counts) as Array<[ScoringTemplate, number]>;
  if (entries.length <= 1) return `共 ${sessions.length} 局`;

  entries.sort((a, b) => b[1] - a[1]);
  const parts = entries.map(([tpl, n]) => `${TEMPLATE_META[tpl].label} ${n}`);
  return `共 ${sessions.length} 局 · ${parts.join(" / ")}`;
}
