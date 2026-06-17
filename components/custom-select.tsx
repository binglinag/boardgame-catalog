"use client";

import { useState, useRef, useEffect, useMemo } from "react";

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
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
          bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm
          text-left text-sm
          hover:border-violet-300/60 dark:hover:border-violet-700/40
          focus:ring-2 focus:ring-violet-400/30 outline-none
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`flex-1 truncate ${selected ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-full min-w-[8rem]
          rounded-xl bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-2xl shadow-violet-500/10
          overflow-hidden animate-scale-in
          max-h-52 overflow-y-auto">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isActive && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
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
