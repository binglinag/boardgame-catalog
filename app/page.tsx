import { getAllGames, getAllTags } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import ClientHome from "@/components/client-home";

export const runtime = "edge";
export const revalidate = 60;

export default async function HomePage() {
  const [games, tags, allSessions] = await Promise.all([
    getAllGames(),
    getAllTags(),
    getAllSessions(),
  ]);

  // 计算每款游戏的 session 次数
  const sessionCountByGame: Record<string, number> = {};
  for (const session of allSessions) {
    sessionCountByGame[session.gameTitle] =
      (sessionCountByGame[session.gameTitle] ?? 0) + 1;
  }

  return (
    <ClientHome
      initialGames={games}
      initialTags={tags}
      allSessions={allSessions}
      sessionCountByGame={sessionCountByGame}
    />
  );
}
