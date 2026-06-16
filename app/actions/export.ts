"use server";

import { getAllGames } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return true;
  return password === ADMIN_PASSWORD;
}

export interface ExportData {
  exportedAt: string;
  version: string;
  tables: {
    games: unknown[];
    sessions: unknown[];
    players: unknown[];
  };
}

export async function exportBackup(
  password: string
): Promise<{ success: boolean; data?: ExportData; message: string }> {
  if (!verifyPassword(password)) {
    return { success: false, message: "密码错误" };
  }

  try {
    const [games, sessions, players] = await Promise.all([
      getAllGames(),
      getAllSessions(),
      getAllPlayers(),
    ]);

    // 过滤掉内部字段，保留纯数据结构
    const cleanGames = games.map((g) => ({
      id: g.id,
      title: g.title,
      nameEn: g.nameEn,
      players: g.players,
      bestPlayers: g.bestPlayers,
      playTime: g.playTime,
      year: g.year,
      designer: g.designer,
      rating: g.rating,
      weight: g.weight,
      status: g.status,
      tags: g.tags,
      coverUrl: g.coverUrl,
      extraImages: g.extraImages,
      bggUrl: g.bggUrl,
      price: g.price,
      priceNotes: g.priceNotes,
      review: g.review,
    }));

    const cleanSessions = sessions.map((s) => ({
      id: s.id,
      gameTitle: s.gameTitle,
      date: s.date,
      template: s.template,
      players: s.players,
      notes: s.notes,
    }));

    const cleanPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      notes: p.notes,
    }));

    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      tables: {
        games: cleanGames,
        sessions: cleanSessions,
        players: cleanPlayers,
      },
    };

    return {
      success: true,
      data,
      message: `备份完成：${cleanGames.length} 款桌游, ${cleanSessions.length} 条对局, ${cleanPlayers.length} 位玩家`,
    };
  } catch {
    return { success: false, message: "导出失败，请检查 Notion API 连接" };
  }
}
