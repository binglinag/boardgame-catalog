import Link from "next/link";

/**
 * 顶栏「新增桌游」入口
 * 直接跳转到 /new 独立表单页，表单按 Notion 表结构动态生成
 */
export default function AddGameButton() {
  return (
    <Link
      href="/new"
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md
        border border-line dark:border-gray-700
        text-ink-2 dark:text-gray-400
        hover:border-line-strong hover:text-accent-700
        dark:hover:border-gray-600 dark:hover:text-accent-300
        transition-colors"
      title="新增桌游"
      aria-label="新增桌游"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  );
}
