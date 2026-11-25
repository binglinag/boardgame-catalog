"use client";

import type { Player } from "@/types/player";

/**
 * 玩家多选筛选
 *
 * 排行榜和「对局记录」页共用同一套筹码：点谁选谁，可多选，
 * 第一个是「全部」。选中集合由父组件持有，这里只负责渲染和回调。
 */
export default function PlayerFilter({
  players,
  selected,
  onToggle,
  onClear,
}: {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const chip = (active: boolean) =>
    `r-chip-sm px-2.5 py-1 rounded text-[12.5px] border transition-colors ${
      active
        ? "bg-accent-600 text-white border-accent-600"
        : "bg-transparent text-ink-2 dark:text-gray-400 border-line-strong dark:border-gray-600 hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-300"
    }`;

  return (
    <>
      <span className="r-on-felt-sub text-[11.5px] tracking-wide text-ink-3 dark:text-gray-500 mr-0.5">
        选择玩家
      </span>

      <button
        type="button"
        onClick={onClear}
        aria-pressed={selected.size === 0}
        className={chip(selected.size === 0)}
      >
        全部
      </button>

      {/* 按玩家表顺序渲染，选中后不会因为重算分数而跳位置 */}
      {players.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onToggle(p.id)}
          aria-pressed={selected.has(p.id)}
          className={chip(selected.has(p.id))}
        >
          {p.name}
        </button>
      ))}
    </>
  );
}
