import type { BoardGame, WeightFilter } from "@/types/game";

/**
 * 重度档位：左闭右开，保证边界不重叠（2.5 归「中」，不会同时进「轻」）
 * 分档参考 BGG 社区习惯：≤2.5 轻策 / 2.5-3.5 中策 / ≥3.5 重策
 */
export const WEIGHT_TIERS: Array<{
  value: Exclude<WeightFilter, "全部">;
  label: string;
  min: number;
  max: number;
}> = [
  { value: "轻", label: "轻 ≤2.5", min: 0, max: 2.5 },
  { value: "中", label: "中 2.5-3.5", min: 2.5, max: 3.5 },
  { value: "重", label: "重 ≥3.5", min: 3.5, max: Number.POSITIVE_INFINITY },
];

/** 判断游戏是否落在指定重度档位；重度为空的游戏只在「全部」下显示 */
export function matchesWeight(
  game: Pick<BoardGame, "weight">,
  filter: WeightFilter,
): boolean {
  if (filter === "全部") return true;

  const w = game.weight;
  if (typeof w !== "number") return false;

  const tier = WEIGHT_TIERS.find((t) => t.value === filter);
  if (!tier) return true;

  return w >= tier.min && w < tier.max;
}
