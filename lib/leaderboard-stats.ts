import type { Player } from "@/types/player";
import type { PlaySession } from "@/types/session";
import {
  COMPETITIVE_TEMPLATES,
  getPerformanceCoefficient,
} from "@/lib/leaderboard-scoring";

/**
 * 玩家排行榜的计分
 *
 * 抽成纯函数是为了让「选择玩家」能在客户端按不同对局范围重算：
 * 选中多个人时只看他们同时在场的对局，需要一份可以反复调用的算法，
 * 而不是服务端算一次就固定的结果。
 */

export interface PlayerRank {
  player: Player;
  bgScore: number; // 综合桌游度 = 竞技分 + 战役分
  compScore: number; // 竞技分
  campScore: number; // 战役分
  compGames: number; // 竞技款数
  campGames: number; // 战役款数
  totalSessions: number; // 总对局数
  avgWeight: number; // 平均重度
  bestGame: string; // 玩过最重的游戏
  maxWeight: number; // 最重游戏重度
}

/** 玩家聚合键：有 Notion ID 用 ID，老数据退回姓名 */
export function playerKey(p: { id?: string | null; name: string }): string {
  const id = p.id?.trim();
  return id ? `id:${id}` : `name:${p.name.trim()}`;
}

/**
 * 判断对局里的某条记录是不是这个玩家。
 *
 * 两边都有 ID 时只认 ID；有一边缺 ID（老数据没回填）才退回姓名。
 * 不能单看 key 是否相等 —— 玩家表和对局库的 ID 覆盖率不一样，
 * 只比 key 会让「明明一起玩过」的两个人算成没有共同对局。
 */
function samePlayer(
  a: { id?: string | null; name: string },
  b: { id?: string | null; name: string }
): boolean {
  const aid = a.id?.trim();
  const bid = b.id?.trim();
  if (aid && bid) return aid === bid;
  return a.name.trim() === b.name.trim();
}

/** 这一场里是否同时出现了这些玩家（全部在场才算） */
export function hasPlayers(session: PlaySession, players: Player[]): boolean {
  if (players.length === 0) return true;
  return players.every((p) => session.players.some((ps) => samePlayer(p, ps)));
}

/** 这一场里的参与者键集合（用于统计「N 人参与」） */
export function participantKeys(sessions: PlaySession[]): Set<string> {
  const keys = new Set<string>();
  for (const s of sessions) {
    for (const p of s.players) {
      if (p.name.trim()) keys.add(playerKey(p));
    }
  }
  return keys;
}

interface Stat {
  compWeighted: number;
  compSessionCount: number;
  compGameSet: Set<string>;
  campWeighted: number;
  campSessionCount: number;
  campGameSet: Set<string>;
  totalRawWeight: number;
  maxWeight: number;
  bestGame: string;
}

export function buildRankings(opts: {
  sessions: PlaySession[];
  players: Player[];
  weightByGameId: Record<string, number>;
  weightByTitle: Record<string, number>;
}): PlayerRank[] {
  const { sessions, players, weightByGameId, weightByTitle } = opts;
  const statsMap = new Map<string, Stat>();

  for (const session of sessions) {
    const weight =
      (session.gameId ? weightByGameId[session.gameId] : undefined) ??
      weightByTitle[session.gameTitle] ??
      2.5;
    const isCompetitive = COMPETITIVE_TEMPLATES.includes(session.template);
    // 款数去重键：有游戏 ID 就按 ID 去重，避免改名后被算成两款
    const gameKey = session.gameId ?? session.gameTitle;

    for (const playerScore of session.players) {
      const name = playerScore.name.trim();
      if (!name) continue;
      const key = playerKey(playerScore);

      let entry = statsMap.get(key);
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
        statsMap.set(key, entry);
      }

      if (isCompetitive) {
        const coeff = getPerformanceCoefficient(
          session.template,
          playerScore,
          session.players
        );
        entry.compWeighted += weight * coeff;
        entry.compSessionCount++;
        entry.compGameSet.add(gameKey);
      } else {
        const coeff = getPerformanceCoefficient(
          session.template,
          playerScore,
          session.players,
          session.completion
        );
        entry.campWeighted += weight * coeff;
        entry.campSessionCount++;
        entry.campGameSet.add(gameKey);
      }

      entry.totalRawWeight += weight;
      if (weight > entry.maxWeight) {
        entry.maxWeight = weight;
        entry.bestGame = session.gameTitle;
      }
    }
  }

  const rankings: PlayerRank[] = [];
  for (const player of players) {
    // 优先按 ID 命中；未回填 ID 的老数据退回按姓名匹配
    const stat =
      statsMap.get(`id:${player.id}`) ?? statsMap.get(`name:${player.name.trim()}`);

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
    // 战役分 = Σ(重度 × 完成标记系数) + 战役款数 × 3
    const campScore = Math.round((stat.campWeighted + stat.campGameSet.size * 3) * 10) / 10;
    const total = stat.compSessionCount + stat.campSessionCount;

    rankings.push({
      player,
      bgScore: Math.round((compScore + campScore) * 10) / 10,
      compScore,
      campScore,
      compGames: stat.compGameSet.size,
      campGames: stat.campGameSet.size,
      totalSessions: total,
      avgWeight: total > 0 ? Math.round((stat.totalRawWeight / total) * 10) / 10 : 0,
      bestGame: stat.bestGame,
      maxWeight: stat.maxWeight,
    });
  }

  // 同分时按场次多的靠前，再按名字，避免顺序每次渲染都变
  rankings.sort(
    (a, b) =>
      b.bgScore - a.bgScore ||
      b.totalSessions - a.totalSessions ||
      a.player.name.localeCompare(b.player.name, "zh-CN")
  );

  return rankings;
}
