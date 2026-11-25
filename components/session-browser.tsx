"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PlayerFilter from "./player-filter";
import SessionRecord from "./session-record";
import { hasPlayers } from "@/lib/leaderboard-stats";
import type { PlaySession } from "@/types/session";
import type { Player } from "@/types/player";

/**
 * 对局记录浏览
 *
 * 和排行榜共用一套「共同对局」规则：勾选多人时只保留他们同时在场的记录。
 * 初始选中从 URL 的 ?players=id1,id2 读，排行榜的按钮就是这样跳进来的。
 */
export default function SessionBrowser({
  players,
  sessions,
  initialSelected,
}: {
  players: Player[];
  sessions: PlaySession[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected)
  );

  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected]
  );

  const list = useMemo(
    () =>
      selectedPlayers.length === 0
        ? sessions
        : sessions.filter((s) => hasPlayers(s, selectedPlayers)),
    [sessions, selectedPlayers]
  );

  // 按月份分组，长列表读起来更像一本记录册
  const groups = useMemo(() => {
    const map = new Map<string, PlaySession[]>();
    for (const s of list) {
      const key = s.date?.slice(0, 7) || "";
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()];
  }, [list]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/leaderboard"
        className="r-on-felt inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 dark:text-gray-500 hover:text-accent-700 dark:hover:text-accent-300 transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        玩家排行榜
      </Link>

      <div className="mb-8">
        <h1 className="r-on-felt font-serif text-[24px] font-semibold text-ink dark:text-gray-100 mb-1">
          对局记录
        </h1>
        <p className="r-on-felt-sub text-sm text-gray-500 dark:text-gray-400">
          {players.length} 位玩家 · {sessions.length} 场对局
          {selected.size > 0 && list.length > 0 && ` · 当前范围 ${list.length} 场`}
        </p>
      </div>

      {/* 玩家筛选 */}
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <PlayerFilter
            players={players}
            selected={selected}
            onToggle={toggle}
            onClear={() => setSelected(new Set())}
          />
          {selected.size > 0 && list.length > 0 && (
            <span className="r-on-felt-sub text-[11.5px] text-ink-3 dark:text-gray-500 ml-1 tnum">
              共同对局 {list.length} 场
            </span>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-14 text-center">
          <p className="text-[13px] text-ink-2 dark:text-gray-300 mb-1.5">
            {selected.size === 0
              ? "还没有对局记录"
              : `这 ${selected.size} 位玩家没有同时在场的对局`}
          </p>
          <p className="text-[11.5px] text-ink-3 dark:text-gray-500">
            {selected.size === 0
              ? "在任意桌游详情页点「记录对局」就能开始"
              : "只有其中一位在场的记录不会出现在这里，换一组玩家或点「全部」"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([month, items]) => (
            <section key={month || "undated"}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="tnum text-[11px] tracking-wider text-ink-3 dark:text-gray-500">
                  {formatMonth(month)}
                </h2>
                <span aria-hidden="true" className="flex-1 h-px bg-line dark:bg-gray-700" />
                <span className="tnum text-[10.5px] text-ink-3 dark:text-gray-500">
                  {items.length} 场
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((s) => (
                  <SessionRecord key={s.id} session={s} showGame />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** "2026-11" → "2026 年 11 月"；空串表示这条没记日期 */
function formatMonth(key: string): string {
  if (!key) return "未记录日期";
  const [y, m] = key.split("-");
  return `${y} 年 ${Number(m)} 月`;
}
