"use client";

import { useState } from "react";
import CustomSelect from "./custom-select";
import { WEIGHT_TIERS } from "@/lib/weight-filter";
import type { GameStatus, SortOption, WeightFilter } from "@/types/game";

interface FilterBarProps {
  status: GameStatus | "全部";
  tag: string | null;
  playerCount: number | "全部";
  bestPlayerCount: number | "全部";
  weightFilter: WeightFilter;
  sortBy: SortOption;
  allTags: string[];
  onStatusChange: (status: GameStatus | "全部") => void;
  onTagChange: (tag: string | null) => void;
  onPlayerCountChange: (count: number | "全部") => void;
  onBestPlayerCountChange: (count: number | "全部") => void;
  onWeightChange: (weight: WeightFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

const STATUS_OPTIONS: Array<GameStatus | "全部"> = ["全部", "已收藏", "想玩", "已玩过", "不好玩"];

const PLAYER_COUNT_OPTIONS: Array<{ value: number | "全部"; label: string }> = [
  { value: "全部", label: "全部" },
  { value: 1, label: "1人" },
  { value: 2, label: "2人" },
  { value: 3, label: "3人" },
  { value: 4, label: "4人" },
  { value: 5, label: "5人" },
  { value: 6, label: "6人" },
  { value: 7, label: "7人+" },
];

// 最佳人数沿用同一批人数档位
const BEST_COUNT_OPTIONS: Array<{ value: number | "全部"; label: string }> = [
  { value: "全部", label: "全部" },
  ...PLAYER_COUNT_OPTIONS.slice(1),
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "评分" },
  { value: "weight", label: "重度" },
  { value: "year", label: "年份" },
  { value: "title", label: "名称" },
  { value: "playCount", label: "游玩次数" },
];

/**
 * 筛选项
 *
 * 旧实现按组给了五套配色（紫 / 琥珀 / 绿 / 洋红 / 靛蓝），
 * 一行里能出现五种高饱和色块，色板完全失控。
 * 现在只有一种强调色：选中砖红实心，未选中透明描边。
 */
function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`r-chip-sm px-2.5 py-1 rounded text-[12.5px] whitespace-nowrap border transition-colors ${
        active
          ? "bg-accent-600 text-white border-accent-600"
          : "bg-transparent text-ink-2 dark:text-gray-400 border-line-strong dark:border-gray-600 hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-300"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {/* 复古皮肤下这行字直接压在毡布上，需 r-on-felt-sub 提升对比度 */}
      <span className="r-on-felt-sub w-9 shrink-0 pt-1 text-[11px] tracking-wide text-ink-3 dark:text-gray-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function FilterBar({
  status, tag, playerCount, bestPlayerCount, weightFilter, sortBy, allTags,
  onStatusChange, onTagChange, onPlayerCountChange, onBestPlayerCountChange,
  onWeightChange, onSortChange,
}: FilterBarProps) {
  // 移动端默认折叠，桌面端始终展开（由 sm: 断点控制，不依赖此状态）
  const [expanded, setExpanded] = useState(false);

  const activeCount =
    (status !== "全部" ? 1 : 0) +
    (playerCount !== "全部" ? 1 : 0) +
    (bestPlayerCount !== "全部" ? 1 : 0) +
    (weightFilter !== "全部" ? 1 : 0) +
    (tag !== null ? 1 : 0);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "评分";

  return (
    <div className="flex flex-col gap-3">
      {/* 移动端折叠开关（桌面端隐藏） */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="sm:hidden w-full flex items-center justify-between gap-3
          px-3 py-2 rounded-md text-[13px]
          bg-white dark:bg-gray-800 border border-line dark:border-gray-700
          text-ink-2 dark:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-ink-3 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 6h18M7 12h10M10 18h4" />
          </svg>
          筛选
          {activeCount > 0 && (
            <span className="min-w-[17px] h-[17px] px-1 inline-flex items-center justify-center
              rounded bg-accent-600 text-white text-[10.5px] leading-none tnum">
              {activeCount}
            </span>
          )}
        </span>

        <span className="flex items-center gap-1.5 text-[11px] text-ink-3 dark:text-gray-500">
          按{sortLabel}排序
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* 筛选主体：移动端按展开状态显隐，桌面端常显 */}
      <div className={`${expanded ? "flex" : "hidden"} sm:flex flex-col gap-2.5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <FilterRow label="状态">
              {STATUS_OPTIONS.map((s) => (
                <ChipButton key={s} active={status === s} onClick={() => onStatusChange(s)}>
                  {s}
                </ChipButton>
              ))}
            </FilterRow>

            <FilterRow label="人数">
              {PLAYER_COUNT_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.label}
                  active={playerCount === opt.value}
                  onClick={() => onPlayerCountChange(opt.value)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </FilterRow>

            <FilterRow label="最佳">
              {BEST_COUNT_OPTIONS.map((opt) => (
                <ChipButton
                  key={`best-${opt.label}`}
                  active={bestPlayerCount === opt.value}
                  onClick={() => onBestPlayerCountChange(opt.value)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </FilterRow>

            <FilterRow label="重度">
              <ChipButton
                active={weightFilter === "全部"}
                onClick={() => onWeightChange("全部")}
              >
                全部
              </ChipButton>
              {WEIGHT_TIERS.map((tier) => (
                <ChipButton
                  key={tier.value}
                  active={weightFilter === tier.value}
                  onClick={() => onWeightChange(tier.value)}
                >
                  {tier.label}
                </ChipButton>
              ))}
            </FilterRow>

            {allTags.length > 0 && (
              <FilterRow label="标签">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto sm:max-h-none sm:overflow-visible">
                  <ChipButton active={tag === null} onClick={() => onTagChange(null)}>
                    全部
                  </ChipButton>
                  {allTags.map((t) => (
                    <ChipButton
                      key={t}
                      active={tag === t}
                      onClick={() => onTagChange(tag === t ? null : t)}
                    >
                      {t}
                    </ChipButton>
                  ))}
                </div>
              </FilterRow>
            )}
          </div>

          {/* 排序：桌面端固定在右侧 */}
          <div className="hidden sm:block shrink-0 pt-0.5">
            <CustomSelect
              value={sortBy}
              options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: `按${opt.label}排序` }))}
              onChange={(v) => onSortChange(v as SortOption)}
              className="w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
