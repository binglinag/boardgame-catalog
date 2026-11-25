"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PlayerForm from "./player-form";
import PlayerFilter from "./player-filter";
import type { Player } from "@/types/player";
import type { PlaySession } from "@/types/session";
import {
  buildRankings,
  hasPlayers,
  participantKeys,
  type PlayerRank,
} from "@/lib/leaderboard-stats";

interface Props {
  players: Player[];
  sessions: PlaySession[];
  weightByGameId: Record<string, number>;
  weightByTitle: Record<string, number>;
  totalGames: number;
  totalSessions: number;
}

export default function PlayerLeaderboard({
  players,
  sessions,
  weightByGameId,
  weightByTitle,
  totalGames,
  totalSessions,
}: Props) {
  // 空集合 = 不筛选（统计全部对局）
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 选中的玩家对象（过滤时要用 id 和姓名双向匹配，不能只比 ID）
  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected],
  );

  /**
   * 统计范围：选中多人时只保留「这几个人同时在场」的对局，
   * 只有其中一位在场的对局不计入，避免把「我没参与的局」算到我头上。
   */
  const scopedSessions = useMemo(
    () =>
      selectedPlayers.length === 0
        ? sessions
        : sessions.filter((s) => hasPlayers(s, selectedPlayers)),
    [sessions, selectedPlayers],
  );

  const rankings: PlayerRank[] = useMemo(
    () =>
      buildRankings({ sessions: scopedSessions, players, weightByGameId, weightByTitle }),
    [scopedSessions, players, weightByGameId, weightByTitle],
  );

  const rankOf = useMemo(
    () => new Map(rankings.map((r, i) => [r.player.id, i + 1])),
    [rankings],
  );

  // 选中时只列出选中的人；名次取当前统计范围内的名次
  const visible = useMemo(
    () => (selected.size === 0 ? rankings : rankings.filter((r) => selected.has(r.player.id))),
    [rankings, selected],
  );

  // 共同对局里出现过的人数（用来解释「排名 3」为什么不是第三个人）
  const participantCount = useMemo(
    () => participantKeys(scopedSessions).size,
    [scopedSessions],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  if (players.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 dark:text-gray-500 hover:text-accent-700 dark:hover:text-accent-300 transition-colors mb-6 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="r-on-felt font-serif text-[24px] font-semibold text-ink dark:text-gray-100 mb-1">玩家排行榜</h1>
            <p className="r-on-felt-sub text-sm text-gray-500 dark:text-gray-400">暂无玩家数据</p>
          </div>
          <PlayerForm />
        </div>
        <div className="text-center py-20">
          <p className="text-[12.5px] text-ink-3 dark:text-gray-500">添加第一位玩家后，排行榜会在这里显示</p>
        </div>
      </div>
    );
  }

  const noSharedSessions = selected.size > 0 && scopedSessions.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="r-on-felt inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 dark:text-gray-500 hover:text-accent-700 dark:hover:text-accent-300 transition-colors mb-6 group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="r-on-felt font-serif text-[24px] font-semibold text-ink dark:text-gray-100 mb-1">
            玩家排行榜
          </h1>
          <p className="r-on-felt-sub text-sm text-gray-500 dark:text-gray-400">
            {players.length} 位玩家 · {totalGames} 款桌游 · {totalSessions} 场对局
          </p>
        </div>
        <PlayerForm />
      </div>

      {/* 算法说明 */}
      <div className="r-panel mb-7 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-line dark:border-gray-700 text-[11.5px] text-ink-2 dark:text-gray-400 leading-relaxed space-y-1">
        <div>
          <span className="font-medium text-accent-700 dark:text-accent-300">桌游度</span>
          {" = "}
          <span className="text-ink dark:text-gray-200">竞技分</span>
          {" + "}
          <span className="text-ink dark:text-gray-200">战役分</span>
        </div>
        <div className="pl-3 border-l border-line dark:border-gray-700">
          竞技分 = Σ(重度 × 变现系数) + 竞技款数 × 2
        </div>
        <div className="pl-3 border-l border-line dark:border-gray-700">
          战役分 = Σ(重度 × 完成标记系数) + 战役款数 × 3
        </div>
        <div className="text-ink-3 dark:text-gray-500 pt-1">
          变现系数基于对局表现（排名/分数/胜负），战役系数基于完成标记（可选）。
          勾选多位玩家时，只统计这几个人同时在场的对局。
        </div>
      </div>

      {/* 玩家筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <PlayerFilter
            players={players}
            selected={selected}
            onToggle={toggle}
            onClear={clearSelection}
          />
          {selected.size > 0 && !noSharedSessions && (
            <span className="r-on-felt-sub text-[11.5px] text-ink-3 dark:text-gray-500 ml-1 tnum">
              共同对局 {scopedSessions.length} 场 · {participantCount} 人参与
            </span>
          )}
        </div>
      </div>

      {noSharedSessions ? (
        <div className="r-panel rounded-lg border border-line dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-14 text-center">
          <p className="text-[13px] text-ink-2 dark:text-gray-300 mb-1.5">
            这 {selected.size} 位玩家没有同时在场的对局
          </p>
          <p className="text-[11.5px] text-ink-3 dark:text-gray-500">
            只有其中一位在场的记录不会计入，换一组玩家或点「全部」看完整榜单
          </p>
        </div>
      ) : (
        /* 排行榜表格 */
        /* overflow-hidden 会在窄屏把超出容器宽度的列直接裁掉，改用 overflow-x-auto 保证信息不丢 */
        <div className="r-table overflow-x-auto rounded-lg border border-line dark:border-gray-700">
          <table className="w-full min-w-[320px] text-[12.5px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-line dark:border-gray-700">
                <th className="px-2 sm:px-4 py-2.5 text-left text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-14">排名</th>
                <th className="px-2 sm:px-4 py-2.5 text-left text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500">玩家</th>
                <th className="px-2 sm:px-4 py-2.5 text-right text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-20">桌游度</th>
                <th className="px-2 sm:px-4 py-2.5 text-right text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-28 hidden md:table-cell">竞技 · 战役</th>
                <th className="px-2 sm:px-4 py-2.5 text-right text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-16 hidden sm:table-cell">款数</th>
                <th className="px-2 sm:px-4 py-2.5 text-right text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-16 hidden sm:table-cell">场次</th>
                <th className="px-2 sm:px-4 py-2.5 text-right text-[10.5px] font-medium tracking-wide whitespace-nowrap text-ink-3 dark:text-gray-500 w-20 hidden lg:table-cell">均重度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-gray-700/60">
              {visible.map((entry) => {
                // 名次取当前统计范围内的名次，和分数同源，不会出现「分数变了名次没变」
                const rank = rankOf.get(entry.player.id) ?? 0;
                const isTop3 = rank > 0 && rank <= 3;
                const gamesCount = entry.compGames + entry.campGames;

                return (
                  <tr
                    key={entry.player.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-2 sm:px-4 py-3">
                      {/* 前三名不贴奖牌 emoji，用砖红数字，视觉更克制也更好对齐 */}
                      <span
                        className={`tnum ${
                          isTop3
                            ? "text-accent-700 dark:text-accent-300 font-medium"
                            : "text-ink-3 dark:text-gray-500"
                        }`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className="font-medium text-ink dark:text-gray-100">
                        {entry.player.name}
                      </span>
                      {entry.player.notes && (
                        <span className="ml-2 text-[11px] text-ink-3 dark:text-gray-500">{entry.player.notes}</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right">
                      <span
                        className={`tnum ${
                          isTop3
                            ? "text-accent-700 dark:text-accent-300 font-medium text-[15px]"
                            : "text-ink-2 dark:text-gray-300"
                        }`}
                      >
                        {entry.bgScore}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1 text-[11.5px] tnum">
                        <span className="text-ink-2 dark:text-gray-300">{entry.compScore}</span>
                        <span aria-hidden="true" className="text-line-strong dark:text-gray-700">·</span>
                        <span className="text-ink-2 dark:text-gray-300">{entry.campScore}</span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-ink-3 dark:text-gray-500 hidden sm:table-cell tnum">
                      <span title={`竞技 ${entry.compGames} · 战役 ${entry.campGames}`}>
                        {gamesCount}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-ink-3 dark:text-gray-500 hidden sm:table-cell tnum">
                      {entry.totalSessions}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-ink-3 dark:text-gray-500 hidden lg:table-cell tnum">
                      {entry.avgWeight > 0 ? entry.avgWeight : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 底部：跳转到对局记录。选中玩家时带着 id 过去，那边自动接着筛选 */}
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11.5px] text-ink-3 dark:text-gray-500">
          {selected.size > 0
            ? `当前统计范围 ${scopedSessions.length} 场对局`
            : `共 ${totalSessions} 场对局`}
        </p>
        <Link
          href={
            selected.size > 0
              ? `/sessions?players=${[...selected].join(",")}`
              : "/sessions"
          }
          className="r-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-line-strong dark:border-gray-600
            text-[12.5px] text-ink-2 dark:text-gray-400
            hover:border-accent-500 hover:text-accent-700
            dark:hover:border-accent-600 dark:hover:text-accent-300
            transition-colors"
        >
          {selected.size > 0 ? "浏览这批对局" : "浏览所有对局"}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
