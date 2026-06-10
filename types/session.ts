// 对局记录类型
export interface PlaySession {
  id: string;
  gameTitle: string;
  date: string;
  players: PlayerScore[];
  notes: string;
  template: ScoringTemplate;
}

export type ScoringTemplate =
  | "标准计分"
  | "胜负记录"
  | "排名顺序"
  | "单一赢家"
  | "合作胜负";

export interface PlayerScore {
  name: string;
  score: number;
  result?: "胜" | "平" | "负" | "合作胜" | "合作败" | "冠军" | null;
  rank?: number | null; // 排名顺序模板用
}

// 排行榜条目
export interface LeaderboardEntry {
  name: string;
  bestScore: number;
  bestDate: string;
  totalPlays: number;
  averageScore: number;
}

// 计分模板配置
export const SCORING_TEMPLATES: {
  id: ScoringTemplate;
  label: string;
  description: string;
  inputType: "score" | "winloss" | "rank" | "singleWinner" | "coop";
  emoji: string;
}[] = [
  {
    id: "标准计分",
    label: "标准计分",
    description: "每名玩家一个分数，分数高者胜",
    inputType: "score",
    emoji: "🔢",
  },
  {
    id: "胜负记录",
    label: "胜负记录",
    description: "胜/平/负，适合两人对弈",
    inputType: "winloss",
    emoji: "⚔️",
  },
  {
    id: "排名顺序",
    label: "排名顺序",
    description: "按名次 1/2/3 记录，适合多人",
    inputType: "rank",
    emoji: "🏅",
  },
  {
    id: "单一赢家",
    label: "单一赢家",
    description: "只记录谁赢了",
    inputType: "singleWinner",
    emoji: "👑",
  },
  {
    id: "合作胜负",
    label: "合作胜负",
    description: "全体玩家共同胜/负",
    inputType: "coop",
    emoji: "🤝",
  },
];
