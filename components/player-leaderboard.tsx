import Link from "next/link";
import type { Player } from "@/types/player";

interface PlayerRank {
  player: Player;
  bgScore: number;       // 综合桌游度
  compScore: number;     // 竞技分
  campScore: number;     // 战役分
  compGames: number;     // 竞技款数
  campGames: number;     // 战役款数
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
      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/10 dark:to-gray-800/20 border border-white/50 dark:border-white/5 backdrop-blur-sm text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-1.5">
        <div>
          <span className="font-semibold text-violet-600 dark:text-violet-400">桌游度</span>
          {" = "}
          <span className="text-blue-600 dark:text-blue-400 font-medium">竞技分</span>
          {" + "}
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">战役分</span>
        </div>
        <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          <span className="text-blue-600 dark:text-blue-400 font-medium">竞技分</span>
          {" = Σ(重度 × 变现系数) + 竞技款数 × 2"}
        </div>
        <div className="pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">战役分</span>
          {" = Σ(重度 × 完成标记系数) + 战役款数 × 3"}
        </div>
        <div className="text-gray-400 dark:text-gray-500 pt-1">
          变现系数基于对局表现（排名/分数/胜负），战役系数基于完成标记（可选）
        </div>
      </div>

      {/* 排行榜表格 */}
      <div className="overflow-hidden rounded-2xl border border-white/50 dark:border-white/5 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 dark:bg-gray-800/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-14">排名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">玩家</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20">桌游度</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 hidden md:table-cell">竞技 · 战役</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">款数</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">场次</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 hidden lg:table-cell">均重度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/20">
            {rankings.map((entry, i) => {
              const isTop3 = i < 3;
              const medals = ["🥇", "🥈", "🥉"];
              const totalGames = entry.compGames + entry.campGames;

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
                  <td className="px-4 py-4 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1 text-xs">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{entry.compScore}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{entry.campScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    <span title={`竞技 ${entry.compGames} · 战役 ${entry.campGames}`}>
                      {totalGames}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {entry.totalSessions}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {entry.avgWeight > 0 ? entry.avgWeight : "-"}
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
