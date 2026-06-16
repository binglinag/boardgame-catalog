import Link from "next/link";
import Image from "next/image";
import type { BoardGame } from "@/types/game";

function StatusBadge({ status }: { status: string[] }) {
  if (status.length === 0) return null;

  const styleMap: Record<string, string> = {
    已收藏: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    想玩: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    已玩过: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    不好玩: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  // 取第一个状态显示
  const first = status[0];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styleMap[first] ?? ""}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current dreamy-pulse" />
      {first}
      {status.length > 1 && (
        <span className="text-[10px] opacity-60">+{status.length - 1}</span>
      )}
    </span>
  );
}

export default function GameCard({ game, sessionCount }: { game: BoardGame; sessionCount?: number }) {
  const plays = sessionCount ?? 0;
  return (
    <Link href={`/${game.id}`} className="group block">
      <article className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-gray-800/30 backdrop-blur-md border border-white/40 dark:border-white/5 shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_16px_48px_rgba(139,92,246,0.18)] dark:hover:shadow-[0_16px_48px_rgba(139,92,246,0.1)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] card-shimmer">
        {/* 封面图区域 */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 via-indigo-50 to-pink-50 dark:from-violet-900/20 dark:via-indigo-900/10 dark:to-pink-900/10">
              <span className="text-6xl font-bold text-violet-300/50 dark:text-violet-700/30">
                {game.title.charAt(0)}
              </span>
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-violet-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* 评分星芒 */}
          {game.rating !== null && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-gray-900/70 backdrop-blur-md border border-white/30 dark:border-white/5 text-sm font-bold text-violet-700 dark:text-violet-300 shadow-[0_2px_12px_rgba(139,92,246,0.15)]">
              {game.rating}
            </div>
          )}
        </div>

        {/* 信息区域 */}
        <div className="p-4 bg-white/30 dark:bg-transparent">
          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">
            {game.title}
          </h3>

          {game.nameEn && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 truncate">
              {game.nameEn}
            </p>
          )}

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {game.players && (
              <span className="text-xs text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md">
                {game.players}人
              </span>
            )}
            {game.bestPlayers && (
              <span className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                最佳 {game.bestPlayers}人
              </span>
            )}
            {game.playTime && (
              <span className="text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                {game.playTime}
              </span>
            )}
            {game.weight !== null && (
              <span className="text-xs text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                重度 {game.weight}
              </span>
            )}
            {game.year && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{game.year}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={game.status} />
            {plays > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-700/30 px-1.5 py-0.5 rounded-md">
                已玩 {plays} 次
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
