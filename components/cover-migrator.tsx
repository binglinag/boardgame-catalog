"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { migrateCoversBatch } from "@/app/actions/migrate";
import type { MigrateDetail } from "@/types/migrate";

const PW_KEY = "zz_admin_pw";
const BATCH_SIZE = 3;

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 " +
  "bg-gray-50/80 dark:bg-gray-700/40 text-gray-900 dark:text-white " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-300 dark:focus:border-violet-600 " +
  "outline-none transition-all";

export default function CoverMigrator() {
  const [password, setPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<MigrateDetail[]>([]);

  const [stats, setStats] = useState({
    totalGames: 0,
    migrated: 0,
    failed: 0,
    pending: 0,
    alreadyMigrated: 0,
  });

  const stopRef = useRef(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) setPassword(saved);
  }, []);

  const total = stats.totalGames || 0;
  const processed = total > 0 ? Math.min(total, stats.alreadyMigrated + stats.migrated + stats.failed) : 0;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  async function start() {
    const pw = password.trim();
    if (!pw) {
      setMessage("请先输入管理员密码");
      return;
    }

    setRunning(true);
    setFinished(false);
    setMessage("");
    setLogs([]);
    stopRef.current = false;

    let accMigrated = 0;
    let accFailed = 0;
    let idleRounds = 0;

    try {
      while (!stopRef.current) {
        const res = await migrateCoversBatch(pw, BATCH_SIZE);

        if (!res.success) {
          setMessage(res.message ?? "迁移失败");
          break;
        }

        sessionStorage.setItem(PW_KEY, pw);
        accMigrated += res.migrated;
        accFailed += res.failed;

        setStats({
          totalGames: res.totalGames,
          migrated: accMigrated,
          failed: accFailed,
          pending: res.pending,
          alreadyMigrated: res.alreadyMigrated,
        });

        if (res.details.length > 0) {
          setLogs((prev) => [...res.details, ...prev].slice(0, 300));
        }

        if (res.done) {
          setFinished(true);
          break;
        }

        // 防死循环：连续两轮一张都没成功就停
        if (res.migrated === 0) {
          idleRounds++;
          if (idleRounds >= 2) {
            setMessage("连续两轮没有成功迁移，可能图片源已失效，已自动停止");
            break;
          }
        } else {
          idleRounds = 0;
        }
      }
    } catch {
      setMessage("运行中断，请重试");
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    stopRef.current = true;
    setMessage("已停止（当前批次完成后生效）");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500
          hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          封面图批量迁移
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          把 Notion 里现有的封面图逐张下载、上传到 Vercel Blob，然后把 Blob 链接写回 Notion。
          已经是 Blob 的图片会自动跳过，可以反复运行。
        </p>
      </div>

      {/* 密码 */}
      <section className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm p-5 mb-6">
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          🔐 管理员密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="管理员密码"
          className={inputCls}
          autoComplete="current-password"
          disabled={running}
        />
      </section>

      {/* 统计 */}
      <section className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="有封面游戏" value={stats.totalGames} />
          <Stat label="本轮已迁移" value={stats.migrated} tone="violet" />
          <Stat label="原本就在 Blob" value={stats.alreadyMigrated} tone="emerald" />
          <Stat label="剩余待处理" value={stats.pending} tone={stats.pending > 0 ? "amber" : undefined} />
        </div>

        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {total > 0 ? `${processed} / ${total}（${percent}%）` : "尚未开始"}
        </p>
      </section>

      {/* 操作 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            shadow-lg shadow-violet-500/20 transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? "迁移中..." : finished ? "再跑一遍" : "开始迁移"}
        </button>

        {running && (
          <button
            type="button"
            onClick={stop}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300
              border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-all"
          >
            停止
          </button>
        )}

        {message && (
          <span className={`text-sm ${finished ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {finished ? "✅ " : "⚠️ "}
            {message}
          </span>
        )}
        {!message && finished && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            ✅ 全部处理完了
          </span>
        )}
      </div>

      {/* 日志 */}
      {logs.length > 0 && (
        <section className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            迁移日志（最新在上）
          </h2>
          <div className="space-y-1.5 max-h-80 overflow-y-auto text-xs">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={log.status === "migrated" ? "text-emerald-500" : "text-red-500"}>
                  {log.status === "migrated" ? "✓" : "✕"}
                </span>
                <span className="text-gray-700 dark:text-gray-300 font-medium flex-shrink-0">
                  {log.title}
                </span>
                <span className="text-gray-400 dark:text-gray-500">{log.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "violet" | "emerald" | "amber";
}) {
  const colorMap = {
    violet: "text-violet-600 dark:text-violet-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl bg-white/60 dark:bg-gray-700/30 border border-white/50 dark:border-white/5 p-3">
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone ? colorMap[tone] : "text-gray-800 dark:text-gray-100"}`}>
        {value}
      </p>
    </div>
  );
}
