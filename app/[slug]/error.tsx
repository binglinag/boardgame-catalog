"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GameError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Detail Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center">
          <span className="text-2xl">🎲</span>
        </div>
        <h2 className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-2">
          加载失败
        </h2>
        <p className="text-sm text-violet-400 dark:text-violet-500 mb-6">
          桌游数据暂时无法加载，请稍后重试
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium
            shadow-lg shadow-violet-600/25 transition-all
            hover:shadow-xl active:scale-95"
        >
          刷新重试
        </button>
      </div>
    </div>
  );
}
