"use client";

import { useState } from "react";
import { addPlaySession } from "@/app/actions/sessions";
import PlayerForm from "./player-form";
import type { PlayerScore, ScoringTemplate } from "@/types/session";
import { SCORING_TEMPLATES } from "@/types/session";
import type { Player } from "@/types/player";

interface Props {
  gameTitle: string;
  gameSlug: string;
  allPlayers: Player[];
}

type PlayerRow = PlayerScore & { id: string };

export default function SessionForm({ gameTitle, gameSlug, allPlayers }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [template, setTemplate] = useState<ScoringTemplate>("标准计分");
  const [players, setPlayers] = useState<PlayerRow[]>([
    { name: "", score: 0, id: "", result: null, rank: null },
  ]);
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 战役叙事模板专用
  const [scenario, setScenario] = useState("");
  const [narrative, setNarrative] = useState("");
  const [completion, setCompletion] = useState<"完整通关" | "中途放弃" | null>(null);

  const tpl = SCORING_TEMPLATES.find((t) => t.id === template)!;

  function updatePlayer(index: number, patch: Partial<PlayerRow>) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function handleSelectPlayer(index: number, playerId: string) {
    const selected = allPlayers.find((p) => p.id === playerId);
    updatePlayer(index, { id: playerId, name: selected?.name ?? "" });
  }

  function addPlayer() {
    setPlayers((prev) => [
      ...prev,
      { name: "", score: 0, id: "", result: null, rank: null },
    ]);
  }

  function removePlayer(index: number) {
    if (players.length > 1) {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setTemplate("标准计分");
    setPlayers([{ name: "", score: 0, id: "", result: null, rank: null }]);
    setNotes("");
    setMessage("");
    setScenario("");
    setNarrative("");
    setCompletion(null);
  }

  // 不同模板的提交前预处理
  function buildSubmitData(): PlayerScore[] {
    if (template === "战役叙事") {
      // 仅收集参与者，不设分数/排名
      return players
        .filter((p) => p.id !== "")
        .map((p) => ({ ...p, score: 0, result: null, rank: null }));
    }
    if (template === "排名顺序") {
      // 使用手动输入的名次
      return players
        .filter((p) => p.id !== "")
        .map((p) => ({ ...p, score: 0, result: null }));
    }
    if (template === "单一赢家") {
      return players
        .filter((p) => p.id !== "")
        .map((p, idx) => ({
          ...p,
          score: 0,
          result: idx === 0 ? "胜" as const : null,
        }));
    }
    if (template === "合作胜负") {
      // 第一个玩家是合作胜/败的标志位
      return players
        .filter((p) => p.id !== "")
        .map((p) => ({
          ...p,
          score: 0,
          result: p.result === "合作胜" || p.result === "合作败" ? p.result : "合作胜",
        }));
    }
    return players.filter((p) => p.id !== "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = buildSubmitData();
    if (valid.length === 0) {
      setMessage("请至少选择一位玩家");
      return;
    }

    setLoading(true);
    setMessage("");
    const result = await addPlaySession(
      gameTitle, gameSlug, date, valid, notes, template, password,
      template === "战役叙事" ? scenario : undefined,
      template === "战役叙事" ? narrative : undefined,
      template === "战役叙事" ? completion : undefined
    );
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      resetForm();
      window.location.reload();
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
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
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
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

              {/* 计分模板选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">计分模板</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {SCORING_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm ${
                        template === t.id
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-violet-300"
                      }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">{t.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 战役叙事模板 - 场景/叙事输入 */}
              {tpl.inputType === "narrative" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      📍 场景/章节名称
                    </label>
                    <input
                      type="text"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="例如：第一章·午夜面具"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      📝 叙事记录
                    </label>
                    <textarea
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value)}
                      placeholder="记录发生了什么：获得物品、触发事件、角色状态变化..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      🏁 完成标记（可选）
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCompletion(null)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          completion === null
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-300"
                        }`}
                      >
                        不标记
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompletion("完整通关")}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          completion === "完整通关"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-300"
                        }`}
                      >
                        完整通关
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompletion("中途放弃")}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          completion === "中途放弃"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-amber-300"
                        }`}
                      >
                        中途放弃
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 玩家输入 - 按模板动态切换 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  玩家 {tpl.inputType === "rank" && <span className="text-xs text-gray-400">（输入名次，并列输入相同数字）</span>}
                </label>
                <div className="space-y-2">
                  {players.map((p, i) => {
                    const usedIds = players.filter((_, j) => j !== i).map((x) => x.id);
                    const available = allPlayers.filter((ap) => !usedIds.includes(ap.id));

                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold">
                          {tpl.inputType === "rank" ? (p.rank ?? "?") : tpl.inputType === "narrative" ? "👤" : ""}
                        </span>
                        <select
                          value={p.id}
                          onChange={(e) => handleSelectPlayer(i, e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                        >
                          <option value="">选择玩家</option>
                          {available.map((ap) => (
                            <option key={ap.id} value={ap.id}>{ap.name}</option>
                          ))}
                        </select>

                        {/* 不同模板的输入控件 */}
                        {tpl.inputType === "score" && (
                          <input
                            type="number"
                            placeholder="分数"
                            value={p.score || ""}
                            onChange={(e) => updatePlayer(i, { score: Number(e.target.value) })}
                            className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                          />
                        )}

                        {tpl.inputType === "winloss" && (
                          <select
                            value={p.result ?? ""}
                            onChange={(e) => updatePlayer(i, { result: (e.target.value || null) as PlayerScore["result"] })}
                            className="w-24 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="">-</option>
                            <option value="胜">胜</option>
                            <option value="平">平</option>
                            <option value="负">负</option>
                          </select>
                        )}

                        {tpl.inputType === "rank" && (
                          <input
                            type="number"
                            min={1}
                            placeholder="名次"
                            value={p.rank ?? ""}
                            onChange={(e) => updatePlayer(i, { rank: e.target.value ? Number(e.target.value) : null })}
                            className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 outline-none text-sm"
                          />
                        )}

                        {tpl.inputType === "singleWinner" && (
                          <label className="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                            <input
                              type="radio"
                              name="winner"
                              checked={p.result === "胜"}
                              onChange={() => {
                                // 取消其他人的胜
                                setPlayers((prev) =>
                                  prev.map((q, j) => ({
                                    ...q,
                                    result: j === i ? ("胜" as const) : null,
                                  }))
                                );
                              }}
                              className="accent-violet-600"
                            />
                            赢家
                          </label>
                        )}

                        {tpl.inputType === "coop" && (
                          <select
                            value={p.result ?? "合作胜"}
                            onChange={(e) => updatePlayer(i, { result: e.target.value as PlayerScore["result"] })}
                            className="w-24 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
                            disabled={i > 0}
                          >
                            <option value="合作胜">合作胜</option>
                            <option value="合作败">合作败</option>
                          </select>
                        )}

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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">🔐 管理员密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码确认操作"
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
