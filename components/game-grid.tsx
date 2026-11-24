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
        <svg
          className="w-9 h-9 mb-4 text-gray-300 dark:text-gray-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinejoin="round"
        >
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
          <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <h3 className="font-serif text-[15px] text-ink dark:text-gray-200 mb-1.5">
          还没有桌游
        </h3>
        <p className="text-[12.5px] text-ink-3 dark:text-gray-500 max-w-sm">
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
          className="animate-fade-in h-full"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        >
          <GameCard game={game} sessionCount={sessionCountByGame?.[game.title]} priority={index < 4} />
        </div>
      ))}
    </div>
  );
}
