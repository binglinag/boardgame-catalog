import type { PlayerScore, ScoringTemplate } from "@/types/session";

export const COMPETITIVE_TEMPLATES: ScoringTemplate[] = [
  "标准计分",
  "胜负记录",
  "排名顺序",
  "单一赢家",
  "合作胜负",
];

export function getPerformanceCoefficient(
  template: ScoringTemplate,
  playerScore: PlayerScore,
  allPlayersInSession: PlayerScore[],
  completion?: "完整通关" | "中途放弃" | null
): number {
  switch (template) {
    case "标准计分": {
      const scores = allPlayersInSession.map((p) => p.score);
      const max = Math.max(...scores);
      const min = Math.min(...scores);

      // 常规正分局：个人分 ÷ 全场最高分（保持原有一致性）
      if (min >= 0 && max > 0) {
        return playerScore.score / max;
      }
      // 全场同分（含全 0 分）：给中性值，避免除零
      if (max === min) {
        return max > 0 ? 1 : 0.5;
      }
      // 出现负分：min-max 归一化，最高分仍得 1.0，最低分 0.0
      // 避免旧逻辑 Math.max(..., 1) 把 -1 变成 -1 倍、-5 变成 -5 倍
      return (playerScore.score - min) / (max - min);
    }
    case "胜负记录": {
      if (playerScore.result === "胜") return 1.0;
      if (playerScore.result === "平") return 0.7;
      return 0.4;
    }
    case "排名顺序": {
      if (!playerScore.rank) return 0.5;
      const totalPlayers = allPlayersInSession.length;
      const tiedCount = allPlayersInSession.filter((p) => p.rank === playerScore.rank).length;
      if (tiedCount > 1) {
        let sum = 0;
        for (let pos = playerScore.rank; pos < playerScore.rank + tiedCount; pos++) {
          sum += (totalPlayers - pos + 1) / totalPlayers;
        }
        return sum / tiedCount;
      }
      return (totalPlayers - playerScore.rank + 1) / totalPlayers;
    }
    case "单一赢家": {
      if (playerScore.result === "胜" || playerScore.result === "冠军") return 1.0;
      return 0.6;
    }
    case "合作胜负": {
      if (playerScore.result === "合作胜") return 1.0;
      return 0.5;
    }
    case "战役叙事": {
      if (completion === "完整通关") return 1.0;
      if (completion === "中途放弃") return 0.5;
      return 1.0;
    }
    default:
      return 1.0;
  }
}
