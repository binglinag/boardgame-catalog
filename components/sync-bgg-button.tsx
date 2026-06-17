"use client";

import { useState } from "react";
import { syncBgg } from "@/app/actions/sync";

export default function SyncBggButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    const password = window.prompt("请输入管理员密码以同步 BGG 数据");
    if (password === null) return;

    setLoading(true);
    try {
      const result = await syncBgg(password);
      const lines: string[] = [];
      lines.push(`共 ${result.total} 款游戏，已更新 ${result.updated} 款`);
      if (result.skipped > 0) lines.push(`跳过 ${result.skipped} 款（无链接或已完整）`);
      if (result.errors.length > 0) {
        lines.push(`\n--- 错误 ---`);
        for (const e of result.errors.slice(0, 5)) lines.push(`❌ ${e}`);
        if (result.errors.length > 5) lines.push(`... 还有 ${result.errors.length - 5} 条`);
      }
      if (result.updated > 0) lines.push("\n请刷新页面查看更新。");
      alert(lines.join("\n"));
    } catch {
      alert("同步失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-white/50 dark:bg-white/5 backdrop-blur-md
        border border-white/40 dark:border-white/10
        hover:bg-violet-50 dark:hover:bg-violet-900/20
        hover:scale-110 active:scale-95 transition-all duration-200
        shadow-[0_2px_8px_rgba(139,92,246,0.06)]
        disabled:opacity-50 disabled:hover:scale-100"
      title="同步BGG"
      aria-label="同步BGG数据"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-violet-500 dark:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </button>
  );
}
