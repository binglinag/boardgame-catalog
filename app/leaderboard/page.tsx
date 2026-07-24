import { Metadata } from "next";
import { getAllGames } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import PlayerLeaderboard from "@/components/player-leaderboard";
import type { Player } from "@/types/player";
import { COMPETITIVE_TEMPLATES, getPerformanceCoefficient } from "@/lib/leaderboard-scoring";

export const runtime = "edge";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "玩家排行榜",
};

interface PlayerRank {
  player: Player;
  bgScore: number;       // 综合桌游度 = 竞技分 + 战役分
  compScore: number;     // 竞技分
  campScore: number;     // 战役分
  compGames: number;     // 竞技款数
  campGames: number;     // 战役款数
  totalSessions: number; // 总对局数
  avgWeight: number;     // 平均重度
  bestGame: string;      // 玩过最重的游戏
  maxWeight: number;     // 最重游戏重度
}

interface PlayerStats {
  // 竞技
  compWeighted: number;    // Σ(重度 × 变现系数)
  compSessionCount: number;
  compGameSet: Set<string>;
  // 战役
  campWeighted: number;    // Σ(重度 × 可选标记系数)
  campSessionCount: number;
  campGameSet: Set<string>;
  // 通用
  totalRawWeight: number;  // Σ(原始重度)，用于均重度
  maxWeight: number;
  bestGame: string;
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
  const statsMap = new Map<string, PlayerStats>();

  for (const session of allSessions) {
    const weight = gameWeightMap[session.gameTitle] ?? 2.5;
    const isCompetitive = COMPETITIVE_TEMPLATES.includes(session.template);

    for (const playerScore of session.players) {
      const name = playerScore.name.trim();
      if (!name) continue;

      let entry = statsMap.get(name);
      if (!entry) {
        entry = {
          compWeighted: 0,
          compSessionCount: 0,
          compGameSet: new Set(),
          campWeighted: 0,
          campSessionCount: 0,
          campGameSet: new Set(),
          totalRawWeight: 0,
          maxWeight: 0,
          bestGame: "",
        };
        statsMap.set(name, entry);
      }

      if (isCompetitive) {
        const coeff = getPerformanceCoefficient(
          session.template,
          playerScore,
          session.players
        );
        entry.compWeighted += weight * coeff;
        entry.compSessionCount++;
        entry.compGameSet.add(session.gameTitle);
      } else {
        // 战役叙事
        const coeff = getPerformanceCoefficient(
          session.template,
          playerScore,
          session.players,
          session.completion
        );
        entry.campWeighted += weight * coeff;
        entry.campSessionCount++;
        entry.campGameSet.add(session.gameTitle);
      }

      entry.totalRawWeight += weight;

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
      rankings.push({
        player,
        bgScore: 0,
        compScore: 0,
        campScore: 0,
        compGames: 0,
        campGames: 0,
        totalSessions: 0,
        avgWeight: 0,
        bestGame: "",
        maxWeight: 0,
      });
      continue;
    }

    // 竞技分 = Σ(重度 × 变现系数) + 竞技款数 × 2
    const compScore = Math.round((stat.compWeighted + stat.compGameSet.size * 2) * 10) / 10;
    // 战役分 = Σ(重度 × 可选标记系数) + 战役款数 × 3
    const campScore = Math.round((stat.campWeighted + stat.campGameSet.size * 3) * 10) / 10;
    // 综合 = 竞技分 + 战役分
    const bgScore = Math.round((compScore + campScore) * 10) / 10;

    rankings.push({
      player,
      bgScore,
      compScore,
      campScore,
      compGames: stat.compGameSet.size,
      campGames: stat.campGameSet.size,
      totalSessions: stat.compSessionCount + stat.campSessionCount,
      avgWeight:
        stat.totalRawWeight > 0 && stat.compSessionCount + stat.campSessionCount > 0
          ? Math.round((stat.totalRawWeight / (stat.compSessionCount + stat.campSessionCount)) * 10) / 10
          : 0,
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
