import Link from "next/link";

/**
 * 顶栏「新增桌游」入口
 * 直接跳转到 /new 独立表单页，表单按 Notion 表结构动态生成
 */
export default function AddGameButton() {
  return (
    <Link
      href="/new"
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-white/50 dark:bg-white/5 backdrop-blur-md
        border border-white/40 dark:border-white/10
        hover:bg-amber-50 dark:hover:bg-amber-900/20
        hover:scale-110 active:scale-95 transition-all duration-200
        shadow-[0_2px_8px_rgba(139,92,246,0.06)]"
      title="新增桌游"
      aria-label="新增桌游"
    >
      <svg
        className="w-4 h-4 text-amber-500 dark:text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  );
}
