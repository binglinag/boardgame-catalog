"use client";

import { useState } from "react";
import { addGameByBggUrl } from "@/app/actions/games";

export default function AddGameButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const password = window.prompt("请输入管理员密码");
    if (password === null) return;

    setLoading(true);
    try {
      const result = await addGameByBggUrl(password, url.trim());
      if (result.success) {
        setUrl("");
        setOpen(false);
      }
      alert(result.message);
    } catch {
      alert("添加失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 触发器按钮 */}
      <button
        onClick={() => { setOpen(true); setUrl(""); setMessage(""); }}
        className="w-9 h-9 flex items-center justify-center rounded-xl
          bg-white/50 dark:bg-white/5 backdrop-blur-md
          border border-white/40 dark:border-white/10
          hover:bg-amber-50 dark:hover:bg-amber-900/20
          hover:scale-110 active:scale-95 transition-all duration-200
          shadow-[0_2px_8px_rgba(139,92,246,0.06)]"
        title="新增桌游"
        aria-label="新增桌游"
      >
        <svg className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 弹窗 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">新增桌游</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  BGG 链接
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://boardgamegeek.com/boardgame/224517/wingspan"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
                    bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm
                    text-gray-900 dark:text-white text-sm
                    focus:ring-2 focus:ring-violet-400/30 outline-none
                    transition-all duration-200"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  粘贴 BGG 游戏页链接，自动写入 Notion 的「BGG链接」列。
                  之后用 🔄 同步 BGG 即可自动抓取其他信息。
                </p>
              </div>

              {message && (
                <p className={`text-sm ${message.includes("失败") || message.includes("错误")
                  ? "text-red-500"
                  : "text-emerald-500"}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl
                  bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm
                  shadow-lg shadow-violet-600/25 transition-all duration-200
                  hover:shadow-xl hover:shadow-violet-600/30 active:scale-95
                  disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:scale-100"
              >
                {loading ? "添加中..." : "添加到 Notion"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
