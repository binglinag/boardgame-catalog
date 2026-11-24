// 点击指定文本后再截图，用于查看弹窗 / 折叠面板
// 用法: node scripts/audit/shot-click.mjs <url> <点击文本> <输出路径> [宽] [高]
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const clickText = process.argv[3] ?? "查看统计";
const out = process.argv[4] ?? "../audit-shots/click.png";
const width = Number(process.argv[5] ?? 1440);
const height = Number(process.argv[6] ?? 1200);

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, locale: "zh-CN" });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

const target = page.getByText(clickText, { exact: false }).first();
await target.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await target.click();
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

const clipEnv = process.env.CLIP;
const clip = clipEnv
  ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(clipEnv.split(",").map(Number))
  : undefined;

await page.screenshot({ path: out, clip });
console.log("saved:", out);
await browser.close();
