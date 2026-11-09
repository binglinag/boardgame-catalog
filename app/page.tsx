import { getAllGames, getAllTags } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import ClientHome from "@/components/client-home";

export const runtime = "edge";
// 60 秒：写操作另有 revalidatePath 主动失效，这里只做兜底
// 原来的 86400 会导致代码更新后首页 HTML 仍长时间不刷新
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
