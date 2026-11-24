// 详情页专项截图：顶栏信息带 + 对局记录/统计区
// 用法: node scripts/audit/shot-detail.mjs <slug> <outPrefix> [width]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const slug = process.argv[2];
const prefix = process.argv[3] ?? "shot";
const width = Number(process.argv[4] ?? 1440);

mkdirSync(dirname(prefix), { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width, height: 1000 },
  deviceScaleFactor: Number(process.env.SCALE ?? 2),
  locale: "zh-CN",
});

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

await page.goto(`http://localhost:3000/${slug}`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(1800);

// 1. 首屏（信息带 + 简介）
await page.screenshot({ path: `${prefix}-top.png` });
console.log("saved:", `${prefix}-top.png`);

// 2. 滚动到「排行榜 & 对局记录」标题，截该区块
const anchor = page.getByText("排行榜 & 对局记录", { exact: false }).first();
const found = (await anchor.count()) > 0;
if (found) {
  await anchor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2,h3")].find((h) =>
      h.textContent?.includes("排行榜"),
    );
    const start = el ? el.getBoundingClientRect().top + window.scrollY - 24 : 0;
    return { y: start };
  });
  await page.evaluate((y) => window.scrollTo(0, y), box.y);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${prefix}-sessions.png` });
  console.log("saved:", `${prefix}-sessions.png`);
  // 再往下滚一屏，看统计面板/更多对局卡
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${prefix}-more.png` });
  console.log("saved:", `${prefix}-more.png`);
} else {
  console.log("未找到「排行榜 & 对局记录」区块");
}

await browser.close();
