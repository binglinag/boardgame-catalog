import type { PlaySession, LeaderboardEntry } from "@/types/session";

function computeLeaderboard(sessions: PlaySession[]): LeaderboardEntry[] {
  const map = new Map<
    string,
    {
      bestScore: number;
      bestDate: string;
      totalScore: number;
      count: number;
    }
  >();

  for (const session of sessions) {
    for (const player of session.players) {
      const name = player.name.trim();
      if (!name) continue;

      const existing = map.get(name);
      if (!existing) {
        map.set(name, {
          bestScore: player.score,
          bestDate: session.date,
          totalScore: player.score,
          count: 1,
        });
      } else {
        if (player.score > existing.bestScore) {
          existing.bestScore = player.score;
          existing.bestDate = session.date;
        }
        existing.totalScore += player.score;
        existing.count++;
      }
    }
  }

  const entries: LeaderboardEntry[] = [];
  for (const [name, data] of map) {
    entries.push({
      name,
      bestScore: data.bestScore,
      bestDate: data.bestDate,
      totalPlays: data.count,
      averageScore: Math.round(data.totalScore / data.count),
    });
  }

  // 按最高分降序
  entries.sort((a, b) => b.bestScore - a.bestScore);
  return entries;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Leaderboard({ sessions }: { sessions: PlaySession[] }) {
  const leaderboard = computeLeaderboard(sessions);

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          暂无对局记录，快来记录第一局吧
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-12">
              排名
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              玩家
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              最高分
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              场均
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              场次
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
          {leaderboard.map((entry, i) => {
            const isTop3 = i < 3;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <tr
                key={entry.name}
                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                  isTop3 ? "bg-amber-50/30 dark:bg-amber-900/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  {isTop3 ? (
                    <span className="text-lg">{medals[i]}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 font-medium">
                      {i + 1}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold text-gray-900 dark:text-white ${isTop3 ? "text-base" : ""}`}>
                    {entry.name}
                  </span>
                  {isTop3 && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(entry.bestDate)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${isTop3 ? "text-primary-600 dark:text-primary-400 text-lg" : "text-gray-700 dark:text-gray-300"}`}>
                    {entry.bestScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  {entry.averageScore}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-500 hidden sm:table-cell">
                  {entry.totalPlays}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
