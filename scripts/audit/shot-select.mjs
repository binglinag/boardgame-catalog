// 打开页面上的下拉选择器并截图（用于检查 CustomSelect 的展开态）
// 用法: node scripts/audit/shot-select.mjs <url> <out> [w] [h]
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "../audit-shots/select.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);

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
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
// dev 的浮层（左下圆球 / 错误指示器）会拦截点击、也会入镜，截图时藏掉
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(1200);

const trigger = page.locator('button[aria-haspopup="listbox"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click({ force: true });
await page.waitForTimeout(500);

const clipEnv = process.env.CLIP;
const clip = clipEnv
  ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(clipEnv.split(",").map(Number))
  : undefined;

await page.screenshot({ path: out, clip });
console.log("saved:", out);
await browser.close();
