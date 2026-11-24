"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateGame } from "@/app/actions/games";
import TagPicker from "./tag-picker";
import {
  GAME_STATUS_OPTIONS,
  type BoardGame,
  type GameEditForm,
  type GameStatus,
} from "@/types/game";

const PW_KEY = "zz_admin_pw";

const inputCls =
  "r-input w-full px-3.5 py-2.5 rounded-md border border-line dark:border-gray-600 " +
  "bg-white dark:bg-gray-800 text-ink dark:text-gray-100 " +
  "placeholder:text-ink-3 dark:placeholder:text-gray-500 text-[13px] " +
  "focus:outline-none focus:border-accent-500 " +
  "transition-colors";

function toForm(game: BoardGame): GameEditForm {
  return {
    title: game.title,
    nameEn: game.nameEn,
    players: game.players,
    bestPlayers: game.bestPlayers,
    playTime: game.playTime,
    year: game.year !== null ? String(game.year) : "",
    designer: game.designer,
    rating: game.rating !== null ? String(game.rating) : "",
    weight: game.weight !== null ? String(game.weight) : "",
    status: [...game.status],
    tags: game.tags.join(", "),
    coverUrl: game.coverUrl ?? "",
    extraImages: game.extraImages.join("\n"),
    bggUrl: game.bggUrl ?? "",
    price: game.price !== null ? String(game.price) : "",
    priceNotes: game.priceNotes,
    review: game.review,
  };
}

