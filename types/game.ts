// 桌游数据类型定义
export interface BoardGame {
  id: string;
  slug: string;
  title: string;
  nameEn: string;
  players: string;               // 支持人数
  bestPlayers: string;            // 最佳人数
  playTime: string;
  year: number | null;
  designer: string;
  rating: number | null;
  weight: number | null;        // 重度 1-5
  status: GameStatus[];         // 状态（多选）
  playCount: number | null;
  tags: string[];
  coverUrl: string | null;
  extraImages: string[];        // 相关图片
  bggUrl: string | null;
  price: number | null;         // 购买价格
  priceNotes: string;           // 价格备注
  review: string;
}

export type GameStatus = "已收藏" | "想玩" | "已玩过" | "不好玩";

// 筛选条件
export interface GameFilters {
  status: GameStatus | "全部";
  tag: string | null;
  sortBy: SortOption;
}

export type SortOption = "rating" | "year" | "title" | "playCount" | "playTime" | "weight";
