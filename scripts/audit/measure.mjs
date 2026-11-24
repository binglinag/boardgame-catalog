// 量取卡片实际尺寸与字体加载状态，用于排查布局问题
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "zh-CN" });
const page = await ctx.newPage();

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2500);

const info = await page.evaluate(async () => {
  if (document.fonts) await document.fonts.ready;
  const cards = Array.from(document.querySelectorAll(".game-card")).slice(0, 6).map((el) => {
    const r = el.getBoundingClientRect();
    const h3 = el.querySelector("h3");
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      titleFont: h3 ? getComputedStyle(h3).fontFamily : "-",
      titleSize: h3 ? getComputedStyle(h3).fontSize : "-",
    };
  });
  const fonts = ["Noto Serif SC", "Noto Sans SC", "JetBrains Mono"].map((f) => ({
    family: f,
    loaded: document.fonts ? document.fonts.check(`600 16px "${f}"`) : null,
  }));
  return { cards, fonts };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
