/** 印刷风图标：米宝（重度）与骰子（最佳人数） */

const MEEPLE_PATH =
  "M12 2a3.5 3.5 0 0 1 3.5 3.5c0 1-.4 1.8-1 2.4 3.5.6 8.5 1.7 8.5 4.3 0 1.4-2.3 1.6-4.2 1.3l3 7.5c.2.6-.2 1-.8 1h-5.3L12 17.5 8.3 22H3c-.6 0-1-.4-.8-1l3-7.5C3.3 13.8 1 13.6 1 12.2c0-2.6 5-3.7 8.5-4.3-.6-.6-1-1.4-1-2.4A3.5 3.5 0 0 1 12 2z";

export function Meeple({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[15px] h-[15px] flex-shrink-0">
      <path fill={filled ? "#9C6B36" : "#E4DCCB"} d={MEEPLE_PATH} />
    </svg>
  );
}

/** 重度 1–5 米宝行 */
export function MeepleRow({ weight }: { weight: number }) {
  const filled = Math.round(weight);
  return (
    <span className="flex gap-[2px]" aria-label={`重度 ${weight}`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Meeple key={k} filled={k <= filled} />
      ))}
    </span>
  );
}

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** 单颗骰子，点数 = 人数 */
export function Die({ n }: { n: number }) {
  const pips = PIPS[Math.min(n, 6)] ?? [];
  return (
    <span className="die" aria-hidden="true">
      {Array.from({ length: 9 }, (_, k) => (
        <i key={k} className={pips.includes(k) ? "on" : ""} />
      ))}
    </span>
  );
}

/**
 * 最佳人数：单个数字且 ≤6 显示骰子，区间则退回文字
 * "3" → 🎲3　 "3-4" → 3–4 人
 */
export function BestPlayers({ best }: { best: string }) {
  const first = parseInt(best.split(/[-,~]/)[0], 10);
  const isRange = /[-,~]/.test(best);

  if (!isNaN(first) && first <= 6 && !isRange) {
    return (
      <span className="flex items-center gap-1">
        <Die n={first} />
        <span className="text-[11px]">{first} 人</span>
      </span>
    );
  }
  return <span className="text-[12px]">{best} 人</span>;
}
