"use server";

import { getAllGames } from "@/lib/notion";
import { getAllSessions } from "@/lib/notion-sessions";
import { getAllPlayers } from "@/lib/notion-players";
import { verifyAdmin } from "@/lib/auth";

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
  const auth = verifyAdmin(password);
  if (!auth.ok) {
    return { success: false, message: auth.reason ?? "密码错误" };
  }

  try {
    // strict: true —— 任何一页查询失败都抛错，绝不拿部分数据冒充完整备份
    const [games, sessions, players] = await Promise.all([
      getAllGames({ strict: true }),
      getAllSessions({ strict: true }),
      getAllPlayers({ strict: true }),
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
      // 战役叙事模板的三个字段，之前遗漏
      scenario: s.scenario,
      narrative: s.narrative,
      completion: s.completion,
    }));

    const cleanPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      notes: p.notes,
    }));

    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      version: "1.1",
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `备份失败，数据可能不完整，请重试：${msg}`,
    };
  }
}
