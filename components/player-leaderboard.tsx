import Link from "next/link";
import type { Player } from "@/types/player";

interface PlayerRank {
  player: Player;
  bgScore: number;
  gamesPlayed: number;
  totalSessions: number;
  avgWeight: number;
  bestGame: string;
  maxWeight: number;
}

interface Props {
  rankings: PlayerRank[];
  totalGames: number;
  totalSessions: number;
}

export default function PlayerLeaderboard({ rankings, totalGames, totalSessions }: Props) {
  if (rankings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-violet-400 dark:text-violet-500">暂无玩家数据</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8 group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          玩家排行榜
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {rankings.length} 位玩家 · {totalGames} 款桌游 · {totalSessions} 场对局
        </p>
      </div>

      {/* 算法说明 */}
      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/10 dark:to-gray-800/20 border border-white/50 dark:border-white/5 backdrop-blur-sm text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        <span className="font-semibold text-violet-600 dark:text-violet-400">桌游度</span>
        {" = Σ(每款游戏重度 × 参与场次) + 玩过款数 × 0.5"}
      </div>

      {/* 排行榜表格 */}
      <div className="overflow-hidden rounded-2xl border border-white/50 dark:border-white/5 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 dark:bg-gray-800/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-14">排名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">玩家</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20">桌游度</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">款数</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">场次</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 hidden md:table-cell">均重度</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden lg:table-cell">最重游戏</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/20">
            {rankings.map((entry, i) => {
              const isTop3 = i < 3;
              const medals = ["🥇", "🥈", "🥉"];

              return (
                <tr
                  key={entry.player.id}
                  className={`transition-colors hover:bg-violet-50/30 dark:hover:bg-violet-900/5 ${
                    isTop3 ? "bg-amber-50/20 dark:bg-amber-900/5" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    {isTop3 ? (
                      <span className="text-xl">{medals[i]}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 font-medium">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-semibold text-gray-900 dark:text-white ${isTop3 ? "text-base" : ""}`}>
                      {entry.player.name}
                    </span>
                    {entry.player.notes && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{entry.player.notes}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-bold ${isTop3 ? "text-violet-600 dark:text-violet-400 text-lg" : "text-gray-700 dark:text-gray-300"}`}>
                      {entry.bgScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {entry.gamesPlayed}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {entry.totalSessions}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {entry.avgWeight > 0 ? entry.avgWeight : "-"}
                  </td>
                  <td className="px-4 py-4 text-left hidden lg:table-cell">
                    {entry.bestGame ? (
                      <span className="text-gray-600 dark:text-gray-300">
                        {entry.bestGame}
                        <span className="ml-1 text-xs text-amber-500 dark:text-amber-400">
                          ({entry.maxWeight})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
