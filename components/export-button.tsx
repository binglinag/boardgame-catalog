"use client";

import { useState } from "react";
import { exportBackup } from "@/app/actions/export";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    const password = window.prompt("请输入管理员密码以导出备份");
    if (password === null) return;

    setLoading(true);
    try {
      const result = await exportBackup(password);
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `boardgame-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      alert(result.message);
    } catch {
      alert("导出失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-white/50 dark:bg-white/5 backdrop-blur-md
        border border-white/40 dark:border-white/10
        hover:bg-emerald-50 dark:hover:bg-emerald-900/20
        hover:scale-110 active:scale-95 transition-all duration-200
        shadow-[0_2px_8px_rgba(139,92,246,0.06)]
        disabled:opacity-50 disabled:hover:scale-100"
      title="导出备份"
      aria-label="导出备份"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
    </button>
  );
}
