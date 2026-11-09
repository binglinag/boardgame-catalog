"use server";

import { createSession } from "@/lib/notion-sessions";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth";
import type { PlayerScore, ScoringTemplate } from "@/types/session";

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
  const auth = verifyAdmin(password);
  if (!auth.ok) {
    return { success: false, message: auth.reason ?? "密码错误" };
  }

  if (players.length === 0) {
    return { success: false, message: "请至少添加一名玩家" };
  }

  // 服务端兜底校验：不信任前端传来的结果结构
  if (template === "单一赢家") {
    const winners = players.filter((p) => p.result === "胜").length;
    if (winners !== 1) {
      return { success: false, message: "单一赢家模板必须恰好有一位玩家获胜" };
    }
  }
  if (template === "合作胜负") {
    const verdicts = new Set(
      players
        .map((p) => p.result)
        .filter((r) => r === "合作胜" || r === "合作败"),
    );
    if (verdicts.size !== 1) {
      return { success: false, message: "合作对局的全队结果必须一致" };
    }
  }

  const result = await createSession(gameTitle, date, players, notes, template, scenario, narrative, completion);

  if (result) {
    revalidatePath(`/${gameSlug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true, message: "对局记录已添加" };
  }

  return { success: false, message: "添加失败，请检查 Notion Integration 权限是否包含 Insert content" };
}
