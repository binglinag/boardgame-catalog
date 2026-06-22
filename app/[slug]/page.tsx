import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/notion";
import { getSessionsByGame } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import GameDetail from "@/components/game-detail";

export const runtime = "edge";
export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return { title: "未找到" };
  }

  const description = game.review || `${game.title} · ${game.players || ""}人 · ${game.playTime || ""}${game.rating !== null ? ` · 评分 ${game.rating}/10` : ""}`;

  return {
    title: game.title,
    description,
    openGraph: {
      title: game.title,
      description,
      images: game.coverUrl ? [{ url: game.coverUrl, width: 800, height: 1000 }] : [],
    },
    twitter: {
      title: game.title,
      description,
      images: game.coverUrl ? [game.coverUrl] : [],
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const [game, allPlayers] = await Promise.all([
    getGameBySlug(slug),
    getAllPlayers(),
  ]);

  if (!game) {
    notFound();
  }

  // 用 title 取 sessions（slug 是 page ID，不是 title）
  const gameSessions = await getSessionsByGame(game.title);

  return <GameDetail game={game} sessions={gameSessions} allPlayers={allPlayers} />;
}
