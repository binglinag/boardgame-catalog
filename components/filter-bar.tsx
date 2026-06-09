"use client";

import type { GameStatus, SortOption } from "@/types/game";

interface FilterBarProps {
  status: GameStatus | "全部";
  tag: string | null;
  sortBy: SortOption;
  allTags: string[];
  onStatusChange: (status: GameStatus | "全部") => void;
  onTagChange: (tag: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

const STATUS_OPTIONS: Array<GameStatus | "全部"> = ["全部", "已收藏", "想玩", "已玩过", "不好玩"];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "评分" },
  { value: "weight", label: "重度" },
  { value: "year", label: "年份" },
  { value: "title", label: "名称" },
  { value: "playCount", label: "游玩次数" },
];

export default function FilterBar({
  status, tag, sortBy, allTags,
  onStatusChange, onTagChange, onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* 状态筛选 */}
        <div className="flex rounded-2xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 dark:border-white/5 p-1 gap-0.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                status === s
                  ? "bg-white dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 shadow-[0_2px_8px_rgba(139,92,246,0.15)]"
                  : "text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="text-violet-300 dark:text-violet-700 mx-1 hidden sm:inline">|</span>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-4 py-1.5 rounded-xl text-sm font-medium
            bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm text-violet-700 dark:text-violet-300
            border border-white/40 dark:border-white/5 outline-none cursor-pointer
            focus:ring-2 focus:ring-violet-400/30 transition-all"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              按{opt.label}排序
            </option>
          ))}
        </select>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onTagChange(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
              tag === null
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 shadow-[0_2px_8px_rgba(139,92,246,0.1)]"
                : "bg-white/40 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            }`}
          >
            全部标签
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => onTagChange(tag === t ? null : t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                tag === t
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 shadow-[0_2px_8px_rgba(139,92,246,0.1)]"
                  : "bg-white/40 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
