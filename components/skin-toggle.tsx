"use client";

import { useEffect, useState } from "react";

export type Skin = "dreamy" | "retro";

const STORAGE_KEY = "skin";

/**
 * 外观主题切换：梦幻玻璃 ⇄ 复古桌游桌面
 * 只改 <html data-skin>，视觉全部由 CSS 接管，不触发重渲染
 */
export default function SkinToggle() {
  const [skin, setSkin] = useState<Skin>("dreamy");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Skin) || "dreamy";
    setSkin(saved);
    document.documentElement.dataset.skin = saved;
    setMounted(true);
  }, []);

  function toggle() {
    const next: Skin = skin === "retro" ? "dreamy" : "retro";
    setSkin(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.skin = next;
  }

  const isRetro = mounted && skin === "retro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isRetro}
      title={isRetro ? "切换到梦幻玻璃主题" : "切换到复古桌游主题"}
      aria-label={isRetro ? "切换到梦幻玻璃主题" : "切换到复古桌游主题"}
      className="r-icon-btn w-9 h-9 flex items-center justify-center rounded-xl
        bg-white/50 dark:bg-white/5 backdrop-blur-md
        border border-white/40 dark:border-white/10
        hover:scale-110 active:scale-95 transition-all duration-200
        shadow-[0_2px_8px_rgba(139,92,246,0.06)]"
    >
      {isRetro ? (
        // 骰子：复古主题中表示"当前在桌面上"
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
          <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      ) : (
        // 玻璃/棱镜：表示当前是梦幻主题
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 3l7 5.5v7L12 21l-7-5.5v-7L12 3z" strokeLinejoin="round" />
          <path d="M12 3v18M5 8.5l14 7M19 8.5l-14 7" opacity=".5" />
        </svg>
      )}
    </button>
  );
}
