"use server";

import { createSession } from "@/lib/notion-sessions";
import { revalidatePath } from "next/cache";
import type { PlayerScore, ScoringTemplate } from "@/types/session";

export async function addPlaySession(
  gameTitle: string,
  gameSlug: string,
  date: string,
  players: PlayerScore[],
  notes: string,
  template: ScoringTemplate = "标准计分"
): Promise<{ success: boolean; message: string }> {
  if (players.length === 0) {
    return { success: false, message: "请至少添加一名玩家" };
  }

  const result = await createSession(gameTitle, date, players, notes, template);

  if (result) {
    revalidatePath(`/${gameSlug}`);
    revalidatePath("/leaderboard");
    return { success: true, message: "对局记录已添加" };
  }

  return { success: false, message: "添加失败，请检查 Notion Integration 权限是否包含 Insert content" };
}
