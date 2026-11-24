"use client";

import { useState, useCallback } from "react";
import type { BoardGame } from "@/types/game";

interface Props {
  games: BoardGame[];
}

export default function RandomPicker({ games }: Props) {
  const [picked, setPicked] = useState<BoardGame | null>(null);
  const [picking, setPicking] = useState(false);

  const pick = useCallback(() => {
    if (games.length === 0) return;

    setPicking(true);
    // 随机动画：快速切换几个名字后定格
    let count = 0;
    const max = Math.min(15, games.length);
    const interval = setInterval(() => {
      const random = games[Math.floor(Math.random() * games.length)];
      setPicked(random);
      count++;
      if (count >= max) {
        clearInterval(interval);
        setPicking(false);
      }
    }, 60);
  }, [games]);

  return (
    <div className="relative">
      <button
        onClick={pick}
        disabled={games.length === 0 || picking}
        className="r-btn r-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md
          bg-accent-600 hover:bg-accent-700 text-white
          text-[12.5px] font-normal
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
          <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        {picking ? "挑选中…" : "帮我选一款"}
      </button>

      {picked && (
        <div className="r-card mt-3 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-line dark:border-gray-700 shadow-card animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-serif text-[15px] font-semibold text-ink dark:text-gray-100">
                {picked.title}
              </p>
              {picked.nameEn && (
                <p className="text-[11px] text-ink-3 dark:text-gray-500 italic mt-0.5 truncate">
                  {picked.nameEn}
                </p>
              )}
              <p className="text-[11.5px] text-ink-2 dark:text-gray-400 mt-1 tnum">
                {picked.players && `${picked.players}人`}
                {picked.playTime && ` · ${picked.playTime}`}
                {picked.rating !== null && ` · 评分 ${picked.rating}`}
              </p>
            </div>
            <a
              href={`/${picked.id}`}
              className="flex-shrink-0 px-3 py-1.5 rounded bg-accent-600 hover:bg-accent-700 text-white text-[12px] transition-colors"
            >
              去看看
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
