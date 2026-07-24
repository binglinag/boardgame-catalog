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
