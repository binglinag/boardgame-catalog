import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/notion";
import GameEditor from "@/components/game-editor";

export const runtime = "edge";
// 编辑页不进 CDN 缓存，每次都拿最新数据
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  return {
    title: game ? `编辑 ${game.title}` : "编辑桌游",
    robots: { index: false, follow: false },
  };
}

export default async function EditGamePage({ params }: Props) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <GameEditor game={game} />;
}
