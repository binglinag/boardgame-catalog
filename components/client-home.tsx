"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { pinyin } from "pinyin-pro";
import GameGrid from "@/components/game-grid";
import FilterBar from "@/components/filter-bar";
import SearchBar from "@/components/search-bar";
import StatsPanel from "@/components/stats-panel";
import RandomPicker from "@/components/random-picker";
import ParticleBackground from "@/components/particle-background";
import { syncBgg } from "@/app/actions/sync";
import type { BoardGame, GameStatus, SortOption } from "@/types/game";
import type { PlaySession } from "@/types/session";

interface Props {
  initialGames: BoardGame[];
  initialTags: string[];
  allSessions: PlaySession[];
  sessionCountByGame: Record<string, number>;
}

/** 解析人数范围，如 "2-5" → [2,5], "3" → [3,3], "1-6" → [1,6] */
function parsePlayerRange(str: string): [number, number] | null {
  if (!str) return null;
  const clean = str.replace(/[^0-9\-]/g, "");
  if (clean.includes("-")) {
    const [min, max] = clean.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) return [min, max];
  }
  const n = Number(clean);
  if (!isNaN(n)) return [n, n];
  return null;
}

/** 判断目标人数是否匹配游戏的人数范围（支持或最佳） */
function matchesPlayerCount(game: BoardGame, target: number): boolean {
  // 支持人数
  const playersRange = parsePlayerRange(game.players);
  if (playersRange && target >= playersRange[0] && target <= playersRange[1]) return true;
  // 最佳人数
  const bestRange = parsePlayerRange(game.bestPlayers);
  if (bestRange && target >= bestRange[0] && target <= bestRange[1]) return true;
  return false;
}

export default function ClientHome({
  initialGames,
  initialTags,
  allSessions,
  sessionCountByGame,
}: Props) {
  const [games] = useState<BoardGame[]>(initialGames);
  const [tags] = useState<string[]>(initialTags);
  const [status, setStatus] = useState<GameStatus | "全部">("全部");
  const [tag, setTag] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number | "全部">("全部");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSync = useCallback(async () => {
    const password = window.prompt("请输入管理员密码以同步 BGG 数据");
    if (password === null) return;

    setSyncing(true);
    try {
      const result = await syncBgg(password);
      const lines: string[] = [];
      lines.push(`共 ${result.total} 款游戏`);
      lines.push(`已更新 ${result.updated} 款`);
      if (result.skipped > 0) lines.push(`跳过 ${result.skipped} 款（无链接或已完整）`);
      for (const d of result.details) {
        if (d.error) lines.push(`❌ ${d.title}: ${d.error}`);
        else if (d.changes.length > 0) lines.push(`✅ ${d.title}: ${d.changes.join("、")}`);
        else lines.push(`⏭ ${d.title}: 无需更新`);
      }
      if (result.errors.length > 0) lines.push(`\n错误: ${result.errors.length} 条`);
      if (result.updated > 0) lines.push("\n请刷新页面查看更新。");
      alert(lines.join("\n"));
    } catch {
      alert("同步失败，请重试");
    } finally {
      setSyncing(false);
    }
  }, []);

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((g) => {
        if (g.title.toLowerCase().includes(q)) return true;
        if (g.nameEn.toLowerCase().includes(q)) return true;
        const fullPinyin = pinyin(g.title, { toneType: "none", type: "array" }).join("");
        if (fullPinyin.includes(q)) return true;
        const firstLetters = pinyin(g.title, { pattern: "first", toneType: "none", type: "array" }).join("");
        if (firstLetters.includes(q)) return true;
        return false;
      });
    }

    if (status !== "全部") result = result.filter((g) => g.status.includes(status));
    if (tag) result = result.filter((g) => g.tags.includes(tag));
    if (playerCount !== "全部") {
      result = result.filter((g) => matchesPlayerCount(g, playerCount));
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
        case "weight": return (b.weight ?? 0) - (a.weight ?? 0);
        case "year": return (b.year ?? 0) - (a.year ?? 0);
        case "title": return a.title.localeCompare(b.title, "zh");
        case "playCount": {
          const aCount = sessionCountByGame[a.title] ?? 0;
          const bCount = sessionCountByGame[b.title] ?? 0;
          return bCount - aCount;
        }
        default: return 0;
      }
    });
    return result;
  }, [games, status, tag, playerCount, sortBy, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <ParticleBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题区 + 搜索框 + 随机按钮 */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <p className="text-violet-400 dark:text-violet-500 text-sm tracking-wide">
              {isSearching
                ? `搜索 "${searchQuery}" · ${filteredGames.length} 个结果`
                : `${filteredGames.length} 款桌游`}
              {!isSearching && status !== "全部" && ` · ${status}`}
              {!isSearching && tag && ` · #${tag}`}
              {!isSearching && playerCount !== "全部" && ` · ${playerCount}人`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-5 py-2 rounded-2xl text-sm font-medium whitespace-nowrap min-w-[90px] transition-all duration-300 ${
                  showStats
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : "bg-white/40 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 backdrop-blur-sm border border-white/40 dark:border-white/5"
                }`}
              >
                {showStats ? "收起统计" : "查看统计"}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-5 py-2 rounded-2xl text-sm font-medium whitespace-nowrap min-w-[90px] transition-all duration-300
                  bg-white/40 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400
                  hover:bg-violet-50 dark:hover:bg-violet-900/20
                  hover:text-violet-600 dark:hover:text-violet-400
                  backdrop-blur-sm border border-white/40 dark:border-white/5
                  disabled:opacity-50"
              >
                {syncing ? "同步中..." : "🔄 同步BGG"}
              </button>
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* 统计面板 */}
        {showStats && (
          <StatsPanel
            games={games}
            allSessions={allSessions}
            sessionCountByGame={sessionCountByGame}
          />
        )}

        {/* 随机选一款 */}
        <div className="mb-6">
          <RandomPicker games={filteredGames} />
        </div>

        {/* 筛选栏 */}
        <div className="mb-10">
          <FilterBar
            status={status}
            tag={tag}
            playerCount={playerCount}
            sortBy={sortBy}
            allTags={tags}
            onStatusChange={setStatus}
            onTagChange={setTag}
            onPlayerCountChange={setPlayerCount}
            onSortChange={setSortBy}
          />
        </div>

        {/* 桌游列表 */}
        {mounted ? (
          <GameGrid games={filteredGames} sessionCountByGame={sessionCountByGame} />
        ) : (
          <GameGrid games={games} sessionCountByGame={sessionCountByGame} />
        )}

        {mounted && filteredGames.length === 0 && games.length > 0 && (
          <div className="text-center py-20">
            <p className="text-violet-400 dark:text-violet-500 text-lg">
              {isSearching
                ? `没有找到包含 "${searchQuery}" 的桌游`
                : "没有匹配的桌游，试试换一个筛选条件"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
