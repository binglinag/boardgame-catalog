import Link from "next/link";
import type { BoardGame, GameStatus } from "@/types/game";
import type { PlaySession } from "@/types/session";
import type { Player } from "@/types/player";
import SessionForm from "./session-form";
import Leaderboard from "./leaderboard";
import PriceToggle from "./price-toggle";

interface Props {
  game: BoardGame;
  sessions: PlaySession[];
  allPlayers: Player[];
}

export default function GameDetail({ game, sessions, allPlayers }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500
          hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8 group"
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

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-8 md:gap-12">
        {/* 左侧：封面图 */}
        <div className="animate-scale-in">
          {game.coverUrl ? (
            <img
              src={game.coverUrl}
              alt={game.title}
              className="w-full rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50"
            />
          ) : (
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/10 flex items-center justify-center">
              <span className="text-8xl font-bold text-primary-300 dark:text-primary-700">
                {game.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* 右侧：信息 */}
        <div className="animate-slide-up">
          {/* 标题区 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {game.title}
            </h1>
            {game.nameEn && (
              <p className="text-lg text-gray-400 dark:text-gray-500 italic">
                {game.nameEn}
              </p>
            )}
          </div>

          {/* 状态 + 重度 + 评分 */}
          <div className="flex items-center gap-6 mb-8 flex-wrap">
            {game.status.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.status.map((s) => (
                  <StatusBadge key={s} status={s} />
                ))}
              </div>
            )}
            {game.weight !== null && (
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                  {game.weight}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">/ 5 重度</span>
              </div>
            )}
            <span className="text-gray-300 dark:text-gray-600 text-lg">·</span>
            {game.rating !== null && (
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {game.rating}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">/ 10 评分</span>
              </div>
            )}
          </div>

          {/* 信息卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {game.players && <InfoItem icon="👥" label="玩家人数" value={game.players} />}
            {game.bestPlayers && <InfoItem icon="⭐" label="最佳人数" value={game.bestPlayers} />}
            {game.playTime && <InfoItem icon="⏱️" label="游戏时长" value={game.playTime} />}
            {game.year && <InfoItem icon="📅" label="出版年份" value={String(game.year)} />}
            {game.designer && <InfoItem icon="🎨" label="设计师" value={game.designer} />}
            {sessions.length > 0 && (
              <InfoItem icon="🎮" label="游玩次数" value={`${sessions.length} 次`} />
            )}
            {game.price !== null && <PriceItem price={game.price} notes={game.priceNotes} />}
          </div>

          {/* 标签 */}
          {game.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-sm font-medium
                    bg-primary-50 text-primary-700
                    dark:bg-primary-900/20 dark:text-primary-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 个人评价 */}
          {game.review && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                个人评价
              </h2>
              <blockquote className="border-l-2 border-primary-300 dark:border-primary-600 pl-4 text-gray-700 dark:text-gray-300 leading-relaxed italic">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                bg-gray-100 dark:bg-gray-800 text-sm font-medium
                text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700
                transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm6.066 8.855c.3 0 .543.242.543.543v5.204c0 .3-.243.543-.543.543a.546.546 0 01-.543-.543V9.941l-7.248 7.248a.537.537 0 01-.768 0 .545.545 0 010-.768l7.248-7.248h-4.661a.546.546 0 01-.543-.543c0-.3.243-.543.543-.543h5.972z" />
              </svg>
              查看 BGG 页面
            </a>
          )}

          {/* 相关图片 */}
          {game.extraImages.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                图片展示
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {game.extraImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`${game.title} 图片 ${i + 1}`}
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-gray-100 dark:border-gray-700/50 hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 对局记录 & 排行榜 */}
      {/* ======================================================== */}
      <div className="mt-16 border-t border-gray-200 dark:border-gray-700/50 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              🏆 排行榜 & 对局记录
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              共 {sessions.length} 场对局
            </p>
          </div>
          <SessionForm gameTitle={game.title} gameSlug={game.id} allPlayers={allPlayers} />
        </div>

        {/* 排行榜 */}
        {sessions.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              最高分排行
            </h3>
            <Leaderboard sessions={sessions} />
          </div>
        )}

        {/* 对局历史 */}
        {sessions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              对局历史
            </h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl bg-gray-50 dark:bg-gray-800/30
                    border border-gray-100 dark:border-gray-700/30 p-4
                    hover:border-gray-200 dark:hover:border-gray-600/50
                    transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(session.date).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {session.notes && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        {session.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {session.players
                      .sort((a, b) => b.score - a.score)
                      .map((player, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold w-5 text-center ${
                              i === 0
                                ? "text-amber-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {i === 0 ? "👑" : `#${i + 1}`}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {player.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {player.score}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GameStatus }) {
  const styles: Record<string, string> = {
    已收藏: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
    想玩: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    已玩过: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    不好玩: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status] ?? ""}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      {status}
    </span>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function PriceItem({ price, notes }: { price: number; notes: string }) {
  return <PriceToggle price={price} notes={notes} />;
}
