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
      <StatCard label="收藏桌游" value={games.length} suffix="款" color="violet" />

      {/* 总对局 */}
      <StatCard label="总对局数" value={allSessions.length} suffix="场" color="indigo" />

      {/* 有过对局的游戏 */}
      <StatCard label="玩过桌游" value={gamesWithSessions} suffix="款" color="pink" />

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
        color="amber"
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
        color="emerald"
      />

      {/* 状态分布 */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* 评分分布 */}
          <MiniBarCard title="评分分布" color="violet">
            {Object.entries(ratingBuckets).map(([label, count]) => (
              <Bar key={label} label={label} count={count} max={maxRating} color="violet" />
            ))}
          </MiniBarCard>

          {/* 重度分布 */}
          <MiniBarCard title="重度分布" color="amber">
            {Object.entries(weightBuckets).map(([label, count]) => (
              <Bar key={label} label={label} count={count} max={maxWeight} color="amber" />
            ))}
          </MiniBarCard>

          {/* Top 标签 */}
          <MiniBarCard title="热门标签" color="pink">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300 truncate mr-2">{tag}</span>
                <span className="text-gray-400 dark:text-gray-500 font-medium">{count}</span>
              </div>
            ))}
          </MiniBarCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  suffix: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/10 border-violet-200/50 dark:border-violet-700/20",
    indigo: "from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/10 border-indigo-200/50 dark:border-indigo-700/20",
    pink: "from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/10 border-pink-200/50 dark:border-pink-700/20",
    amber: "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-700/20",
    emerald: "from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-700/20",
  };

  const textColorMap: Record<string, string> = {
    violet: "text-violet-700 dark:text-violet-300",
    indigo: "text-indigo-700 dark:text-indigo-300",
    pink: "text-pink-700 dark:text-pink-300",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color] ?? colorMap.violet} border backdrop-blur-sm p-4`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColorMap[color] ?? ""}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
          {suffix}
        </span>
      </p>
    </div>
  );
}

function MiniBarCard({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const bgMap: Record<string, string> = {
    violet: "from-violet-50/50 to-white dark:from-violet-950/10 dark:to-gray-800/20",
    amber: "from-amber-50/50 to-white dark:from-amber-950/10 dark:to-gray-800/20",
    pink: "from-pink-50/50 to-white dark:from-pink-950/10 dark:to-gray-800/20",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bgMap[color] ?? bgMap.violet} border border-white/50 dark:border-white/5 backdrop-blur-sm p-4`}>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Bar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;
  const barColor: Record<string, string> = {
    violet: "bg-violet-400 dark:bg-violet-500",
    amber: "bg-amber-400 dark:bg-amber-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor[color] ?? barColor.violet} transition-all duration-700`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 w-6">{count}</span>
    </div>
  );
}
