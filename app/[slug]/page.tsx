import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/notion";
import { getSessionsByGame } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import GameDetail from "@/components/game-detail";

export const runtime = "edge";
export const revalidate = 60;

/**
 * Notion page id 是 36 位 UUID。
 *
 * 不做这个校验的话，/[slug] 会把任何路径都接住去查 Notion：
 * /get_status、/favicon.ico、爬虫试探的路径全都会发一次 pages.retrieve，
 * 既白烧 API 配额，也让 404 变慢（本地日志里 19 小时攒了 1167 次无效查询）。
 */
const NOTION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!NOTION_ID_RE.test(slug)) return { title: "未找到" };

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
  if (!NOTION_ID_RE.test(slug)) notFound();

  const [game, allPlayers] = await Promise.all([
    getGameBySlug(slug),
    getAllPlayers(),
  ]);

  if (!game) {
    notFound();
  }

  // 优先按游戏 ID 关联，名称做兜底（兼容还没回填 ID 的老对局）
  const gameSessions = await getSessionsByGame(game.id, game.title);

  return <GameDetail game={game} sessions={gameSessions} allPlayers={allPlayers} />;
}