export default function GameEditor({ game, allTags }: { game: BoardGame; allTags: string[] }) {
  const router = useRouter();
  const initial = useMemo(() => toForm(game), [game]);
  const [form, setForm] = useState<GameEditForm>(initial);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  // 客户端读取上次记住的密码
  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      setPassword(saved);
      setUnlocked(true);
    }
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  function set<K extends keyof GameEditForm>(key: K, value: GameEditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage("");
    setOk(false);
  }

  function toggleStatus(status: GameStatus) {
    setForm((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
    setMessage("");
    setOk(false);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setMessage("名称不能为空");
      setOk(false);
      return;
    }
    const pw = password.trim();
    if (!pw) {
      setMessage("请先输入管理员密码");
      setOk(false);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await updateGame(pw, game.id, form);
      setOk(res.success);
      setMessage(res.message);
      if (res.success) {
        sessionStorage.setItem(PW_KEY, pw);
        setUnlocked(true);
        router.refresh();
      } else if (res.message.includes("密码")) {
        sessionStorage.removeItem(PW_KEY);
        setUnlocked(false);
      }
    } catch {
      setOk(false);
      setMessage("保存失败，请检查网络后重试");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(initial);
    setMessage("");
    setOk(false);
  }

  const coverPreview = /^https?:\/\//i.test(form.coverUrl.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/${game.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500
            hover:text-gray-700 dark:hover:text-gray-300 transition-colors group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回详情
        </Link>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          编辑内容会直接写回 Notion 数据库
        </span>
      </div>

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          编辑「{game.title}」
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dirty ? "有未保存的改动" : "所有改动已同步"} · 页面 ID {game.id.slice(0, 8)}…
        </p>
      </div>

      {/* 权限 */}
      <section className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[13px] font-medium text-ink dark:text-gray-200">
              编辑权限
            </h2>
            <p className="text-[11.5px] text-ink-3 dark:text-gray-500 mt-0.5">
              {unlocked
                ? "本次会话已解锁，保存时自动带上密码"
                : "输入管理员密码后才能保存到 Notion"}
            </p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            className={`${inputCls} max-w-xs`}
            autoComplete="current-password"
          />
        </div>
      </section>

      {/* 基本信息 */}
      <Section title="基本信息" desc="名称是 Notion 的标题列，必填">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="名称 *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="中文名 / 主标题"
            />
          </Field>
          <Field label="英文名">
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              className={inputCls}
              placeholder="English Name"
            />
          </Field>
          <Field label="玩家人数">
            <input
              type="text"
              value={form.players}
              onChange={(e) => set("players", e.target.value)}
              className={inputCls}
              placeholder="如 2-5"
            />
          </Field>
          <Field label="最佳人数">
            <input
              type="text"
              value={form.bestPlayers}
              onChange={(e) => set("bestPlayers", e.target.value)}
              className={inputCls}
              placeholder="如 3-4"
            />
          </Field>
          <Field label="游戏时长">
            <input
              type="text"
              value={form.playTime}
              onChange={(e) => set("playTime", e.target.value)}
              className={inputCls}
              placeholder="如 60-120min"
            />
          </Field>
          <Field label="出版年份">
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              className={inputCls}
              placeholder="如 2019"
            />
          </Field>
          <Field label="设计师" full>
            <input
              type="text"
              value={form.designer}
              onChange={(e) => set("designer", e.target.value)}
              className={inputCls}
              placeholder="多个设计师可用逗号分隔"
            />
          </Field>
        </div>
      </Section>

      {/* 评分与状态 */}
      <Section title="评分与状态" desc="评分 0-10，重度 1-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="评分">
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
              className={inputCls}
              placeholder="0 - 10"
            />
          </Field>
          <Field label="重度">
            <input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              className={inputCls}
              placeholder="1 - 5"
            />
          </Field>
        </div>

        <Field label="状态" full>
          <div className="flex flex-wrap gap-2">
            {GAME_STATUS_OPTIONS.map((s) => {
              const active = form.status.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  aria-pressed={active}
                  className={`r-tag-btn px-3 py-1.5 rounded text-[12.5px] border transition-colors ${
                    active
                      ? "bg-accent-600 text-white border-accent-600"
                      : "bg-white dark:bg-gray-800 text-ink-2 dark:text-gray-400 border-line-strong dark:border-gray-600 hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-300"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="标签" full>
          <TagPicker
            options={allTags}
            value={form.tags}
            onChange={(v) => set("tags", v)}
          />
        </Field>
      </Section>

      {/* 图片 */}
      <Section title="图片" desc="填写图片直链 URL，支持 BGG 图床、Vercel Blob 等">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4 items-start">
          <div className="space-y-4">
            <Field label="封面图 URL">
              <input
                type="url"
                value={form.coverUrl}
                onChange={(e) => set("coverUrl", e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
            <Field label="相关图片 URL" hint="每行一个">
              <textarea
                value={form.extraImages}
                onChange={(e) => set("extraImages", e.target.value)}
                className={`${inputCls} resize-y min-h-[88px] font-mono text-xs`}
                placeholder={"https://...\nhttps://..."}
              />
            </Field>
          </div>
          <div className="aspect-[4/5] rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900 border border-line dark:border-gray-700 flex items-center justify-center">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.coverUrl}
                alt="封面预览"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11.5px] text-ink-3 dark:text-gray-500 px-2 text-center">
                封面预览
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* 购买 */}
      <Section title="购买信息">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="购买价格">
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputCls}
              placeholder="如 268"
            />
          </Field>
          <Field label="价格备注">
            <input
              type="text"
              value={form.priceNotes}
              onChange={(e) => set("priceNotes", e.target.value)}
              className={inputCls}
              placeholder="如 2024 双十一入手"
            />
          </Field>
        </div>
      </Section>

      {/* 内容 */}
      <Section title="内容">
        <Field label="BGG 链接" full>
          <input
            type="url"
            value={form.bggUrl}
            onChange={(e) => set("bggUrl", e.target.value)}
            className={inputCls}
            placeholder="https://boardgamegeek.com/boardgame/..."
          />
        </Field>
        <Field label="个人评价" hint="支持长文本，自动分段写入" full>
          <textarea
            value={form.review}
            onChange={(e) => set("review", e.target.value)}
            className={`${inputCls} resize-y min-h-[140px] leading-relaxed`}
            placeholder="写下你对这款桌游的感受..."
          />
        </Field>
      </Section>

      {/* 底部保存栏 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-line dark:border-gray-800
          bg-paper/95 dark:bg-[#1a1712]/95 backdrop-blur"
      >
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {message ? (
              <p
                className={`text-[12.5px] truncate ${
                  ok ? "text-accent-700 dark:text-accent-300" : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            ) : (
              <p className="text-[11.5px] text-ink-3 dark:text-gray-500">
                {dirty ? "有未保存的改动" : "没有改动"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ok && (
              <Link
                href={`/${game.id}`}
                className="px-3 py-1.5 rounded-md text-[12.5px] text-accent-700 dark:text-accent-300
                  hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
              >
                查看详情 →
              </Link>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving}
              className="px-3.5 py-1.5 rounded-md text-[12.5px] text-ink-2 dark:text-gray-400
                border border-line-strong dark:border-gray-600
                hover:border-accent-500 hover:text-accent-700 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              还原
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-1.5 rounded-md text-[12.5px] text-white
                bg-accent-600 hover:bg-accent-700 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "保存中…" : "保存到 Notion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-4">
      <div className="mb-3.5">
        <h2 className="font-serif text-[14px] font-semibold text-ink dark:text-gray-200">{title}</h2>
        {desc && <p className="text-[11.5px] text-ink-3 dark:text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
        {label}
        {hint && <span className="ml-1.5 text-ink-3 dark:text-gray-500">（{hint}）</span>}
      </label>
      {children}
    </div>
  );
}
