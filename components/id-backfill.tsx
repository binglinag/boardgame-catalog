"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { backfillSessionGameIds } from "@/app/actions/backfill";
import type { BackfillResult } from "@/app/actions/backfill";

const PW_KEY = "zz_admin_pw";
const BATCH_SIZE = 8;

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 " +
  "bg-gray-50/80 dark:bg-gray-700/40 text-gray-900 dark:text-white " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-300 dark:focus:border-violet-600 " +
  "outline-none transition-all";

export default function IdBackfill() {
  const [password, setPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [columnCreated, setColumnCreated] = useState(false);

  const [stats, setStats] = useState({
    totalSessions: 0,
    alreadyHasId: 0,
    updated: 0,
    pending: 0,
    sessionsMissingPlayerId: 0,
  });
  const [unmatched, setUnmatched] = useState<Array<{ title: string; count: number }>>([]);

  const stopRef = useRef(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) setPassword(saved);
  }, []);

  const total = stats.totalSessions || 0;
  const processed = total > 0 ? Math.min(total, stats.alreadyHasId + stats.updated) : 0;
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
    setUnmatched([]);
    stopRef.current = false;

    let accUpdated = 0;
    let idleRounds = 0;

    try {
      while (!stopRef.current) {
        const res: BackfillResult = await backfillSessionGameIds(pw, BATCH_SIZE);

        if (!res.success) {
          setMessage(res.message ?? "回填失败");
          break;
        }

        sessionStorage.setItem(PW_KEY, pw);
        if (res.columnCreated) setColumnCreated(true);
        accUpdated += res.updated;

        setStats({
          totalSessions: res.totalSessions,
          alreadyHasId: res.alreadyHasId,
          updated: accUpdated,
          pending: res.pending,
          sessionsMissingPlayerId: res.sessionsMissingPlayerId,
        });
        setUnmatched(res.unmatched);

        if (res.done) {
          setFinished(true);
          break;
        }

        if (res.updated === 0) {
          idleRounds++;
          if (idleRounds >= 2) {
            setMessage("连续两轮没有写入，可能已无可回填数据，已停止");
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
          对局 ID 回填
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          给历史对局补上「游戏ID」，让游戏改名后历史记录仍能正确关联。
          会自动在对局库创建「游戏ID」列（如果还没有）。
          已有 ID 的记录会跳过，可以反复运行。
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          玩家 ID 不需要回填 —— 历史对局数据里本来就有，只是之前读取时被丢掉了。
        </p>
      </div>

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

      <section className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="对局总数" value={stats.totalSessions} />
          <Stat label="已有 ID" value={stats.alreadyHasId} tone="emerald" />
          <Stat label="本次回填" value={stats.updated} tone="violet" />
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
          {running ? "回填中..." : finished ? "再跑一遍" : "开始回填"}
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
          <span className="text-sm text-amber-600 dark:text-amber-400">⚠️ {message}</span>
        )}
        {!message && finished && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">✅ 回填完成</span>
        )}
      </div>

      {columnCreated && (
        <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-900/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          ✅ 已在对局库自动创建「游戏ID」列
        </div>
      )}

      {stats.sessionsMissingPlayerId > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          有 {stats.sessionsMissingPlayerId} 条对局的玩家数据缺少 ID，排行榜会退回按姓名统计。
          这些记录无法自动修复（不知道对应哪个玩家），需要人工处理。
        </div>
      )}

      {unmatched.length > 0 && (
        <section className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            无法匹配的对局（{unmatched.length} 个游戏名）
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            这些对局里记录的桌游名，在桌游图鉴中找不到同名条目 —— 通常是游戏被改过名。
            它们不会写入 ID，只按名称关联。
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-gray-500">
                  <th className="text-left py-1.5 font-medium">对局里记录的桌游名</th>
                  <th className="text-right py-1.5 font-medium w-20">对局数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/20">
                {unmatched.map((u) => (
                  <tr key={u.title}>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{u.title}</td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{u.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
