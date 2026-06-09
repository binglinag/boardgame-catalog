"use client";

import { useState } from "react";

interface Props {
  price: number;
  notes: string;
}

export default function PriceToggle({ price, notes }: Props) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 p-3 w-full text-left hover:border-violet-200 dark:hover:border-violet-700/30 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">💰</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">购买价格</span>
          {notes && (
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          ¥{price}
        </p>
      </button>

      {showNotes && notes && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/20 text-xs text-gray-600 dark:text-gray-300 animate-scale-in">
          {notes}
        </div>
      )}
    </div>
  );
}
