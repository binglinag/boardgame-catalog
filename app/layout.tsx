import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "壮壮的桌游图鉴",
  description: "个人桌游收藏与游玩记录",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/chiron-sans-hk@2.012/css/vf.min.css"
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
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* 顶部导航 — 毛玻璃梦幻风格 */}
        <header className="sticky top-0 z-50 border-b border-white/30 dark:border-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-baseline gap-5">
              <a href="/" className="font-bold text-lg text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-violet-500 via-indigo-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradientShift">
                  壮壮的桌游图鉴
                </span>
              </a>
              <a
                href="/leaderboard"
                className="text-sm font-medium px-3 py-1.5 -mb-0.5 rounded-xl
                  text-violet-500 dark:text-violet-400
                  hover:bg-violet-50 dark:hover:bg-violet-900/20
                  hover:text-violet-700 dark:hover:text-violet-300
                  transition-all duration-200"
              >
                玩家排行
              </a>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/30 dark:border-white/5 py-6 bg-white/30 dark:bg-gray-900/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-violet-400 dark:text-violet-500">
            Built with Next.js · Powered by Notion · {new Date().getFullYear()}
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
