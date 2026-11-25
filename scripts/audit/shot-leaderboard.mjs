// 玩家排行榜截图：可选先点几位玩家，看「共同对局」范围重算后的结果
// 用法: PICK="1,2" node scripts/audit/shot-leaderboard.mjs <out> [w] [h]
//       PLAYERS="壮壮,乐乐" 也行，但 Windows 下环境变量传中文容易乱码，优先用 PICK
import { chromium } from "playwright";

const out = process.argv[2] ?? "../audit-shots/leaderboard.png";
const pick = (process.env.PICK ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);
const names = (process.env.PLAYERS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 1100);

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width, height },
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
await page.goto("http://localhost:3000/leaderboard", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(800);

// 第 0 个 chip 是「全部」，玩家从 1 开始。
// 限定在筛选行容器里找，避免和顶部的主题/皮肤切换按钮混在一起。
const chips = page.locator("div.mb-6 button[aria-pressed]");
const chipTexts = await chips.allTextContents();
if (pick.length) console.log("chip 列表:", chipTexts.join(" / "));
for (const idx of pick) {
  await chips.nth(idx).click({ force: true });
  await page.waitForTimeout(350);
}
const pressed = await page.evaluate(() =>
  [...document.querySelectorAll("div.mb-6 button[aria-pressed='true']")].map((b) =>
    b.textContent.trim()
  )
);
console.log("已选中:", pressed.join(" + ") || "（无，全部）");

const rows = await page.evaluate(() => {
  const trs = [...document.querySelectorAll("tbody tr")];
  return trs.map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())
  );
});
console.log("表格行数:", rows.length);
for (const r of rows) console.log("  ", r.join(" | "));

const scope = await page
  .locator("text=共同对局")
  .first()
  .textContent()
  .catch(() => null);
if (scope) console.log("范围提示:", scope.trim());

await page.screenshot({ path: out, fullPage: false });
console.log("saved:", out);
await browser.close();
