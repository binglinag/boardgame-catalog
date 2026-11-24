"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { BoardGame } from "@/types/game";
import { MeepleRow, BestPlayers } from "./retro-icons";

/* ── 状态标记 ── */
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

/* ── 重度：五个圆点，比进度条更省空间也更好扫 ── */
function WeightDots({ weight }: { weight: number }) {
  const filled = Math.round(weight);
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`重度 ${weight}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`block w-[5px] h-[5px] rounded-full ${
            i < filled ? "bg-accent-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
      ))}
    </span>
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
      className="group block h-full"
    >
      <article className="game-card flex flex-col h-full">
        {/* ─ 封面 ─ */}
        <div className="relative aspect-[4/5] overflow-hidden border-b border-line dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-serif text-5xl text-gray-300 dark:text-gray-700">
                {game.title.charAt(0)}
              </span>
            </div>
          )}

          {/* 评分：白底小黑字，跟封面形成对比但不抢眼 */}
          {game.rating !== null && (
            <div className="token token-amber absolute top-2 right-2 bg-white/95 dark:bg-gray-800/95">
              {game.rating}
            </div>
          )}
        </div>

        {/* ─ 信息 ─ */}
        <div className="p-4 pt-3 flex-1 flex flex-col">
          <h3 className="font-serif text-[0.9rem] font-semibold text-ink dark:text-gray-100 leading-snug line-clamp-2">
            {game.title}
          </h3>

          {game.nameEn && (
            <p className="text-[0.66rem] text-ink-3 dark:text-gray-500 truncate mt-0.5">
              {game.nameEn}
            </p>
          )}

          {/* ── 默认主题 ── */}
          <div className="dreamy-only mt-2.5 space-y-1">
            {/* 单行紧凑排布：窄卡片里带「人数」「时长」标签会换行拆字 */}
            <div className="flex items-center gap-1.5 text-[0.7rem] text-ink-2 dark:text-gray-400 whitespace-nowrap">
              {game.players && <span className="tnum">{game.players} 人</span>}
              {game.playTime && (
                <>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="tnum">{game.playTime}</span>
                </>
              )}
              {game.year && (
                <>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="tnum text-ink-3 dark:text-gray-500">{game.year}</span>
                </>
              )}
            </div>

            {game.weight !== null && (
              <div className="flex items-center gap-1.5 text-[0.7rem] text-ink-2 dark:text-gray-400">
                <span className="text-ink-3 dark:text-gray-500">重度</span>
                <WeightDots weight={game.weight} />
                <span className="tnum">{game.weight.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* ── 复古主题：米宝（重度）+ 骰子（最佳人数）+ 时长 ── */}
          <div
            className="retro-only flex-col gap-[7px] mt-2 text-[12px] leading-none"
            style={{ color: "var(--muted)" }}
          >
            {game.weight !== null && (
              <div className="flex items-center gap-2">
                <span className="w-7 flex-shrink-0">重度</span>
                <MeepleRow weight={game.weight} />
              </div>
            )}
            {game.bestPlayers && (
              <div className="flex items-center gap-2">
                <span className="w-7 flex-shrink-0">最佳</span>
                <BestPlayers best={game.bestPlayers} />
              </div>
            )}
            {(game.playTime || plays > 0) && (
              <div className="flex items-center gap-2">
                <span className="w-7 flex-shrink-0">时长</span>
                <span>
                  {game.playTime ?? "—"}
                  {plays > 0 && `，玩过 ${plays} 局`}
                </span>
              </div>
            )}
          </div>

          {/* ─ 底部：状态 + 局数 ─ */}
          <div className="flex items-end justify-between gap-2 mt-auto pt-2.5 border-t border-line dark:border-gray-700">
            <StatusBadge status={game.status} />
            {plays > 0 && (
              <span className="token token-violet flex-shrink-0">
                {plays} 局
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
