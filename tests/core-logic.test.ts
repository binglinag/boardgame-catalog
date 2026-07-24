import * as assert from "node:assert/strict";
import { extractBggId } from "@/lib/bgg";
import { getPerformanceCoefficient } from "@/lib/leaderboard-scoring";
import { matchesPlayerCount, parsePlayerRange } from "@/lib/player-count";
import { parseSessionData, serializeSessionData } from "@/lib/session-data";

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

export const tests: TestCase[] = [
  {
    name: "parsePlayerRange handles single values, ranges, and labels",
    run() {
      assert.deepEqual(parsePlayerRange("2-5"), [2, 5]);
      assert.deepEqual(parsePlayerRange("3人"), [3, 3]);
      assert.deepEqual(parsePlayerRange("1-6人"), [1, 6]);
      assert.equal(parsePlayerRange(""), null);
      assert.equal(parsePlayerRange("不限"), null);
    },
  },
  {
    name: "matchesPlayerCount accepts supported or best player counts",
    run() {
      const game = { players: "2-5", bestPlayers: "3-4" };
      assert.equal(matchesPlayerCount(game, 2), true);
      assert.equal(matchesPlayerCount(game, 4), true);
      assert.equal(matchesPlayerCount(game, 6), false);
      assert.equal(matchesPlayerCount({ players: "", bestPlayers: "6" }, 6), true);
    },
  },
  {
    name: "parseSessionData supports legacy array session payloads",
    run() {
      const parsed = parseSessionData(
        JSON.stringify([
          { name: "Alice", score: "12" },
          { name: "Bob", score: 9, rank: "2" },
        ])
      );

      assert.deepEqual(parsed.players, [
        { name: "Alice", score: 12, result: null, rank: null },
        { name: "Bob", score: 9, result: null, rank: 2 },
      ]);
    },
  },
  {
    name: "parseSessionData supports scenario metadata and invalid payload fallback",
    run() {
      const raw = serializeSessionData({
        players: [{ name: "Alice", score: 0, result: "合作胜", rank: null }],
        scenario: "第一章",
        narrative: "险胜",
        completion: "完整通关",
      });

      assert.deepEqual(parseSessionData(raw), {
        players: [{ name: "Alice", score: 0, result: "合作胜", rank: null }],
        scenario: "第一章",
        narrative: "险胜",
        completion: "完整通关",
      });
      assert.deepEqual(parseSessionData("{bad json"), { players: [] });
    },
  },
  {
    name: "getPerformanceCoefficient handles score, win-loss, ranking ties, and campaign completion",
    run() {
      assert.equal(
        getPerformanceCoefficient(
          "标准计分",
          { name: "Alice", score: 50 },
          [
            { name: "Alice", score: 50 },
            { name: "Bob", score: 100 },
          ]
        ),
        0.5
      );
      assert.equal(getPerformanceCoefficient("胜负记录", { name: "Alice", score: 0, result: "平" }, []), 0.7);
      assert.ok(
        Math.abs(getPerformanceCoefficient(
          "排名顺序",
          { name: "Alice", score: 0, rank: 1 },
          [
            { name: "Alice", score: 0, rank: 1 },
            { name: "Bob", score: 0, rank: 1 },
            { name: "Cara", score: 0, rank: 3 },
          ]
        ) - 5 / 6) < 0.000001
      );
      assert.equal(getPerformanceCoefficient("战役叙事", { name: "Alice", score: 0 }, [], "中途放弃"), 0.5);
    },
  },
  {
    name: "extractBggId parses boardgame and expansion URLs",
    run() {
      assert.equal(extractBggId("https://boardgamegeek.com/boardgame/174430/gloomhaven"), 174430);
      assert.equal(extractBggId("https://boardgamegeek.com/boardgameexpansion/280789/root-the-underworld-expansion"), 280789);
      assert.equal(extractBggId("https://example.com/games/12345"), 12345);
      assert.equal(extractBggId("not-a-url"), null);
    },
  },
];
