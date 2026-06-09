import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/notion";
import { getSessionsByGame } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import GameDetail from "@/components/game-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return { title: "未找到" };
  }

  return {
    title: `${game.title} - 壮壮的桌游图鉴`,
    description: game.review || `${game.title} - ${game.players || ""}人 · ${game.playTime || ""}`,
  };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const [game, sessions, allPlayers] = await Promise.all([
    getGameBySlug(slug),
    getSessionsByGame(slug), // 先用 slug 做个临时取数，实际还是用 title 匹配
    getAllPlayers(),
  ]);

  if (!game) {
    notFound();
  }

  // 重新用 title 取 sessions（因为 slug 是 page ID，不是 title）
  const gameSessions = await getSessionsByGame(game.title);

  return <GameDetail game={game} sessions={gameSessions} allPlayers={allPlayers} />;
}
