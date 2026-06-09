"use server";
export const runtime = "edge";

import { createSession } from "@/lib/notion-sessions";
import { revalidatePath } from "next/cache";
import type { PlayerScore } from "@/types/session";

export async function addPlaySession(
  gameTitle: string,
  gameSlug: string,
  date: string,
  players: PlayerScore[],
  notes: string
): Promise<{ success: boolean; message: string }> {
  const result = await createSession(gameTitle, date, players, notes);

  if (result) {
    revalidatePath(`/${gameSlug}`);
    return { success: true, message: "对局记录已添加" };
  }

  return { success: false, message: "添加失败，请检查 Notion Integration 权限是否包含 Insert content" };
}
