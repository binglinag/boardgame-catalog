"use client";

import { useState, useRef, useEffect, useMemo } from "react";

/**
 * 下拉选择
 *
 * 原实现是这一批改造里漏掉的一个组件：紫色描边 + 紫色焦点环 +
 * shadow-2xl 紫色投影 + 玻璃底（bg-white/60 backdrop-blur），
 * 选中项还靠 font-semibold 和一颗只在选中行出现的勾来做层级，
 * 导致文字列跟着勾左右跳。
 *
 * 现在跟其余控件对齐：暖纸底 + 一条发丝边框，选中用砖红淡底，
 * 勾位固定占宽（未选中透明），所以每行文字都落在同一条竖线上。
 */

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "请选择",
  disabled = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="r-input w-full flex items-center gap-2 px-3 py-2 rounded
          border border-line dark:border-gray-600
          bg-white dark:bg-gray-800
          text-left text-[12.5px]
          hover:border-line-strong dark:hover:border-gray-500
          focus:outline-none focus:border-accent-500 dark:focus:border-accent-600
          focus:ring-2 focus:ring-accent-600/15
          transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={`flex-1 truncate ${
            selected ? "text-ink dark:text-gray-100" : "text-ink-3 dark:text-gray-500"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 text-ink-3 dark:text-gray-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="r-panel absolute top-full mt-1 left-0 z-50 min-w-full w-max
            rounded-lg bg-white dark:bg-gray-800
            border border-line dark:border-gray-700
            shadow-pop
            overflow-hidden animate-fade-in
            max-h-52 overflow-y-auto"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left pl-2 pr-3 py-2 text-[12.5px] transition-colors ${
                  isActive
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-900/25 dark:text-accent-300"
                    : "text-ink-2 dark:text-gray-300 hover:bg-paper-deep dark:hover:bg-gray-700/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {/* 勾位固定 14px：未选中时留空但占位，所有文字才对齐 */}
                  <span className="w-3.5 flex-shrink-0 flex items-center justify-center">
                    <svg
                      className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-0"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
