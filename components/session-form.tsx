"use client";

import { useState } from "react";
import { addPlaySession } from "@/app/actions/sessions";
import PlayerForm from "./player-form";
import type { PlayerScore } from "@/types/session";
import type { Player } from "@/types/player";

interface Props {
  gameTitle: string;
  gameSlug: string;
  allPlayers: Player[];
}

export default function SessionForm({ gameTitle, gameSlug, allPlayers }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [players, setPlayers] = useState<(PlayerScore & { id: string })[]>([
    { name: "", score: 0, id: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updatePlayer(index: number, playerId: string, score: number) {
    const selected = allPlayers.find((p) => p.id === playerId);
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { id: playerId, name: selected?.name ?? "", score } : p
      )
    );
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, { name: "", score: 0, id: "" }]);
  }

  function removePlayer(index: number) {
    if (players.length > 1) {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = players.filter((p) => p.id !== "");
    if (valid.length === 0) {
      setMessage("请至少选择一位玩家");
      return;
    }

    setLoading(true);
    setMessage("");
    const result = await addPlaySession(gameTitle, gameSlug, date, valid, notes);
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      setDate(new Date().toISOString().slice(0, 10));
      setPlayers([{ name: "", score: 0, id: "" }]);
      setNotes("");
      window.location.reload();
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <PlayerForm />
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm
            shadow-lg shadow-primary-600/25 transition-all duration-200
            hover:shadow-xl hover:shadow-primary-600/30 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          记录对局
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">记录新对局 · {gameTitle}</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">玩家 & 分数</label>
                <div className="space-y-2">
                  {players.map((p, i) => {
                    // 已选中的玩家列表（避免重复选择）
                    const usedIds = players.filter((_, j) => j !== i).map((x) => x.id);
                    const available = allPlayers.filter((ap) => !usedIds.includes(ap.id));

                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <select
                          value={p.id}
                          onChange={(e) => updatePlayer(i, e.target.value, p.score)}
                          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                        >
                          <option value="">选择玩家</option>
                          {available.map((ap) => (
                            <option key={ap.id} value={ap.id}>{ap.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="分数"
                          value={p.score || ""}
                          onChange={(e) => updatePlayer(i, p.id, Number(e.target.value))}
                          className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                        />
                        {players.length > 1 && (
                          <button type="button" onClick={() => removePlayer(i)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={addPlayer} className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                  + 添加玩家
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">备注（选填）</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例如：新手局、加扩..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                />
              </div>

              {message && <p className={`text-sm ${message.includes("失败") ? "text-red-500" : "text-emerald-500"}`}>{message}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm">取消</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-lg shadow-violet-600/25 disabled:opacity-50">{loading ? "保存中..." : "保存"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
