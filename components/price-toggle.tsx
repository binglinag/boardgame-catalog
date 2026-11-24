"use client";

import { useState } from "react";

interface Props {
  price: number;
  notes: string;
}

/**
 * 价格格：并入详情页的信息带，不再单独做成一张卡
 * 有备注时点一下在下方浮出说明
 */
export default function PriceToggle({ price, notes }: Props) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="relative min-w-[88px]">
      <button
        type="button"
        onClick={() => notes && setShowNotes(!showNotes)}
        aria-expanded={showNotes}
        className="w-full text-left px-3.5 py-2.5
          border-r border-line dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-800/60
          transition-colors"
      >
        <span className="flex items-center gap-1 text-[10px] tracking-wide text-ink-3 dark:text-gray-500 mb-0.5">
          价格
          {notes && (
            <svg
              className={`w-2.5 h-2.5 transition-transform duration-150 ${showNotes ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          )}
        </span>
        <span className="block text-[12.5px] text-ink dark:text-gray-100 tnum">
          ¥{price}
        </span>
      </button>

      {showNotes && notes && (
        <div
          className="absolute z-20 left-0 top-full mt-1 w-56 px-3 py-2 rounded-md
            bg-white dark:bg-gray-800 border border-line dark:border-gray-700
            shadow-pop text-[11.5px] leading-relaxed text-ink-2 dark:text-gray-300
            animate-fade-in"
        >
          {notes}
        </div>
      )}
    </div>
  );
}
