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
  { value: "全部", label: "全部人数" },
  { value: 1, label: "1人" },
  { value: 2, label: "2人" },
  { value: 3, label: "3人" },
  { value: 4, label: "4人" },
  { value: 5, label: "5人" },
  { value: 6, label: "6人" },
  { value: 7, label: "7人+" },
];

// 最佳人数沿用同一批人数档位，只把「全部」的文案换掉以示区分
const BEST_COUNT_OPTIONS: Array<{ value: number | "全部"; label: string }> = [
  { value: "全部", label: "全部最佳" },
  ...PLAYER_COUNT_OPTIONS.slice(1),
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "评分" },
  { value: "weight", label: "重度" },
  { value: "year", label: "年份" },
  { value: "title", label: "名称" },
  { value: "playCount", label: "游玩次数" },
];

/* ── 小 Token 按钮 ── */
function ChipButton({
  active,
  onClick,
  children,
  color = "violet",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "violet" | "amber" | "emerald" | "rose" | "indigo";
}) {
  const colorMap = {
    violet: {
      active: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700/30",
      idle:  "bg-white/50 text-gray-500 border-white/40 hover:border-violet-300/60 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-violet-700/40",
    },
    amber: {
      active: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700/30",
      idle:  "bg-white/50 text-gray-500 border-white/40 hover:border-amber-300/60 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-amber-700/40",
    },
    emerald: {
      active: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700/30",
      idle:  "bg-white/50 text-gray-500 border-white/40 hover:border-emerald-300/60 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-emerald-700/40",
    },
    rose: {
      active: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700/30",
      idle:  "bg-white/50 text-gray-500 border-white/40 hover:border-rose-300/60 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-rose-700/40",
    },
    indigo: {
      active: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700/30",
      idle:  "bg-white/50 text-gray-500 border-white/40 hover:border-indigo-300/60 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-indigo-700/40",
    },
  };

  const cls = colorMap[color];

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`r-chip-sm px-3 py-1 rounded-xl text-sm font-medium border backdrop-blur-sm transition-all duration-300 ${
        active ? cls.active + " shadow-sm" : cls.idle
      }`}
    >
      {children}
    </button>
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
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* 移动端折叠开关（桌面端隐藏） */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="sm:hidden w-full flex items-center justify-between gap-3
          px-4 py-2.5 rounded-xl text-sm font-medium
          bg-white/50 dark:bg-white/5 backdrop-blur-sm
          border border-white/40 dark:border-white/10
          text-gray-600 dark:text-gray-300
          active:scale-[0.99] transition-all duration-200"
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-violet-500 dark:text-violet-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 6h18M7 12h10M10 18h4" />
          </svg>
          筛选
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center
              rounded-full bg-violet-500 text-white text-[11px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          按{sortLabel}排序
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* 筛选主体：移动端按展开状态显隐，桌面端常显 */}
      <div
        className={`${expanded ? "flex" : "hidden"} sm:flex flex-col gap-4 animate-fade-in`}
      >
        {/* 第一行：状态 + 人数 + 排序 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 状态筛选 */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <ChipButton key={s} active={status === s} onClick={() => onStatusChange(s)}>
                {s}
              </ChipButton>
            ))}
          </div>

          <span className="text-violet-200 dark:text-violet-800 mx-1 hidden sm:inline font-bold">•</span>

          {/* 人数筛选 */}
          <div className="flex gap-1.5 flex-wrap">
            {PLAYER_COUNT_OPTIONS.map((opt) => (
              <ChipButton
                key={opt.label}
                active={playerCount === opt.value}
                onClick={() => onPlayerCountChange(opt.value)}
                color="emerald"
              >
                {opt.label}
              </ChipButton>
            ))}
          </div>

          <span className="text-violet-200 dark:text-violet-800 mx-1 hidden sm:inline font-bold">•</span>

          {/* 最佳人数筛选（只看 bestPlayers，不看支持人数范围） */}
          <div className="flex gap-1.5 flex-wrap">
            {BEST_COUNT_OPTIONS.map((opt) => (
              <ChipButton
                key={`best-${opt.label}`}
                active={bestPlayerCount === opt.value}
                onClick={() => onBestPlayerCountChange(opt.value)}
                color="indigo"
              >
                {opt.label}
              </ChipButton>
            ))}
          </div>

          <span className="text-violet-200 dark:text-violet-800 mx-1 hidden sm:inline font-bold">•</span>

          {/* 重度筛选 */}
          <div className="flex gap-1.5 flex-wrap">
            <ChipButton
              active={weightFilter === "全部"}
              onClick={() => onWeightChange("全部")}
              color="rose"
            >
              全部重度
            </ChipButton>
            {WEIGHT_TIERS.map((tier) => (
              <ChipButton
                key={tier.value}
                active={weightFilter === tier.value}
                onClick={() => onWeightChange(tier.value)}
                color="rose"
              >
                {tier.label}
              </ChipButton>
            ))}
          </div>

          <span className="text-violet-200 dark:text-violet-800 mx-1 hidden sm:inline font-bold">•</span>

          {/* 排序 */}
          <CustomSelect
            value={sortBy}
            options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: `按${opt.label}排序` }))}
            onChange={(v) => onSortChange(v as SortOption)}
            className="w-32"
          />
        </div>

        {/* 第二行：标签筛选（移动端限制高度，避免撑满屏幕） */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto
            sm:max-h-none sm:overflow-visible">
            <ChipButton active={tag === null} onClick={() => onTagChange(null)} color="amber">
              全部标签
            </ChipButton>
            {allTags.map((t) => (
              <ChipButton
                key={t}
                active={tag === t}
                onClick={() => onTagChange(tag === t ? null : t)}
                color="amber"
              >
                {t}
              </ChipButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
