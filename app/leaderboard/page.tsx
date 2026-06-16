import { Metadata } from "next";
import { getAllGames } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import PlayerLeaderboard from "@/components/player-leaderboard";
import type { BoardGame } from "@/types/game";
import type { PlaySession } from "@/types/session";
import type { Player } from "@/types/player";

export const runtime = "edge";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "玩家排行榜",
};

interface PlayerRank {
  player: Player;
  bgScore: number;       // 桌游度
  gamesPlayed: number;   // 玩过款数
  totalSessions: number; // 总对局数
  avgWeight: number;     // 平均重度
  bestGame: string;      // 玩过最重的游戏
  maxWeight: number;     // 最重游戏的重度
}

export default async function LeaderboardPage() {
  const [games, allSessions, allPlayers] = await Promise.all([
    getAllGames(),
    getAllSessions(),
    getAllPlayers(),
  ]);

  // 游戏名 → 重度映射
  const gameWeightMap: Record<string, number> = {};
  for (const g of games) {
    gameWeightMap[g.title] = g.weight ?? 2.5;
  }

  // 玩家名 → 统计
  const statsMap = new Map<
    string,
    {
      totalWeight: number;
      sessionCount: number;
      gameSet: Set<string>;
      maxWeight: number;
      bestGame: string;
    }
  >();

  for (const session of allSessions) {
    const weight = gameWeightMap[session.gameTitle] ?? 2.5;
    for (const player of session.players) {
      const name = player.name.trim();
      if (!name) continue;

      let entry = statsMap.get(name);
      if (!entry) {
        entry = {
          totalWeight: 0,
          sessionCount: 0,
          gameSet: new Set(),
          maxWeight: 0,
          bestGame: "",
        };
        statsMap.set(name, entry);
      }

      entry.totalWeight += weight;
      entry.sessionCount++;
      entry.gameSet.add(session.gameTitle);

      if (weight > entry.maxWeight) {
        entry.maxWeight = weight;
        entry.bestGame = session.gameTitle;
      }
    }
  }

  // 构建排名
  const rankings: PlayerRank[] = [];
  for (const player of allPlayers) {
    const stat = statsMap.get(player.name);
    if (!stat) {
      // 未参与过对局的玩家
      rankings.push({
        player,
        bgScore: 0,
        gamesPlayed: 0,
        totalSessions: 0,
        avgWeight: 0,
        bestGame: "",
        maxWeight: 0,
      });
      continue;
    }

    // 桌游度 = Σ(重度 × 场次) + 款数 × 0.5
    const gameTypes = stat.gameSet.size;
    const bgScore = Math.round((stat.totalWeight + gameTypes * 0.5) * 10) / 10;

    rankings.push({
      player,
      bgScore,
      gamesPlayed: gameTypes,
      totalSessions: stat.sessionCount,
      avgWeight: gameTypes > 0 ? Math.round((stat.totalWeight / stat.sessionCount) * 10) / 10 : 0,
      bestGame: stat.bestGame,
      maxWeight: stat.maxWeight,
    });
  }

  rankings.sort((a, b) => b.bgScore - a.bgScore);

  return (
    <PlayerLeaderboard
      rankings={rankings}
      totalGames={games.length}
      totalSessions={allSessions.length}
    />
  );
}
