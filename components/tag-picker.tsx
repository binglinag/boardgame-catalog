"use client";

import { useMemo, useState } from "react";

/**
 * 统一的标签多选器
 *
 * 此前新建页用「药丸多选」、编辑页用「逗号分隔文本框」，
 * 同一个字段两种交互，用户每次都要重新学一遍。
 * 这里收敛成一个组件，两处共用，并额外支持录入新标签。
 */
interface Props {
  /** 备选标签池（通常来自已有桌游的标签并集） */
  options: string[];
  /** 逗号分隔的标签串，与 GameEditForm.tags / 动态表单的值保持一致 */
  value: string;
  onChange: (next: string) => void;
  /** 是否允许输入备选池里没有的新标签 */
  allowCustom?: boolean;
  /** 是否用更紧凑的尺寸（表单里大量排列时用） */
  compact?: boolean;
}

function split(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TagPicker({
  options,
  value,
  onChange,
  allowCustom = true,
  compact = false,
}: Props) {
  const [draft, setDraft] = useState("");

  const selected = useMemo(() => split(value), [value]);

  // 已选但不在备选池里的标签也要能显示，否则用户看不到自己加的
  const allOptions = useMemo(() => {
    const merged = [...options];
    for (const tag of selected) {
      if (!merged.includes(tag)) merged.push(tag);
    }
    return merged;
  }, [options, selected]);

  function toggle(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next.join(", "));
  }

  function addDraft() {
    const tag = draft.trim();
    if (!tag) return;
    if (!selected.includes(tag)) onChange([...selected, tag].join(", "));
    setDraft("");
  }

  const sizeCls = compact
    ? "px-2.5 py-1 text-xs"
    : "px-3.5 py-2 text-sm";

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {allOptions.length === 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            该列还没有可选项，可以直接在下面输入新标签
          </span>
        )}

        {allOptions.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              aria-pressed={active}
              className={`r-tag-btn ${sizeCls} rounded-xl font-medium border transition-all duration-200 ${
                active
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20"
                  : "bg-white/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="输入新标签后回车添加"
            className="r-input w-48 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
              bg-gray-50/80 dark:bg-gray-700/40 text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500 text-xs
              focus:ring-2 focus:ring-violet-500/25 focus:border-violet-300 outline-none transition-all"
          />
          <button
            type="button"
            onClick={addDraft}
            disabled={!draft.trim()}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline
              disabled:opacity-40 disabled:no-underline"
          >
            + 添加
          </button>
          {selected.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              已选 {selected.length} 个
            </span>
          )}
        </div>
      )}
    </div>
  );
}
