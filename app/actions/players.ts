"use server";

import { createPlayer } from "@/lib/notion-players";
import { revalidatePath } from "next/cache";

export async function addPlayer(
  name: string,
  phone: string,
  notes: string
): Promise<{ success: boolean; message: string }> {
  if (!name.trim()) {
    return { success: false, message: "玩家名称不能为空" };
  }

  const result = await createPlayer(name.trim(), phone.trim(), notes.trim());

  if (result) {
    revalidatePath("/");
    return { success: true, message: `玩家「${result.name}」创建成功` };
  }

  return { success: false, message: "创建失败，请检查 Notion Integration 权限" };
}
