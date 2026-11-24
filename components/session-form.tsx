"use client";

import { useState } from "react";
import { addPlaySession } from "@/app/actions/sessions";
import PlayerForm from "./player-form";
import CustomDatePicker from "./custom-date-picker";
import CustomSelect from "./custom-select";
import type { PlayerScore, ScoringTemplate } from "@/types/session";
import { SCORING_TEMPLATES } from "@/types/session";
import type { Player } from "@/types/player";

interface Props {
  gameTitle: string;
  gameSlug: string;
  /** 只需要 id 和 name —— 手机号、备注不该出现在客户端 JS 里 */
  allPlayers: Array<Pick<Player, "id" | "name">>;
}

type PlayerRow = PlayerScore & { id: string };

/** 取本地日期（YYYY-MM-DD）。不用 toISOString，那是 UTC，北京时间 0-8 点会退到前一天 */
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SessionForm({ gameTitle, gameSlug, allPlayers }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayLocal());
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
    setDate(todayLocal());
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
      // 保留用户在 radio 上的选择，不再按顺序硬编码第一位
      return players
        .filter((p) => p.id !== "")
        .map((p) => ({
          ...p,
          score: 0,
          result: p.result === "胜" ? ("胜" as const) : null,
        }));
    }
    if (template === "合作胜负") {
      // 全队共享同一结果：只要有人标记合作败，全队判负
      const coopVerdict: "合作胜" | "合作败" = players.some(
        (p) => p.result === "合作败",
      )
        ? "合作败"
        : "合作胜";
      return players
        .filter((p) => p.id !== "")
        .map((p) => ({ ...p, score: 0, result: coopVerdict }));
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

    // 单一赢家：必须恰好勾选一人，否则保存后没有胜者
    if (template === "单一赢家") {
      const winners = valid.filter((p) => p.result === "胜").length;
      if (winners !== 1) {
        setMessage("请在玩家右侧勾选一位获胜玩家");
        return;
      }
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
          className="r-btn r-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
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
          <div className="r-overlay absolute inset-0 bg-[#1a1712]/60 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="r-modal relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-pop border border-line dark:border-gray-700 p-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[16px] font-semibold text-ink dark:text-gray-100">
                记录新对局 · {gameTitle}
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:text-ink-2 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">日期</label>
                <CustomDatePicker value={date} onChange={setDate} />
              </div>

              {/* 计分模板选择 */}
              <div>
                <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">计分模板</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCORING_TEMPLATES.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      aria-pressed={template === t.id}
                      className={`flex items-start gap-2 px-2.5 py-2 rounded border text-left transition-colors ${
                        template === t.id
                          ? "border-accent-600 bg-accent-50 dark:bg-accent-900/20"
                          : "border-line dark:border-gray-600 hover:border-accent-400"
                      }`}
                    >
                      {/* 用序号代替 emoji：六个选项的图标信息量低，反而让扫读变慢 */}
                      <span className="tnum text-[10px] text-ink-3 dark:text-gray-500 mt-0.5 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-ink dark:text-gray-100">{t.label}</div>
                        <div className="text-[10.5px] text-ink-3 dark:text-gray-500 leading-snug">{t.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 战役叙事模板 - 场景/叙事输入 */}
              {tpl.inputType === "narrative" && (
                <>
                  <div>
                    <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
                      场景 / 章节名称
                    </label>
                    <input
                      type="text"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="例如：第一章·午夜面具"
                      className="r-input w-full px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
                      叙事记录
                    </label>
                    <textarea
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value)}
                      placeholder="记录发生了什么：获得物品、触发事件、角色状态变化..."
                      rows={4}
                      className="r-input w-full px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px] resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
                      完成标记（可选）
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCompletion(null)}
                        aria-pressed={completion === null}
                        className={`flex-1 px-3 py-1.5 rounded border text-[12px] transition-colors ${
                          completion === null
                            ? "border-accent-600 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300"
                            : "border-line dark:border-gray-600 text-ink-2 dark:text-gray-400 hover:border-accent-400"
                        }`}
                      >
                        不标记
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompletion("完整通关")}
                        aria-pressed={completion === "完整通关"}
                        className={`flex-1 px-3 py-1.5 rounded border text-[12px] transition-colors ${
                          completion === "完整通关"
                            ? "border-accent-600 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300"
                            : "border-line dark:border-gray-600 text-ink-2 dark:text-gray-400 hover:border-accent-400"
                        }`}
                      >
                        完整通关
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompletion("中途放弃")}
                        aria-pressed={completion === "中途放弃"}
                        className={`flex-1 px-3 py-1.5 rounded border text-[12px] transition-colors ${
                          completion === "中途放弃"
                            ? "border-gray-400 bg-gray-100 dark:bg-gray-700/60 text-ink dark:text-gray-200"
                            : "border-line dark:border-gray-600 text-ink-2 dark:text-gray-400 hover:border-gray-400"
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
                <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
                  玩家 {tpl.inputType === "rank" && <span className="text-[10.5px] text-ink-3">（输入名次，并列输入相同数字）</span>}
                </label>
                <div className="space-y-1.5">
                  {players.map((p, i) => {
                    const usedIds = players.filter((_, j) => j !== i).map((x) => x.id);
                    const available = allPlayers.filter((ap) => !usedIds.includes(ap.id));

                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="tnum w-6 h-6 flex-shrink-0 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-ink-2 dark:text-gray-300 text-[11px]">
                          {tpl.inputType === "rank" ? (p.rank ?? "–") : tpl.inputType === "narrative" ? i + 1 : i + 1}
                        </span>
                        <CustomSelect
                          value={p.id}
                          options={available.map((ap) => ({ value: ap.id, label: ap.name }))}
                          onChange={(v) => handleSelectPlayer(i, v)}
                          placeholder="选择玩家"
                          className="flex-1 min-w-0"
                        />

                        {/* 不同模板的输入控件 */}
                        {tpl.inputType === "score" && (
                          <input
                            type="number"
                            placeholder="分数"
                            value={p.score || ""}
                            onChange={(e) => updatePlayer(i, { score: Number(e.target.value) })}
                            className="w-24 px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px]"
                          />
                        )}

                        {tpl.inputType === "winloss" && (
                          <CustomSelect
                            value={p.result ?? ""}
                            options={[
                              { value: "", label: "-" },
                              { value: "胜", label: "胜" },
                              { value: "平", label: "平" },
                              { value: "负", label: "负" },
                            ]}
                            onChange={(v) => updatePlayer(i, { result: (v || null) as PlayerScore["result"] })}
                            className="w-24"
                          />
                        )}

                        {tpl.inputType === "rank" && (
                          <input
                            type="number"
                            min={1}
                            placeholder="名次"
                            value={p.rank ?? ""}
                            onChange={(e) => updatePlayer(i, { rank: e.target.value ? Number(e.target.value) : null })}
                            className="w-20 px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px]"
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
                              className="accent-accent-600"
                            />
                            赢家
                          </label>
                        )}

                        {tpl.inputType === "coop" && (
                          <CustomSelect
                            value={p.result ?? "合作胜"}
                            options={[
                              { value: "合作胜", label: "合作胜" },
                              { value: "合作败", label: "合作败" },
                            ]}
                            onChange={(v) => updatePlayer(i, { result: v as PlayerScore["result"] })}
                            disabled={i > 0}
                            className="w-24"
                          />
                        )}

                        {players.length > 1 && (
                          <button type="button" onClick={() => removePlayer(i)} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={addPlayer} className="mt-1.5 text-[11.5px] text-accent-700 dark:text-accent-300 hover:underline">
                  + 添加玩家
                </button>
              </div>

              <div>
                <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">备注（选填）</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例如：新手局、加扩…"
                  className="r-input w-full px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">管理员密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码确认操作"
                  className="r-input w-full px-3 py-1.5 rounded-md border border-line dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 focus:outline-none focus:border-accent-500 outline-none text-[12.5px]"
                />
              </div>

              {message && <p className={`text-[12px] ${message.includes("失败") ? "text-red-600 dark:text-red-400" : "text-accent-700 dark:text-accent-300"}`}>{message}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="r-btn flex-1 px-4 py-1.5 rounded-md border border-line-strong dark:border-gray-600 text-ink-2 dark:text-gray-300 text-[12.5px]">取消</button>
                <button type="submit" disabled={loading} className="r-btn r-btn-primary flex-1 px-4 py-1.5 rounded-md bg-accent-600 hover:bg-accent-700 text-white text-[12.5px] disabled:opacity-50">{loading ? "保存中…" : "保存"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
