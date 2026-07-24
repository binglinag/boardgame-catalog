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
      const maxScore = Math.max(...allPlayersInSession.map((p) => p.score), 1);
      return playerScore.score / maxScore;
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
