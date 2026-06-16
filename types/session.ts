// 对局记录类型
export interface PlaySession {
  id: string;
  gameTitle: string;
  date: string;
  players: PlayerScore[];
  notes: string;
  template: ScoringTemplate;
  // 战役叙事模板专用
  scenario?: string;                           // 场景/章节名称
  narrative?: string;                          // 叙事记录
  completion?: "完整通关" | "中途放弃" | null; // 可选完成标记
}

export type ScoringTemplate =
  | "标准计分"
  | "胜负记录"
  | "排名顺序"
  | "单一赢家"
  | "合作胜负"
  | "战役叙事";

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

// 玩家全局排名条目
export interface PlayerRankEntry {
  player: { name: string; id: string };
  bgScore: number;       // 综合桌游度
  compScore: number;     // 竞技分
  campScore: number;     // 战役分
  gamesPlayed: number;   // 玩过款数（竞技）
  campGames: number;     // 战役款数
  totalSessions: number; // 总对局数
  avgWeight: number;     // 平均重度
  bestGame: string;      // 玩过最重的游戏
  maxWeight: number;     // 最重游戏重度
  campHardest: string;   // 最重战役游戏
  campMaxWeight: number; // 最重战役重度
}

// 计分模板配置
export const SCORING_TEMPLATES: {
  id: ScoringTemplate;
  label: string;
  description: string;
  inputType: "score" | "winloss" | "rank" | "singleWinner" | "coop" | "narrative";
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
  {
    id: "战役叙事",
    label: "战役叙事",
    description: "传承/战役类游戏，记录剧情推进与状态变化",
    inputType: "narrative",
    emoji: "📖",
  },
];
