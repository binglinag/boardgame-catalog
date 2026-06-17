"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return "选择日期";
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export default function CustomDatePicker({ value, onChange }: Props) {
  const today = new Date();
  const initialDate = value ? new Date(value + "T12:00:00") : today;

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
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

  const selectDate = useCallback(
    (day: number) => {
      const iso = formatISO(year, month, day);
      onChange(iso);
      setOpen(false);
    },
    [year, month, onChange]
  );

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const selectedISO = value;
  const todayISO = formatISO(today.getFullYear(), today.getMonth(), today.getDate());

  // 生成日历格子
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
          bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm
          text-gray-900 dark:text-white text-sm
          hover:border-violet-300/60 dark:hover:border-violet-700/40
          focus:ring-2 focus:ring-violet-400/30 outline-none
          transition-all duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-left">{formatDisplay(value)}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 w-64 p-3 rounded-2xl
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          shadow-2xl shadow-violet-500/10 animate-scale-in">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-500 hover:text-violet-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              {year}年{month + 1}月
            </span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-500 hover:text-violet-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 星期头 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[0.6rem] font-semibold text-gray-400 py-1">
                {w}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const iso = formatISO(year, month, day);
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;

              let cellClass = "text-center text-xs py-1.5 rounded-lg cursor-pointer transition-all ";
              if (isSelected) {
                cellClass += "bg-violet-600 text-white font-bold shadow-sm";
              } else if (isToday) {
                cellClass += "text-violet-600 dark:text-violet-400 font-bold ring-1 ring-violet-300 dark:ring-violet-700";
              } else {
                cellClass += "text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20";
              }

              return (
                <button
                  type="button"
                  key={iso}
                  onClick={() => selectDate(day)}
                  className={cellClass}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
