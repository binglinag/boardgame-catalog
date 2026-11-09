/** 单条迁移结果 */
export interface MigrateDetail {
  title: string;
  status: "migrated" | "failed";
  message: string;
}

/** 批量迁移单轮返回 */
export interface MigrateResult {
  success: boolean;
  message?: string;
  /** 有封面图的游戏总数 */
  totalGames: number;
  /** 本轮成功迁移 */
  migrated: number;
  /** 已经是 Blob、无需处理 */
  alreadyMigrated: number;
  /** 本轮失败 */
  failed: number;
  /** 还剩多少款待迁移 */
  pending: number;
  details: MigrateDetail[];
  done: boolean;
}
