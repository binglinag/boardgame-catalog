import type { PlaySession, PlayerScore } from "@/types/session";
import { TEMPLATE_META } from "@/lib/template-meta";

function formatDate(dateStr: string): string {
  if (!dateStr) return "未记录日期";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 一条对局记录，按模板切换渲染方式 */
export default function SessionRecord({ session }: { session: PlaySession }) {
  const meta = TEMPLATE_META[session.template] ?? TEMPLATE_META.标准计分;

  return (
    <div
      className="rounded-lg bg-white dark:bg-gray-800
        border border-line dark:border-gray-700 px-3.5 py-3
        hover:border-line-strong dark:hover:border-gray-600
        transition-colors"
    >
      <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12.5px] font-medium text-ink dark:text-gray-100 tnum">
            {formatDate(session.date)}
          </span>
          {session.notes && (
            <span className="text-[11px] text-ink-3 dark:text-gray-500 truncate">
              {session.notes}
            </span>
          )}
        </div>
        <span
          className={`px-1.5 py-0.5 rounded border text-[10.5px] tracking-wide flex-shrink-0 ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      {renderBody(session)}
    </div>
  );
}

function renderBody(session: PlaySession) {
  switch (session.template) {
    case "胜负记录":
      return <WinLossBody players={session.players} />;
    case "排名顺序":
      return <RankBody players={session.players} />;
    case "单一赢家":
      return <WinnerBody players={session.players} />;
    case "合作胜负":
      return <CoopBody players={session.players} />;
    case "战役叙事":
      return <CampaignBody session={session} />;
    default:
      return <ScoreBody players={session.players} />;
  }
}

/** 标准计分：按分数降序，发奖牌 */
function ScoreBody({ players }: { players: PlayerScore[] }) {
  if (players.length === 0) return <Empty />;

  const list = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-1.5">
      {list.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-2">
          <span
            className={`tnum w-6 text-center text-[11.5px] ${
              i < 3
                ? "text-accent-700 dark:text-accent-300 font-medium"
                : "text-ink-3 dark:text-gray-500"
            }`}
          >
            {i + 1}
          </span>
          <span className="text-[12.5px] text-ink-2 dark:text-gray-300">
            {p.name || "未命名"}
          </span>
          <span className="ml-auto text-[12.5px] tnum text-ink dark:text-gray-100">
            {p.score}
          </span>
        </div>
      ))}
    </div>
  );
}

const RESULT_ORDER: Record<string, number> = { 胜: 0, 平: 1, 负: 2 };

/** 胜负记录：按 胜>平>负 排序，显示徽章而非分数 */
function WinLossBody({ players }: { players: PlayerScore[] }) {
  if (players.length === 0) return <Empty />;

  const list = [...players].sort(
    (a, b) => (RESULT_ORDER[a.result ?? ""] ?? 9) - (RESULT_ORDER[b.result ?? ""] ?? 9),
  );

  return (
    <div className="space-y-2">
      {list.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-2">
          <span className="w-6" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {p.name || "未命名"}
          </span>
          <span className="ml-auto">
            <ResultBadge result={p.result} />
          </span>
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ result }: { result: PlayerScore["result"] }) {
  // 胜 / 平 / 负 靠边框与字重区分，不用三种色块
  const map: Record<string, string> = {
    胜: "border-accent-300 text-accent-700 dark:border-accent-800 dark:text-accent-300 font-medium",
    平: "border-line-strong text-ink-2 dark:border-gray-600 dark:text-gray-400",
    负: "border-gray-300 text-ink-3 dark:border-gray-700 dark:text-gray-500",
  };
  const label = result ?? "未记录";
  const cls = map[label] ?? "border-line text-ink-3 dark:border-gray-700 dark:text-gray-500";

  return (
    <span className={`px-1.5 py-0.5 rounded border text-[10.5px] tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

/** 排名顺序：按名次升序，并列显示同一名次（如实反映，不改数据） */
function RankBody({ players }: { players: PlayerScore[] }) {
  if (players.length === 0) return <Empty />;

  const list = [...players].sort(
    (a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className="space-y-1.5">
      {list.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-2">
          <span className="tnum w-7 text-[11.5px] text-ink-3 dark:text-gray-500">
            {p.rank != null ? `#${p.rank}` : "—"}
          </span>
          <span className="text-[12.5px] text-ink-2 dark:text-gray-300">
            {p.name || "未命名"}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 单一赢家：赢家置顶，其余标「参与」 */
function WinnerBody({ players }: { players: PlayerScore[] }) {
  if (players.length === 0) return <Empty />;

  const winners = players.filter((p) => p.result === "胜");
  const others = players.filter((p) => p.result !== "胜");

  return (
    <div className="space-y-1.5">
      {winners.map((p, i) => (
        <div key={`w-${p.name}-${i}`} className="flex items-center gap-2">
          <span className="w-7 text-[10.5px] tracking-wide text-accent-700 dark:text-accent-300">胜</span>
          <span className="text-[12.5px] font-medium text-ink dark:text-gray-100">
            {p.name || "未命名"}
          </span>
          <span className="ml-auto text-[10.5px] text-accent-700 dark:text-accent-300">获胜</span>
        </div>
      ))}
      {others.map((p, i) => (
        <div key={`o-${p.name}-${i}`} className="flex items-center gap-2">
          <span className="w-7" />
          <span className="text-[12.5px] text-ink-3 dark:text-gray-400">
            {p.name || "未命名"}
          </span>
          <span className="ml-auto text-[10.5px] text-ink-3 dark:text-gray-600">参与</span>
        </div>
      ))}
    </div>
  );
}

/** 合作胜负：全队一个结果，成员平铺 */
function CoopBody({ players }: { players: PlayerScore[] }) {
  if (players.length === 0) return <Empty />;

  const verdict =
    players.find((p) => p.result === "合作胜" || p.result === "合作败")?.result ??
    "合作胜";
  const won = verdict === "合作胜";

  return (
    <div className="space-y-2">
      <div
        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10.5px] tracking-wide ${
          won
            ? "border-accent-300 text-accent-700 dark:border-accent-800 dark:text-accent-300"
            : "border-gray-300 text-ink-3 dark:border-gray-700 dark:text-gray-500"
        }`}
      >
        {won ? "合作成功" : "合作失败"}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-2 dark:text-gray-400">
        {players.map((p, i) => (
          <span key={`${p.name}-${i}`}>{p.name || "未命名"}</span>
        ))}
      </div>
    </div>
  );
}

const COMPLETION_META: Record<string, { label: string; cls: string }> = {
  完整通关: {
    label: "完整通关",
    cls: "border-accent-300 text-accent-700 dark:border-accent-800 dark:text-accent-300",
  },
  中途放弃: {
    label: "中途放弃",
    cls: "border-gray-300 text-ink-3 dark:border-gray-700 dark:text-gray-500",
  },
};

/** 战役叙事：章节 + 完成标记 + 叙事（折叠）+ 参与者 */
function CampaignBody({ session }: { session: PlaySession }) {
  const completion = session.completion
    ? COMPLETION_META[session.completion]
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {session.scenario && (
          <span className="font-serif text-[13px] text-ink dark:text-gray-200">
            {session.scenario}
          </span>
        )}
        {completion ? (
          <span className={`px-1.5 py-0.5 rounded border text-[10.5px] tracking-wide ${completion.cls}`}>
            {completion.label}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded border border-line text-[10.5px] tracking-wide text-ink-3 dark:border-gray-700 dark:text-gray-500">
            未标记完成
          </span>
        )}
      </div>

      {session.narrative && (
        <details className="group">
          <summary className="cursor-pointer text-[11.5px] text-accent-700 dark:text-accent-300 hover:underline list-none">
            <span className="group-open:hidden">展开叙事记录 ▾</span>
            <span className="hidden group-open:inline">收起叙事记录 ▴</span>
          </summary>
          <div className="mt-1.5 text-[12px] text-ink-2 dark:text-gray-400 leading-relaxed whitespace-pre-wrap border-l border-line-strong dark:border-gray-600 pl-3 max-h-72 overflow-y-auto">
            {session.narrative}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3 dark:text-gray-500">
        <span className="text-ink-3 dark:text-gray-600">参与：</span>
        {session.players.map((p, i) => (
          <span key={`${p.name}-${i}`}>{p.name || "未命名"}</span>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-[11.5px] text-ink-3 dark:text-gray-500">没有玩家记录</p>;
}
