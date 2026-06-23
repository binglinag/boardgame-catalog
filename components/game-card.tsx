"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { BoardGame } from "@/types/game";

/* ── 状态 Token ── */
function StatusBadge({ status }: { status: string[] }) {
  if (status.length === 0) return null;
  const first = status[0];
  const clsMap: Record<string, string> = {
    已收藏: "status-token-collected",
    想玩:   "status-token-want",
    已玩过: "status-token-played",
    不好玩: "status-token-bad",
  };

  return (
    <span className={`status-token ${clsMap[first] ?? ""}`}>
      {first}
      {status.length > 1 && (
        <span className="opacity-50">+{status.length - 1}</span>
      )}
    </span>
  );
}

/* ── 星级评分 ── */
function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating / 2); // 10分制转5星
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <div key={i} className={`rating-star ${i < full ? "filled" : "empty"}`} />
    );
  }
  return <div className="rating-stars">{stars}</div>;
}

/* ── 重度条 ── */
function WeightBar({ weight }: { weight: number }) {
  const pct = Math.min((weight / 5) * 100, 100);
  return (
    <div className="weight-bar w-14">
      <div className="weight-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function GameCard({ game, sessionCount, priority }: { game: BoardGame; sessionCount?: number; priority?: boolean }) {
  const router = useRouter();
  const plays = sessionCount ?? 0;

  return (
    <Link
      href={`/${game.id}`}
      prefetch={true}
      onMouseEnter={() => router.prefetch(`/${game.id}`)}
      className="group block [perspective:1000px]"
    >
      <article className="game-card card-shimmer animate-[card-deal]">
        {/* ─ 封面图 ─ */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-violet-100 via-amber-50/30 to-emerald-50 dark:from-violet-950/20 dark:via-amber-950/5 dark:to-emerald-950/10">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 via-amber-50 to-emerald-50 dark:from-violet-900/20 dark:via-amber-900/5 dark:to-emerald-900/10">
              <span className="text-6xl font-black text-violet-300/40 dark:text-violet-700/25">
                {game.title.charAt(0)}
              </span>
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-violet-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* 评分 Token */}
          {game.rating !== null && (
            <div className="absolute top-3 right-3 token token-amber">
              {game.rating}
            </div>
          )}
        </div>

        {/* ─ 信息区 ─ */}
        <div className="p-4 pt-3.5 space-y-2">
          <h3 className="font-semibold text-[0.92rem] text-gray-900 dark:text-white leading-snug line-clamp-2">
            {game.title}
          </h3>

          {game.nameEn && (
            <p className="text-[0.68rem] text-gray-400 dark:text-gray-500 truncate -mt-1">
              {game.nameEn}
            </p>
          )}

          {/* 元数据 Token 行 */}
          <div className="flex items-center gap-2 flex-wrap">
            {game.players && (
              <span className="token token-indigo text-[0.68rem] min-w-[auto] h-[1.35rem] px-1.5">
                {game.players}人
              </span>
            )}
            {game.bestPlayers && (
              <span className="token token-emerald text-[0.68rem] min-w-[auto] h-[1.35rem] px-1.5">
                最佳{game.bestPlayers}人
              </span>
            )}
            {game.playTime && (
              <span className="inline-flex items-center text-[0.65rem] text-gray-400 dark:text-gray-500">
                {game.playTime}
              </span>
            )}
          </div>

          {/* 重度 + 年份 */}
          <div className="flex items-center gap-2.5">
            {game.weight !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[0.66rem] font-medium text-violet-500/60 dark:text-violet-400/60 uppercase tracking-wider">重度</span>
                <WeightBar weight={game.weight} />
                <span className="text-[0.66rem] font-semibold text-violet-600/80 dark:text-violet-300/80 tabular-nums">
                  {game.weight.toFixed(1)}
                </span>
              </div>
            )}
            {game.year && (
              <span className="text-[0.62rem] text-gray-400 dark:text-gray-500 ml-auto">
                {game.year}
              </span>
            )}
          </div>

          {/* 底部：状态 + 游玩次数 */}
          <div className="flex items-center justify-between pt-1">
            <StatusBadge status={game.status} />
            {plays > 0 && (
              <span className="token token-violet text-[0.68rem] min-w-[auto] h-[1.35rem] px-2">
                已玩{plays}次
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
