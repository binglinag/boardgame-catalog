"use client";

import CustomSelect from "./custom-select";
import type { GameStatus, SortOption } from "@/types/game";

interface FilterBarProps {
  status: GameStatus | "全部";
  tag: string | null;
  playerCount: number | "全部";
  sortBy: SortOption;
  allTags: string[];
  onStatusChange: (status: GameStatus | "全部") => void;
  onTagChange: (tag: string | null) => void;
  onPlayerCountChange: (count: number | "全部") => void;
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
  { value: 6, label: "6人+" },
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
  color?: "violet" | "amber" | "emerald";
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
  };

  const cls = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-xl text-sm font-medium border backdrop-blur-sm transition-all duration-300 ${
        active ? cls.active + " shadow-sm" : cls.idle
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  status, tag, playerCount, sortBy, allTags,
  onStatusChange, onTagChange, onPlayerCountChange, onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
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

        {/* 排序 */}
        <CustomSelect
          value={sortBy}
          options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: `按${opt.label}排序` }))}
          onChange={(v) => onSortChange(v as SortOption)}
          className="w-32"
        />
      </div>

      {/* 第二行：标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
  );
}
