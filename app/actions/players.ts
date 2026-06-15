"use server";

import { createPlayer, getAllPlayers } from "@/lib/notion-players";
import { revalidatePath } from "next/cache";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return true;
  return password === ADMIN_PASSWORD;
}

export async function addPlayer(
  name: string,
  phone: string,
  notes: string,
  password: string = ""
): Promise<{ success: boolean; message: string }> {
  if (!verifyPassword(password)) {
    return { success: false, message: "密码错误" };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, message: "玩家名称不能为空" };
  }

  // 查重：忽略大小写、首尾空格
  try {
    const existing = await getAllPlayers();
    const isDuplicate = existing.some(
      (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return {
        success: false,
        message: `玩家「${trimmedName}」已存在，无法重复创建`,
      };
    }
  } catch {
    // 查重失败时继续尝试创建，避免因临时网络问题误判
  }

  const result = await createPlayer(trimmedName, phone.trim(), notes.trim());

  if (result) {
    revalidatePath("/");
    return { success: true, message: `玩家「${result.name}」创建成功` };
  }

  return { success: false, message: "创建失败，请检查 Notion Integration 权限" };
}
