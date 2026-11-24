import Link from "next/link";
import Image from "next/image";
import type { BoardGame, GameStatus } from "@/types/game";
import type { PlaySession } from "@/types/session";
import type { Player } from "@/types/player";
import SessionForm from "./session-form";
import Leaderboard from "./leaderboard";
import SessionRecord from "./session-record";
import PriceToggle from "./price-toggle";
import { bggIdOf, formatDay, formatNumber } from "@/lib/catalog-format";

interface Props {
  game: BoardGame;
  sessions: PlaySession[];
  allPlayers: Player[];
}

export default function GameDetail({ game, sessions, allPlayers }: Props) {
  // 对局按日期倒序返回，第一条就是最近一次
  const lastPlayed = formatDay(sessions[0]?.date);
  const bggId = bggIdOf(game.bggUrl);
  const addedOn = formatDay(game.createdTime);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="r-on-felt inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 dark:text-gray-500
          hover:text-accent-700 dark:hover:text-accent-300 transition-colors mb-6 group"
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[22px_320px_1fr] gap-8 md:gap-x-10 lg:gap-x-8">
        {/* 书脊编号：只有 lg 以上横向空间够，竖排一行 No.037 */}
        <div className="hidden lg:flex flex-col items-center gap-3.5">
          {game.number !== null && (
            <>
              <span
                aria-hidden="true"
                className="spine-no r-on-felt tnum text-[10.5px] text-ink-3 dark:text-gray-500"
              >
                No. {formatNumber(game.number)} — Catalogue
              </span>
              <span aria-hidden="true" className="spine-rule" />
            </>
          )}
        </div>

        {/* 左侧：封面图
            self-start 必须留着：默认 grid 会把这一列拉伸到整行高度，
            藏书印是相对它 bottom 定位的，一拉伸就跑到封面下面的空白里 */}
        <div className="animate-scale-in relative self-start">
          {game.coverUrl ? (
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={game.coverUrl}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="r-cover rounded-lg shadow-card border border-line dark:border-gray-700 object-cover"
                priority
              />
            </div>
          ) : (
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/10 flex items-center justify-center">
              <span className="text-8xl font-bold text-primary-300 dark:text-primary-700">
                {game.title.charAt(0)}
              </span>
            </div>
          )}

          {/* 藏书印：编号存在才盖，压在封面右下角 */}
          {game.number !== null && (
            <span className="book-seal right-2 bottom-2 sm:-right-3.5 sm:-bottom-3.5" aria-hidden="true">
              <i>壮</i>
              <i>壮</i>
              <i>藏</i>
              <i>书</i>
            </span>
          )}
        </div>

        {/* 右侧：信息 */}
        <div className="animate-slide-up">
          {/* 标题区 */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0 r-plate relative">
              {/* 书脊竖线：默认主题的图鉴细节，复古主题下由 retro.css 关掉 */}
              <span aria-hidden="true" className="title-spine" />
              <h1 className="font-serif text-[26px] font-semibold text-ink dark:text-gray-100 mb-1 leading-tight">
                {game.title}
              </h1>
              {game.nameEn && (
                <p className="text-[12.5px] text-ink-3 dark:text-gray-500 italic">
                  {game.nameEn}
                </p>
              )}
            </div>

            {/* 编辑入口 */}
            <Link
              href={`/${game.id}/edit`}
              className="r-btn flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                border border-line-strong dark:border-gray-600
                text-[12.5px] text-ink-2 dark:text-gray-400
                hover:border-accent-500 hover:text-accent-700
                dark:hover:border-accent-600 dark:hover:text-accent-300
                transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              编辑
            </Link>
          </div>

          {/* 状态 + 重度 + 评分
              窄屏下 gap 收小，分隔点隐藏，避免「4.4 /5 重度 ·」占满一行后把评分挤到下一行 */}
          <div className="flex items-center gap-x-4 gap-y-2 sm:gap-x-6 mb-8 flex-wrap">
            {game.status.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.status.map((s) => (
                  <StatusBadge key={s} status={s} />
                ))}
              </div>
            )}
            {game.weight !== null && (
              <div className="flex items-baseline gap-1">
                <span className="r-hero-num text-[22px] font-medium text-ink dark:text-gray-100 leading-none">
                  {game.weight}
                </span>
                <span className="r-on-felt-sub text-[11.5px] text-ink-3 dark:text-gray-500">/ 5 重度</span>
              </div>
            )}
            <span aria-hidden="true" className="hidden sm:inline text-line-strong dark:text-gray-700 text-[13px]">·</span>
            {game.rating !== null && (
              <div className="flex items-baseline gap-1">
                <span className="r-hero-num text-[22px] font-medium text-accent-700 dark:text-accent-300 leading-none">
                  {game.rating}
                </span>
                <span className="r-on-felt-sub text-[11.5px] text-ink-3 dark:text-gray-500">/ 10 评分</span>
              </div>
            )}
          </div>

          {/* 信息带：一行格子，不再拆成六张独立小卡 */}
          <div className="r-card flex flex-wrap mb-7 border border-line dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden [&>*:last-child]:border-r-0">
            {game.players && <InfoCell label="人数" value={game.players} />}
            {game.bestPlayers && <InfoCell label="最佳" value={game.bestPlayers} />}
            {game.playTime && <InfoCell label="时长" value={game.playTime} />}
            {game.year && <InfoCell label="出版" value={String(game.year)} />}
            {game.designer && <InfoCell label="设计师" value={game.designer} wide />}
            {sessions.length > 0 && (
              <InfoCell label="玩过" value={`${sessions.length} 次`} />
            )}
            {game.price !== null && <PriceItem price={game.price} notes={game.priceNotes} />}
          </div>

          {/* 标签 */}
          {game.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="r-tag-felt px-2 py-0.5 rounded border border-line-strong dark:border-gray-600
                    text-[12px] text-ink-2 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 个人评价 */}
          {game.review && (
            <div className="mb-6">
              <h2 className="r-on-felt font-serif text-[13px] font-medium tracking-wide text-ink-2 dark:text-gray-400 mb-2">
                个人评价
              </h2>
              <blockquote className="drop-cap r-on-felt border-l-2 border-line-strong dark:border-gray-600 pl-3.5 text-[13.5px] text-ink-2 dark:text-gray-300 leading-relaxed">
                {game.review}
              </blockquote>
            </div>
          )}

          {/* BGG 链接 */}
          {game.bggUrl && (
            <a
              href={game.bggUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="r-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                border border-line-strong dark:border-gray-600
                text-[12.5px] text-ink-2 dark:text-gray-400
                hover:border-accent-500 hover:text-accent-700
                dark:hover:border-accent-600 dark:hover:text-accent-300
                transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M14 3h7v7" />
                <path d="M21 3l-9 9" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              查看 BGG 页面
              <svg
                className="w-3 h-3 opacity-60"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          )}

          {/* 相关图片 */}
          {game.extraImages.length > 0 && (
            <div className="mt-10">
              <h2 className="r-on-felt font-serif text-[13px] font-medium tracking-wide text-ink-2 dark:text-gray-400 mb-3">
                图片展示
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {game.extraImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/3]">
                    <Image
                      src={url}
                      alt={`${game.title} 图片 ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="rounded-md border border-line dark:border-gray-700 object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* 页脚藏书票：编号 / 录入 / 最后游玩 / 数据来源 */}
          <div className="r-on-felt-sub mt-10 pt-3.5 border-t border-line dark:border-gray-700
            flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] tracking-wide text-ink-3 dark:text-gray-500">
            {game.number !== null && (
              <span className="colophon-no text-accent-700 dark:text-accent-300">
                No. {formatNumber(game.number)}
              </span>
            )}
            {addedOn && <span>录入 {addedOn}</span>}
            {lastPlayed && <span>最后游玩 {lastPlayed}</span>}
            {bggId && <span>数据源 BGG #{bggId}</span>}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 对局记录 & 排行榜 */}
      {/* ======================================================== */}
      <div className="mt-16 border-t border-gray-200 dark:border-gray-700/50 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="r-on-felt font-serif text-lg font-semibold text-ink dark:text-gray-100 mb-1">
              排行榜 &amp; 对局记录
            </h2>
            <p className="r-on-felt-sub text-[12.5px] text-ink-3 dark:text-gray-500">
              共 {sessions.length} 场对局
            </p>
          </div>
          <SessionForm
            gameTitle={game.title}
            gameSlug={game.id}
            allPlayers={allPlayers.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>

        {/* 榜单：按主导模板自动切换指标 */}
        {sessions.length > 0 && (
          <div className="mb-10">
            <Leaderboard sessions={sessions} />
          </div>
        )}

        {/* 对局历史：每条按模板渲染 */}
        {sessions.length > 0 && (
          <div>
            <h3 className="r-on-felt font-serif text-[13px] font-medium tracking-wide text-ink-2 dark:text-gray-400 mb-3">
              对局历史
            </h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionRecord key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GameStatus }) {
  // 靠边框浓淡区分状态，不用彩色底 + 彩色字 + 呼吸圆点
  const styles: Record<string, string> = {
    已收藏: "border-accent-300 text-accent-700 dark:border-accent-800 dark:text-accent-300",
    想玩: "border-dashed border-line-strong text-ink-2 dark:border-gray-600 dark:text-gray-400",
    已玩过: "border-gray-400 text-gray-700 dark:border-gray-500 dark:text-gray-300",
    不好玩: "border-gray-300 text-gray-400 line-through dark:border-gray-700 dark:text-gray-500",
  };

  return (
    <span
      className={`r-status inline-flex items-center px-2 py-0.5 rounded border text-[12px] tracking-wide ${
        styles[status] ?? "border-line text-ink-2"
      }`}
    >
      {status}
    </span>
  );
}

function InfoCell({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`px-3.5 py-2.5 border-r border-line dark:border-gray-700 flex-1 min-w-[calc(50%-1px)] sm:min-w-[100px] ${
        wide ? "sm:min-w-[130px]" : ""
      }`}
    >
      <span className="block text-[10px] tracking-wide text-ink-3 dark:text-gray-500 mb-0.5">
        {label}
      </span>
      <span className="block text-[12.5px] text-ink dark:text-gray-100 tnum">
        {value}
      </span>
    </div>
  );
}

function PriceItem({ price, notes }: { price: number; notes: string }) {
  return <PriceToggle price={price} notes={notes} />;
}
