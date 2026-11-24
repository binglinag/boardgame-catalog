import type { PlaySession, ScoringTemplate } from "@/types/session";

/**
 * 模板的展示元信息
 *
 * 原先每个模板配一种颜色（紫/蓝/绿/琥珀/玫红/靛蓝）再加一个 emoji，
 * 六种模板排在一起就是一块调色板。现在统一成中性描边小标，
 * 靠 label 文字区分——模板名本身已经足够表意。
 */
const NEUTRAL_BADGE =
  "border-line-strong text-ink-2 dark:border-gray-600 dark:text-gray-400";

export const TEMPLATE_META: Record<
  ScoringTemplate,
  { label: string; emoji: string; badge: string }
> = {
  标准计分: { label: "标准计分", emoji: "", badge: NEUTRAL_BADGE },
  胜负记录: { label: "胜负记录", emoji: "", badge: NEUTRAL_BADGE },
  排名顺序: { label: "排名顺序", emoji: "", badge: NEUTRAL_BADGE },
  单一赢家: { label: "单一赢家", emoji: "", badge: NEUTRAL_BADGE },
  合作胜负: { label: "合作胜负", emoji: "", badge: NEUTRAL_BADGE },
  战役叙事: { label: "战役叙事", emoji: "", badge: NEUTRAL_BADGE },
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
