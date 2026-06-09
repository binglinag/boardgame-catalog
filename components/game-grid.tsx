import GameCard from "./game-card";
import type { BoardGame } from "@/types/game";

interface Props {
  games: BoardGame[];
  sessionCountByGame?: Record<string, number>;
}

export default function GameGrid({ games, sessionCountByGame }: Props) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🎲</span>
        </div>
        <h3 className="text-lg font-medium text-violet-700 dark:text-violet-300 mb-2">
          还没有桌游
        </h3>
        <p className="text-sm text-violet-400 dark:text-violet-500 max-w-sm">
          在 Notion 中添加你的第一款桌游后，刷新页面即可看到
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {games.map((game, index) => (
        <div
          key={game.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        >
          <GameCard game={game} sessionCount={sessionCountByGame?.[game.title]} />
        </div>
      ))}
    </div>
  );
}
