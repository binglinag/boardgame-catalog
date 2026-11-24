"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomSelect from "./custom-select";
import ImageUploader from "./image-uploader";
import TagPicker from "./tag-picker";
import { createGame } from "@/app/actions/games";
import type { FieldDef } from "@/lib/notion-fields";

const PW_KEY = "zz_admin_pw";

const inputCls =
  "r-input w-full px-3.5 py-2.5 rounded-md border border-line dark:border-gray-600 " +
  "bg-white dark:bg-gray-800 text-ink dark:text-gray-100 " +
  "placeholder:text-ink-3 dark:placeholder:text-gray-500 text-[13px] " +
  "focus:outline-none focus:border-accent-500 " +
  "transition-colors";

/** 这些字眼的 rich_text 列用多行文本框 */
const LONG_TEXT_HINTS = ["评价", "备注", "描述", "介绍", "说明", "心得"];

/** 这些 files 列用上传组件（点击/拖拽/粘贴），其余 files 列仍用 URL 文本框 */
const UPLOAD_HINTS = ["封面", "cover"];

type FormValues = Record<string, string | string[]>;

function buildInitialValues(fields: FieldDef[]): FormValues {
  const values: FormValues = {};
  for (const f of fields) {
    values[f.name] = f.type === "multi_select" ? [] : "";
  }
  return values;
}

