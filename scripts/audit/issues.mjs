// 抓取 Next.js dev 指示器里的报错内容 + 浏览器 console
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-CN" });
const page = await ctx.newPage();

const logs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2500);

// nextjs-portal 是 web component，内容在 shadow root 里
const issues = await page.evaluate(() => {
  const portal = document.querySelector("nextjs-portal");
  if (!portal) return { found: false, text: "" };
  const root = portal.shadowRoot;
  return { found: true, text: root ? root.textContent.replace(/\s+/g, " ").slice(0, 1500) : "" };
});

console.log("=== portal ===");
console.log(JSON.stringify(issues, null, 2));
console.log("=== console ===");
console.log(logs.join("\n") || "(none)");

await browser.close();
