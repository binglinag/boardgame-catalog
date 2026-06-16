"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center">
          <span className="text-3xl">😴</span>
        </div>
        <h2 className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-2">
          数据暂时不可用
        </h2>
        <p className="text-sm text-violet-400 dark:text-violet-500 mb-6">
          Notion 可能在维护中，或网络连接异常
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium
            shadow-lg shadow-violet-600/25 transition-all
            hover:shadow-xl active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新重试
        </button>
      </div>
    </div>
  );
}
