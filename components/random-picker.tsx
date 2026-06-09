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
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl
          bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500
          text-white font-medium text-sm
          shadow-lg shadow-violet-500/25
          hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105
          active:scale-95
          transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        {picking ? "挑选中..." : "帮我选一款"}
      </button>

      {picked && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/10 border border-violet-200/50 dark:border-violet-700/20 backdrop-blur-sm animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                {picked.title}
              </p>
              {picked.nameEn && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">
                  {picked.nameEn}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {picked.players && `${picked.players}人`}
                {picked.playTime && ` · ${picked.playTime}`}
                {picked.rating !== null && ` · 评分 ${picked.rating}`}
              </p>
            </div>
            <a
              href={`/${picked.id}`}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              去看看
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
