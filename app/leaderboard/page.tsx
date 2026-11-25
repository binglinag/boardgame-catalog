import { Metadata } from "next";
import { getAllGames } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import PlayerLeaderboard from "@/components/player-leaderboard";

export const runtime = "edge";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "玩家排行榜",
};

/**
 * 排行榜页面只负责取数据。
 *
 * 计分挪到 lib/leaderboard-stats.ts 并在客户端按「选择玩家」重算：
 * 选中多人时要改成只统计他们同时在场的对局，服务端算好一份结果就固定了。
 * 十几场对局序列化给客户端只有几 KB，换来即时切换范围、不用发请求。
 */
export default async function LeaderboardPage() {
  const [games, allSessions, allPlayers] = await Promise.all([
    getAllGames(),
    getAllSessions(),
    getAllPlayers(),
  ]);

  // 重度映射：同时按游戏 ID 和名称建索引，改名后仍能取到正确重度
  const weightByGameId: Record<string, number> = {};
  const weightByTitle: Record<string, number> = {};
  for (const g of games) {
    const w = g.weight ?? 2.5;
    weightByGameId[g.id] = w;
    weightByTitle[g.title] = w;
  }

  return (
    <PlayerLeaderboard
      players={allPlayers}
      sessions={allSessions}
      weightByGameId={weightByGameId}
      weightByTitle={weightByTitle}
      totalGames={games.length}
      totalSessions={allSessions.length}
    />
  );
}
