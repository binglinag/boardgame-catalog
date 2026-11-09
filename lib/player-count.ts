import type { BoardGame } from "@/types/game";

/** 解析人数范围，如 "2-5" -> [2,5], "3" -> [3,3], "1-6人" -> [1,6] */
export function parsePlayerRange(str: string): [number, number] | null {
  if (!str) return null;
  const clean = str.replace(/[^0-9\-]/g, "");
  if (!clean) return null;
  if (clean.includes("-")) {
    const [min, max] = clean.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) return [min, max];
  }
  const n = Number(clean);
  if (!isNaN(n)) return [n, n];
  return null;
}

/** 判断目标人数是否匹配游戏支持人数或最佳人数 */
export function matchesPlayerCount(
  game: Pick<BoardGame, "players" | "bestPlayers">,
  target: number
): boolean {
  const playersRange = parsePlayerRange(game.players);
  if (playersRange && target >= playersRange[0] && target <= playersRange[1]) {
    return true;
  }

  const bestRange = parsePlayerRange(game.bestPlayers);
  if (bestRange && target >= bestRange[0] && target <= bestRange[1]) {
    return true;
  }

  return false;
}

/**
 * 只看「最佳人数」是否包含目标人数，不看支持人数范围
 * 用于「最佳人数」筛选维度：想找 4 人局最合适的那几款
 * 最佳人数为空的游戏不匹配任何具体人数（只在「全部最佳」下显示）
 */
export function matchesBestPlayerCount(
  game: Pick<BoardGame, "bestPlayers">,
  target: number
): boolean {
  const bestRange = parsePlayerRange(game.bestPlayers);
  if (!bestRange) return false;
  return target >= bestRange[0] && target <= bestRange[1];
}
