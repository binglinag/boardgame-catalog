"use client";

import type { BoardGame } from "@/types/game";
import type { PlaySession } from "@/types/session";

interface Props {
  games: BoardGame[];
  allSessions: PlaySession[];
  sessionCountByGame: Record<string, number>;
}

export default function StatsPanel({ games, allSessions, sessionCountByGame }: Props) {
  if (games.length === 0) return null;

  // 状态分布
  const statusBreakdown: Record<string, number> = {};
  for (const g of games) {
    for (const s of g.status) {
      statusBreakdown[s] = (statusBreakdown[s] ?? 0) + 1;
    }
  }

  // 评分分布
  const ratingBuckets = { "1-3": 0, "4-5": 0, "6-7": 0, "8-9": 0, "10": 0 };
  for (const g of games) {
    if (g.rating !== null) {
      if (g.rating <= 3) ratingBuckets["1-3"]++;
      else if (g.rating <= 5) ratingBuckets["4-5"]++;
      else if (g.rating <= 7) ratingBuckets["6-7"]++;
      else if (g.rating <= 9) ratingBuckets["8-9"]++;
      else ratingBuckets["10"]++;
    }
  }

  // 重度分布
  const weightBuckets = { "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0 };
  for (const g of games) {
    if (g.weight !== null) {
      if (g.weight <= 2) weightBuckets["1-2"]++;
      else if (g.weight <= 3) weightBuckets["2-3"]++;
      else if (g.weight <= 4) weightBuckets["3-4"]++;
      else weightBuckets["4-5"]++;
    }
  }

  // Top 5 标签
  const tagCount: Record<string, number> = {};
  for (const g of games) {
    for (const t of g.tags) {
      tagCount[t] = (tagCount[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 有 session 记录的游戏数
  const gamesWithSessions = Object.values(sessionCountByGame).filter((c) => c > 0).length;

  const maxRating = Math.max(...Object.values(ratingBuckets), 1);
  const maxWeight = Math.max(...Object.values(weightBuckets), 1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10 animate-fade-in">
      {/* 总数 */}
      <StatCard label="收藏桌游" value={games.length} suffix="款" />

      {/* 总对局 */}
      <StatCard label="总对局数" value={allSessions.length} suffix="场" />

      {/* 有过对局的游戏 */}
      <StatCard label="玩过桌游" value={gamesWithSessions} suffix="款" />

      {/* 平均评分 */}
      <StatCard
        label="平均评分"
        value={
          games.filter((g) => g.rating !== null).length > 0
            ? (
                games.reduce((s, g) => s + (g.rating ?? 0), 0) /
                games.filter((g) => g.rating !== null).length
              ).toFixed(1)
            : "-"
        }
        suffix="分"
      />

      {/* 平均重度 */}
      <StatCard
        label="平均重度"
        value={
          games.filter((g) => g.weight !== null).length > 0
            ? (
                games.reduce((s, g) => s + (g.weight ?? 0), 0) /
                games.filter((g) => g.weight !== null).length
              ).toFixed(1)
            : "-"
        }
        suffix="/5"
      />

      {/* 状态分布 */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* 评分分布 */}
          <MiniBarCard title="评分分布">
            {Object.entries(ratingBuckets).map(([label, count]) => (
              <Bar key={label} label={label} count={count} max={maxRating} />
            ))}
          </MiniBarCard>

          {/* 重度分布 */}
          <MiniBarCard title="重度分布">
            {Object.entries(weightBuckets).map(([label, count]) => (
              <Bar key={label} label={label} count={count} max={maxWeight} />
            ))}
          </MiniBarCard>

          {/* Top 标签 */}
          <MiniBarCard title="热门标签">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-[11.5px]">
                <span className="text-ink-2 dark:text-gray-300 truncate mr-2">{tag}</span>
                <span className="text-ink-3 dark:text-gray-500 tnum">{count}</span>
              </div>
            ))}
          </MiniBarCard>
        </div>
      </div>
    </div>
  );
}

/**
 * 统计小卡
 *
 * 原实现按用途给了五种渐变色（紫/靛/粉/琥珀/翠绿），一排五张卡就是一条彩虹。
 * 数字本身是主角，颜色只会抢注意力，所以统一成纸卡 + 墨色数字。
 */
function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix: string;
}) {
  return (
    <div className="r-card rounded-lg bg-white dark:bg-gray-800 border border-line dark:border-gray-700 px-3 py-2.5">
      <p className="text-[10.5px] tracking-wide text-ink-3 dark:text-gray-500 mb-0.5">{label}</p>
      <p className="tnum text-[19px] font-medium leading-tight text-ink dark:text-gray-100">
        {value}
        <span className="text-[11px] font-normal text-ink-3 dark:text-gray-500 ml-1">
          {suffix}
        </span>
      </p>
    </div>
  );
}

function MiniBarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-line dark:border-gray-700 px-3.5 py-3">
      <h4 className="text-[11px] tracking-wide text-ink-3 dark:text-gray-500 mb-2.5">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Bar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-ink-3 dark:text-gray-500 w-8 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700/60 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm bg-accent-600 transition-[width] duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[11px] text-ink-3 dark:text-gray-500 w-6 tnum">{count}</span>
    </div>
  );
}
