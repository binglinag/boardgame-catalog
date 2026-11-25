// 走一遍「排行榜 → 选玩家 → 浏览这批对局」的完整路径
// 用法: PICK="3,4" node scripts/audit/shot-sessions.mjs <out> [base]
import { chromium } from "playwright";

const out = process.argv[2] ?? "../audit-shots/sessions.png";
const base = process.argv[3] ?? "http://localhost:3210";
const pick = (process.env.PICK ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: Number(process.env.H ?? 1100) },
  deviceScaleFactor: Number(process.env.SCALE ?? 2),
  locale: "zh-CN",
});
if (process.env.SKIN) {
  await ctx.addInitScript((s) => {
    localStorage.setItem("skin", s);
    document.documentElement.dataset.skin = s;
  }, process.env.SKIN);
}

const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text());
});

await page.goto(`${base}/leaderboard`, { waitUntil: "networkidle", timeout: 90000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(600);

const chips = page.locator("div.mb-6 button[aria-pressed]");
console.log("chip:", (await chips.allTextContents()).join(" / "));
for (const idx of pick) {
  await chips.nth(idx).click({ force: true });
  await page.waitForTimeout(300);
}
await page.screenshot({ path: out.replace(/\.png$/, "-leaderboard.png") });

const jump = page.locator('a[href^="/sessions"]').first();
console.log("按钮文案:", (await jump.textContent())?.trim());
console.log("按钮链接:", await jump.getAttribute("href"));
await jump.click();
await page.waitForURL(/\/sessions/, { timeout: 30000 });
await page.waitForTimeout(900);
console.log("落地 URL:", page.url());

const stats = await page.evaluate(() => ({
  cards: document.querySelectorAll("section > div > div").length,
  pressed: [...document.querySelectorAll("button[aria-pressed='true']")].map((b) =>
    b.textContent.trim()
  ),
  sub: document.querySelector("h1 + p")?.textContent?.trim(),
  months: [...document.querySelectorAll("section h2")].map((h) => h.textContent.trim()),
}));
console.log("已选中:", stats.pressed.join(" + ") || "（无）");
console.log("副标题:", stats.sub);
console.log("月份分组:", stats.months.join(" | "));

await page.screenshot({ path: out });
console.log("saved:", out);
await browser.close();
