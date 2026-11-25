import { Metadata } from "next";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import SessionBrowser from "@/components/session-browser";

export const runtime = "edge";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "对局记录",
};

interface Props {
  // ?players=id1,id2 由排行榜的「浏览这批对局」按钮带进来
  searchParams: Promise<{ players?: string }>;
}

export default async function SessionsPage({ searchParams }: Props) {
  const { players: raw } = await searchParams;
  const [allSessions, allPlayers] = await Promise.all([
    getAllSessions(),
    getAllPlayers(),
  ]);

  const known = new Set(allPlayers.map((p) => p.id));
  const initialSelected = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && known.has(s)); // 过滤掉手改 URL 带进来的无效 id

  return (
    <SessionBrowser
      players={allPlayers}
      sessions={allSessions}
      initialSelected={initialSelected}
    />
  );
}
