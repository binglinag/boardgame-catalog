"use server";

import { createSession } from "@/lib/notion-sessions";
import { revalidatePath } from "next/cache";
import type { PlayerScore, ScoringTemplate } from "@/types/session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return true; // 未设密码时允许所有操作
  return password === ADMIN_PASSWORD;
}

export async function addPlaySession(
  gameTitle: string,
  gameSlug: string,
  date: string,
  players: PlayerScore[],
  notes: string,
  template: ScoringTemplate = "标准计分",
  password: string = "",
  scenario?: string,
  narrative?: string,
  completion?: "完整通关" | "中途放弃" | null
): Promise<{ success: boolean; message: string }> {
  if (!verifyPassword(password)) {
    return { success: false, message: "密码错误" };
  }

  if (players.length === 0) {
    return { success: false, message: "请至少添加一名玩家" };
  }

  const result = await createSession(gameTitle, date, players, notes, template, scenario, narrative, completion);

  if (result) {
    revalidatePath(`/${gameSlug}`);
    revalidatePath("/leaderboard");
    return { success: true, message: "对局记录已添加" };
  }

  return { success: false, message: "添加失败，请检查 Notion Integration 权限是否包含 Insert content" };
}
