"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", resolved === "dark");
  document.body.classList.toggle("dark", resolved === "dark");
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cycle = () => {
    const next: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
    const newTheme = next[theme];
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) return <div className="w-9 h-9" />;

  const icon = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻";

  return (
    <button
      onClick={cycle}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-white/50 dark:bg-white/5 backdrop-blur-md
        border border-white/40 dark:border-white/10
        hover:scale-110 active:scale-95 transition-all duration-200
        text-sm shadow-[0_2px_8px_rgba(139,92,246,0.06)]"
      title={`当前: ${theme === "light" ? "浅色" : theme === "dark" ? "深色" : "跟随系统"}`}
      aria-label="切换主题"
    >
      {icon}
    </button>
  );
}