export default function GameCreateForm({ fields }: { fields: FieldDef[] }) {
  const router = useRouter();
  const initial = useMemo(() => buildInitialValues(fields), [fields]);
  const [values, setValues] = useState<FormValues>(initial);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      setPassword(saved);
      setUnlocked(true);
    }
  }, []);

  const dirty = useMemo(() => {
    for (const key of Object.keys(values)) {
      const a = values[key];
      const b = initial[key];
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
    return false;
  }, [values, initial]);

  function setValue(name: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setOk(false);
  }

  async function handleSave() {
    const titleField = fields.find((f) => f.type === "title");
    if (titleField) {
      const t = values[titleField.name];
      if (!t || (typeof t === "string" && !t.trim())) {
        setMessage(`「${titleField.name}」不能为空`);
        setOk(false);
        return;
      }
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
      const res = await createGame(pw, values);
      setOk(res.success);
      setMessage(res.message);
      if (res.success) {
        sessionStorage.setItem(PW_KEY, pw);
        setUnlocked(true);
        setCreatedId(res.pageId ?? null);
        setValues(initial);
        router.refresh();
      } else if (res.message.includes("密码")) {
        sessionStorage.removeItem(PW_KEY);
        setUnlocked(false);
      }
    } catch {
      setOk(false);
      setMessage("创建失败，请检查网络后重试");
    } finally {
      setSaving(false);
    }
  }

  function renderField(f: FieldDef) {
    if (f.type === "unsupported") return null;

    // 封面图：上传组件（点击选择 / 拖拽 / Ctrl+V 粘贴）
    if (f.type === "files" && UPLOAD_HINTS.some((k) => f.name.toLowerCase().includes(k))) {
      return (
        <div key={f.name} className="sm:col-span-2">
          <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
            {f.name}
          </label>
          <ImageUploader
            value={(values[f.name] as string) ?? ""}
            onChange={(url) => setValue(f.name, url)}
            password={password}
            nameHint="cover"
          />
        </div>
      );
    }

    const isLong =
      f.type === "rich_text" && LONG_TEXT_HINTS.some((k) => f.name.includes(k));
    const full = f.type === "title" || isLong || f.type === "files" || f.type === "multi_select";

    return (
      <div key={f.name} className={full ? "sm:col-span-2" : ""}>
        <label className="block text-[11.5px] text-ink-2 dark:text-gray-400 mb-1.5">
          {f.name}
          {f.type === "title" && <span className="ml-0.5 text-accent-600">*</span>}
        </label>

        {(f.type === "title" ||
          f.type === "rich_text" ||
          f.type === "url" ||
          f.type === "number" ||
          f.type === "files" ||
          f.type === "date") &&
          (isLong || f.type === "files" ? (
            <textarea
              value={(values[f.name] as string) ?? ""}
              onChange={(e) => setValue(f.name, e.target.value)}
              className={`${inputCls} resize-y min-h-[88px]`}
              placeholder={
                f.type === "files"
                  ? "图片直链 URL（多个用换行分隔）"
                  : isLong
                    ? "写点什么..."
                    : ""
              }
            />
          ) : (
            <input
              type={
                f.type === "number" ? "number" : f.type === "url" ? "url" : f.type === "date" ? "date" : "text"
              }
              step={f.type === "number" ? "any" : undefined}
              value={(values[f.name] as string) ?? ""}
              onChange={(e) => setValue(f.name, e.target.value)}
              className={inputCls}
              placeholder={
                f.type === "url"
                  ? "https://..."
                  : f.type === "title"
                    ? "中文名 / 主标题"
                    : ""
              }
            />
          ))}

        {f.type === "select" && (
          <CustomSelect
            value={(values[f.name] as string) ?? ""}
            options={[
              { value: "", label: "未选择" },
              ...f.options.map((o) => ({ value: o, label: o })),
            ]}
            onChange={(v) => setValue(f.name, v)}
            placeholder="未选择"
          />
        )}

        {f.type === "multi_select" && (
          <TagPicker
            options={f.options}
            value={((values[f.name] as string[]) ?? []).join(", ")}
            allowCustom={f.name !== "状态"}
            onChange={(v) =>
              setValue(
                f.name,
                v.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        )}

        {f.type === "checkbox" && (
          <button
            type="button"
            onClick={() => setValue(f.name, values[f.name] === "true" ? "false" : "true")}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
              values[f.name] === "true"
                ? "bg-violet-600"
                : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                values[f.name] === "true" ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        )}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">读不到 Notion 表结构</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          检查 Vercel 环境变量 NOTION_API_KEY / NOTION_DATABASE_ID 是否配置正确
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-violet-600 dark:text-violet-400">
          ← 返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
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
          返回首页
        </Link>
        <span className="flex items-center gap-2 text-[11px] text-ink-3 dark:text-gray-500">
          <Link
            href="/migrate"
            className="hover:text-accent-700 dark:hover:text-accent-300 hover:underline transition-colors"
          >
            批量迁移封面图
          </Link>
          <span aria-hidden="true" className="text-line-strong dark:text-gray-700">·</span>
          <span>
            按 Notion 表结构生成 · {fields.length} 个字段
          </span>
        </span>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-[22px] font-semibold text-ink dark:text-gray-100 mb-1">新增桌游</h1>
        <p className="text-[12.5px] text-ink-3 dark:text-gray-500">
          填写后保存，会直接在 Notion 桌游数据库创建一条新记录
        </p>
      </div>

      {/* 权限 */}
      <section className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[13px] font-medium text-ink dark:text-gray-200">
              管理员密码
            </h2>
            <p className="text-[11.5px] text-ink-3 dark:text-gray-500 mt-0.5">
              {unlocked
                ? "本次会话已解锁，保存时自动带上密码"
                : "输入后才能写入 Notion"}
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

      {/* 动态字段 */}
      <section className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {fields.map(renderField)}
        </div>
      </section>

      {/* 底部保存栏 */}
      <div
        className="r-bar fixed bottom-0 left-0 right-0 z-30 border-t border-line dark:border-gray-800
          bg-paper/95 dark:bg-[#1a1712]/95 backdrop-blur"
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
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
                {dirty ? "有未保存的内容" : "还没填写"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ok && createdId && (
              <Link
                href={`/${createdId}`}
                className="px-3 py-1.5 rounded-md text-[12.5px] text-accent-700 dark:text-accent-300
                  hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
              >
                打开详情 →
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setValues(initial);
                setMessage("");
                setOk(false);
              }}
              disabled={!dirty || saving}
              className="r-btn px-3.5 py-1.5 rounded-md text-[12.5px] text-ink-2 dark:text-gray-400
                border border-line-strong dark:border-gray-600
                hover:border-accent-500 hover:text-accent-700 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              清空
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="r-btn r-btn-primary px-4 py-1.5 rounded-md text-[12.5px] text-white
                bg-accent-600 hover:bg-accent-700
                transition-colors
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
