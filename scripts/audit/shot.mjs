// 界面审计截图脚本：复用系统 Chrome，不额外下载 Chromium
// 用法: node scripts/audit/shot.mjs <url> <outfile> [width] [height] [full]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "shots/home.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1000);
const full = process.argv[6] === "full";

mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
  locale: "zh-CN",
});
// SKIN=retro 时先注入 localStorage，模拟用户已切换到复古皮肤
const skin = process.env.SKIN;
const theme = process.env.THEME;
if (skin || theme) {
  await ctx.addInitScript(
    ([s, t]) => {
      try {
        if (s) {
          localStorage.setItem("skin", s);
          document.documentElement.dataset.skin = s;
        }
        if (t) localStorage.setItem("theme", t);
      } catch {}
    },
    [skin, theme],
  );
}

const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1800);
// 触发一次滚动，让入场动画/懒加载都跑完
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);

// CLIP=x,y,w,h 可只截局部区域，用来放大看清细节
const clipEnv = process.env.CLIP;
const clip = clipEnv
  ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(clipEnv.split(",").map(Number))
  : undefined;

await page.screenshot({ path: out, fullPage: full && !clip, clip });
console.log("saved:", out, full ? "(full)" : "");

await browser.close();
