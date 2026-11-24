import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeToggle from "@/components/theme-toggle";
import SkinToggle from "@/components/skin-toggle";
import AddGameButton from "@/components/add-game-button";
import ExportButton from "@/components/export-button";
import "./globals.css";
import "./retro.css";

const siteName = "壮壮的桌游图鉴";
const siteUrl = "https://www.zzboardgamecatalog.xyz";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s - ${siteName}`,
  },
  description: "记录玩过的每一款桌游：收藏、评分、对局、排行榜",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName,
    title: siteName,
    description: "记录玩过的每一款桌游：收藏、评分、对局、排行榜",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: "记录玩过的每一款桌游：收藏、评分、对局、排行榜",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 三层字体：衬线标题 / 无衬线正文 / 等宽数字 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* 复古主题字体：站酷小薇（中文，印刷感）+ Alegreya（数字/西文，古典衬线） */}
        <link
          href="https://cdn.jsdelivr.net/npm/@fontsource/zcool-xiaowei@5/400.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fontsource/alegreya@5/700.css"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.toggle('dark', resolved === 'dark');
                  if (resolved === 'dark') document.body.classList.add('dark');

                  var skin = localStorage.getItem('skin') || 'dreamy';
                  document.documentElement.dataset.skin = skin;
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* 顶部导航 — 纸面 + 一条细分割线，不做毛玻璃 */}
        <header className="sticky top-0 z-50 border-b border-line dark:border-gray-800 bg-paper/92 dark:bg-[#1a1712]/92 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
              <a
                href="/"
                className="font-serif text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap text-ink dark:text-gray-100"
              >
                <span className="r-title">壮壮的桌游图鉴</span>
              </a>
              <a
                href="/leaderboard"
                className="text-[13px] whitespace-nowrap flex-shrink-0 pb-0.5
                  text-ink-2 dark:text-gray-400
                  border-b border-transparent
                  hover:text-accent-700 hover:border-accent-600
                  dark:hover:text-accent-300 dark:hover:border-accent-500
                  transition-colors"
              >
                玩家排行
              </a>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <AddGameButton />
              {/* 导出备份是低频操作，窄屏优先让位给标题与主导航 */}
              <div className="hidden sm:block">
                <ExportButton />
              </div>
              <SkinToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line dark:border-gray-800 py-6">
          <div className="r-on-felt-sub max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] tracking-wide text-ink-3 dark:text-gray-500">
            Built with Next.js · Powered by Notion · {new Date().getFullYear()}
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
