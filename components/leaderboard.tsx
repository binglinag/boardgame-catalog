import type { PlaySession, PlayerScore, ScoringTemplate } from "@/types/session";
import {
  getDominantTemplate,
  describeTemplateMix,
  TEMPLATE_META,
} from "@/lib/template-meta";

/** 玩家聚合键：有 Notion ID 用 ID，老数据退回姓名 */
function playerKey(p: PlayerScore): string {
  return p.id ? `id:${p.id}` : `name:${p.name.trim()}`;
}

/**
 * 对局榜单：按该游戏的主导模板自动切换指标
 * 标准计分 → 最高分 | 胜负/赢家 → 胜率 | 排名 → 平均名次
 * 合作 → 团队胜率 | 战役 → 进度
 */
export default function Leaderboard({ sessions }: { sessions: PlaySession[] }) {
  if (sessions.length === 0) return null;

  const template = getDominantTemplate(sessions) ?? "标准计分";
  const meta = TEMPLATE_META[template];
  const mixNote = describeTemplateMix(sessions);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {meta.emoji} {boardTitle(template)}
        </h3>
        <span className="text-[11px] text-gray-400 dark:text-gray-600">{mixNote}</span>
      </div>

      {renderBoard(template, sessions)}
    </div>
  );
}

function boardTitle(t: ScoringTemplate): string {
  switch (t) {
    case "胜负记录":
    case "单一赢家":
      return "胜率排行";
    case "排名顺序":
      return "平均名次";
    case "合作胜负":
      return "团队战绩";
    case "战役叙事":
      return "战役进度";
    default:
      return "最高分排行";
  }
}

function renderBoard(template: ScoringTemplate, sessions: PlaySession[]) {
  switch (template) {
    case "胜负记录":
    case "单一赢家":
      return <WinRateBoard sessions={sessions} template={template} />;
    case "排名顺序":
      return <RankBoard sessions={sessions} />;
    case "合作胜负":
      return <CoopBoard sessions={sessions} />;
    case "战役叙事":
      return <CampaignBoard sessions={sessions} />;
    default:
      return <ScoreBoard sessions={sessions} />;
  }
}

/* ============================================================
   标准计分：最高分 / 场均 / 场次
   ============================================================ */

function ScoreBoard({ sessions }: { sessions: PlaySession[] }) {
  const scored = sessions.filter((s) => s.template === "标准计分");

  const map = new Map<
    string,
    { name: string; bestScore: number; bestDate: string; total: number; count: number }
  >();

  for (const s of scored) {
    for (const p of s.players) {
      const name = p.name.trim();
      if (!name) continue;
      const key = playerKey(p);
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          name,
          bestScore: p.score,
          bestDate: s.date,
          total: p.score,
          count: 1,
        });
      } else {
        cur.name = name;
        if (p.score > cur.bestScore) {
          cur.bestScore = p.score;
          cur.bestDate = s.date;
        }
        cur.total += p.score;
        cur.count++;
      }
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => b.bestScore - a.bestScore);

  if (rows.length === 0) {
    return <Hint text="没有标准计分的对局" />;
  }

  return (
    <Table
      head={["排名", "玩家", "最高分", "场均", "场次"]}
      rows={rows.map((r, i) => [
        <RankCell key="r" index={i} />,
        <span key="n" className="font-semibold text-gray-900 dark:text-white">
          {r.name}
        </span>,
        <b key="b" className="text-violet-600 dark:text-violet-400">
          {r.bestScore}
        </b>,
        Math.round(r.total / r.count),
        r.count,
      ])}
    />
  );
}

/* ============================================================
   胜负记录 / 单一赢家：胜率榜
   胜率 = (胜 + 平 × 0.5) / 总场次
   ============================================================ */

