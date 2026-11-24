"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { pinyin } from "pinyin-pro";
import GameGrid from "@/components/game-grid";
import FilterBar from "@/components/filter-bar";
import SearchBar from "@/components/search-bar";
import StatsPanel from "@/components/stats-panel";
import RandomPicker from "@/components/random-picker";
import type { BoardGame, GameStatus, SortOption, WeightFilter } from "@/types/game";
import type { PlaySession } from "@/types/session";
import { matchesPlayerCount, matchesBestPlayerCount } from "@/lib/player-count";
import { matchesWeight } from "@/lib/weight-filter";

interface Props {
  initialGames: BoardGame[];
  initialTags: string[];
  allSessions: PlaySession[];
  sessionCountByGame: Record<string, number>;
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
  const [bestPlayerCount, setBestPlayerCount] = useState<number | "全部">("全部");
  const [weightFilter, setWeightFilter] = useState<WeightFilter>("全部");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
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
    if (bestPlayerCount !== "全部") {
      result = result.filter((g) => matchesBestPlayerCount(g, bestPlayerCount));
    }
    if (weightFilter !== "全部") {
      result = result.filter((g) => matchesWeight(g, weightFilter));
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
  }, [games, status, tag, playerCount, bestPlayerCount, weightFilter, sortBy, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* 标题区 + 搜索框 + 统计开关 */}
        <div className="mb-5 animate-fade-in">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="tnum text-2xl font-medium text-ink dark:text-gray-100 leading-none">
                {filteredGames.length}
              </span>
              <span className="text-[12.5px] text-ink-3 dark:text-gray-500">
                {isSearching ? `个结果 · 搜索「${searchQuery}」` : "款桌游"}
                {!isSearching && status !== "全部" && ` · ${status}`}
                {!isSearching && tag && ` · #${tag}`}
                {!isSearching && playerCount !== "全部" && ` · ${playerCount}人`}
                {!isSearching && bestPlayerCount !== "全部" && ` · 最佳${bestPlayerCount}人`}
                {!isSearching && weightFilter !== "全部" && ` · ${weightFilter}度策略`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`r-btn px-3.5 py-1.5 rounded-md text-[12.5px] whitespace-nowrap min-w-[84px] transition-colors ${
                  showStats
                    ? "bg-accent-600 text-white border-accent-600"
                    : "bg-white dark:bg-gray-800 text-ink-2 dark:text-gray-400 border-line-strong dark:border-gray-600 hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-300"
                }`}
              >
                {showStats ? "收起统计" : "查看统计"}
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
        <div className="mb-5">
          <RandomPicker games={filteredGames} />
        </div>

        {/* 筛选栏 */}
        <div className="mb-8">
          <FilterBar
            status={status}
            tag={tag}
            playerCount={playerCount}
            bestPlayerCount={bestPlayerCount}
            weightFilter={weightFilter}
            sortBy={sortBy}
            allTags={tags}
            onStatusChange={setStatus}
            onTagChange={setTag}
            onPlayerCountChange={setPlayerCount}
            onBestPlayerCountChange={setBestPlayerCount}
            onWeightChange={setWeightFilter}
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
            <p className="r-empty text-ink-3 dark:text-gray-500 text-[13px]">
              {isSearching
                ? `没有找到包含「${searchQuery}」的桌游`
                : "没有匹配的桌游，试试换一个筛选条件"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
