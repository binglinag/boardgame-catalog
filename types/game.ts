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

/** 可选的状态标签全集（编辑器里的多选按钮） */
export const GAME_STATUS_OPTIONS: GameStatus[] = ["已收藏", "想玩", "已玩过", "不好玩"];

/**
 * 网页编辑器的表单数据
 * 所有字段统一用 string，交给 Server Action 转成 Notion 需要的类型
 */
export interface GameEditForm {
  title: string;
  nameEn: string;
  players: string;
  bestPlayers: string;
  playTime: string;
  year: string;
  designer: string;
  rating: string;
  weight: string;
  status: string[];
  tags: string;
  coverUrl: string;
  extraImages: string;   // 每行一个 URL
  bggUrl: string;
  price: string;
  priceNotes: string;
  review: string;
}

// 筛选条件
export interface GameFilters {
  status: GameStatus | "全部";
  tag: string | null;
  playerCount: number | "全部";   // 玩家人数筛选
  sortBy: SortOption;
}

export type SortOption = "rating" | "year" | "title" | "playCount" | "playTime" | "weight";
