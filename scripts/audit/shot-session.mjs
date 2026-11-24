// 交互态截图：点击「记录对局」打开弹窗后截图
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "../audit-shots/session-form.png";

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 2,
  locale: "zh-CN",
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

const trigger = page.getByText("记录对局", { exact: false }).first();
await trigger.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await trigger.click();
await page.waitForTimeout(1200);

await page.screenshot({ path: out });
console.log("saved:", out);
await browser.close();