function WinRateBoard({
  sessions,
  template,
}: {
  sessions: PlaySession[];
  template: ScoringTemplate;
}) {
  const relevant = sessions.filter((s) => s.template === template);

  const map = new Map<
    string,
    { name: string; wins: number; draws: number; losses: number; total: number }
  >();

  for (const s of relevant) {
    for (const p of s.players) {
      const name = p.name.trim();
      if (!name) continue;
      const key = playerKey(p);
      const cur = map.get(key) ?? { name, wins: 0, draws: 0, losses: 0, total: 0 };

      cur.name = name;
      cur.total++;
      if (p.result === "胜") cur.wins++;
      else if (p.result === "平") cur.draws++;
      else cur.losses++;

      map.set(key, cur);
    }
  }

  const rows = Array.from(map.values())
    .map((r) => ({
      ...r,
      rate: r.total > 0 ? (r.wins + r.draws * 0.5) / r.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.wins - a.wins);

  if (rows.length === 0) {
    return <Hint text="没有可统计的对局" />;
  }

  return (
    <Table
      head={["排名", "玩家", "胜率", "战绩", "场次"]}
      rows={rows.map((r, i) => [
        <RankCell key="r" index={i} />,
        <span key="n" className="font-semibold text-gray-900 dark:text-white">
          {r.name}
        </span>,
        <b key="rate" className="text-emerald-600 dark:text-emerald-400">
          {(r.rate * 100).toFixed(1)}%
        </b>,
        <span key="w" className="text-xs whitespace-nowrap">
          <span className="text-emerald-600 dark:text-emerald-400">{r.wins}胜</span>
          {r.draws > 0 && (
            <span className="text-amber-600 dark:text-amber-400"> {r.draws}平</span>
          )}
          {r.losses > 0 && (
            <span className="text-red-500 dark:text-red-400"> {r.losses}负</span>
          )}
        </span>,
        r.total,
      ])}
    />
  );
}

/* ============================================================
   排名顺序：平均名次（越低越好）
   ============================================================ */

function RankBoard({ sessions }: { sessions: PlaySession[] }) {
  const relevant = sessions.filter((s) => s.template === "排名顺序");

  const map = new Map<
    string,
    { name: string; rankSum: number; count: number; bestRank: number }
  >();

  for (const s of relevant) {
    for (const p of s.players) {
      const name = p.name.trim();
      if (!name || p.rank == null) continue;
      const key = playerKey(p);
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { name, rankSum: p.rank, count: 1, bestRank: p.rank });
      } else {
        cur.name = name;
        cur.rankSum += p.rank;
        cur.count++;
        if (p.rank < cur.bestRank) cur.bestRank = p.rank;
      }
    }
  }

  const rows = Array.from(map.values())
    .map((r) => ({ ...r, avg: r.rankSum / r.count }))
    .sort((a, b) => a.avg - b.avg || b.count - a.count);

  if (rows.length === 0) {
    return <Hint text="没有可统计的名次" />;
  }

  return (
    <Table
      head={["排名", "玩家", "平均名次", "最好名次", "场次"]}
      rows={rows.map((r, i) => [
        <RankCell key="r" index={i} />,
        <span key="n" className="font-semibold text-gray-900 dark:text-white">
          {r.name}
        </span>,
        <b key="a" className="text-emerald-600 dark:text-emerald-400">
          {r.avg.toFixed(2)}
        </b>,
        `#${r.bestRank}`,
        r.count,
      ])}
    />
  );
}

/* ============================================================
   合作胜负：团队战绩卡片（没有个人排名）
   ============================================================ */

function CoopBoard({ sessions }: { sessions: PlaySession[] }) {
  const relevant = sessions.filter((s) => s.template === "合作胜负");

  let wins = 0;
  let losses = 0;
  const players = new Set<string>();

  for (const s of relevant) {
    const verdict =
      s.players.find((p) => p.result === "合作胜" || p.result === "合作败")?.result ??
      "合作胜";
    if (verdict === "合作胜") wins++;
    else losses++;

    for (const p of s.players) {
      if (p.name.trim()) players.add(p.name.trim());
    }
  }

  const total = wins + losses;
  const rate = total > 0 ? (wins / total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat label="总场次" value={`${total}`} />
      <Stat label="合作成功" value={`${wins}`} tone="emerald" />
      <Stat label="合作失败" value={`${losses}`} tone="red" />
      <Stat label="成功率" value={`${rate.toFixed(0)}%`} tone="violet" />
      <div className="col-span-2 sm:col-span-4 text-xs text-gray-400 dark:text-gray-500">
        参与玩家：{Array.from(players).join(" · ") || "—"}
      </div>
    </div>
  );
}

/* ============================================================
   战役叙事：进度榜
   ============================================================ */

function CampaignBoard({ sessions }: { sessions: PlaySession[] }) {
  const relevant = sessions.filter((s) => s.template === "战役叙事");

  const map = new Map<
    string,
    { name: string; chapters: number; completed: number; abandoned: number }
  >();

  for (const s of relevant) {
    for (const p of s.players) {
      const name = p.name.trim();
      if (!name) continue;
      const key = playerKey(p);
      const cur = map.get(key) ?? { name, chapters: 0, completed: 0, abandoned: 0 };
      cur.name = name;
      cur.chapters++;
      if (s.completion === "完整通关") cur.completed++;
      else if (s.completion === "中途放弃") cur.abandoned++;
      map.set(key, cur);
    }
  }

  const rows = Array.from(map.values()).sort(
    (a, b) => b.completed - a.completed || b.chapters - a.chapters,
  );

  if (rows.length === 0) {
    return <Hint text="没有战役记录" />;
  }

  return (
    <Table
      head={["排名", "玩家", "参与章节", "完整通关", "中途放弃"]}
      rows={rows.map((r, i) => [
        <RankCell key="r" index={i} />,
        <span key="n" className="font-semibold text-gray-900 dark:text-white">
          {r.name}
        </span>,
        r.chapters,
        <b key="c" className="text-emerald-600 dark:text-emerald-400">
          {r.completed}
        </b>,
        <span key="a" className="text-amber-600 dark:text-amber-400">
          {r.abandoned}
        </span>,
      ])}
    />
  );
}

/* ============================================================
   通用小部件
   ============================================================ */

function RankCell({ index }: { index: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <span className="inline-block w-6 text-center text-sm">
      {medals[index] ?? (
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {index + 1}
        </span>
      )}
    </span>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                  i === 0 ? "text-left w-14" : i === 1 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
          {rows.map((cells, ri) => (
            <tr
              key={ri}
              className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                ri < 3 ? "bg-amber-50/30 dark:bg-amber-900/5" : ""
              }`}
            >
              {cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 ${
                    ci === 0
                      ? "text-left"
                      : ci === 1
                        ? "text-left"
                        : "text-right text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "violet" | "emerald" | "red";
}) {
  const map = {
    violet: "text-violet-600 dark:text-violet-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-500 dark:text-red-400",
  };
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30 p-3">
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone ? map[tone] : "text-gray-800 dark:text-gray-100"}`}>
        {value}
      </p>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">{text}</p>
  );
}
