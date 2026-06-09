// 对局记录类型
export interface PlaySession {
  id: string;
  gameTitle: string;
  date: string;
  players: PlayerScore[];
  notes: string;
}

export interface PlayerScore {
  name: string;
  score: number;
}

// 排行榜条目
export interface LeaderboardEntry {
  name: string;
  bestScore: number;
  bestDate: string;
  totalPlays: number;
  averageScore: number;
}
