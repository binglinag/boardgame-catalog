// 输出低对比度文字的去重汇总（按 class/fontSize 归类），便于精准修
import { chromium } from "playwright";

const parse = (s) => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(",").map(Number);
  return { r, g, b, a };
};
const lum = ({ r, g, b }) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const url = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-CN" });
const skin = process.env.SKIN ?? "";
if (skin) {
  await ctx.addInitScript((s) => {
    localStorage.setItem("skin", s);
    document.documentElement.dataset.skin = s;
  }, skin);
}
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

const rows = await page.evaluate(() => {
  const bgOf = (el) => {
    let cur = el;
    while (cur) {
      const cs = getComputedStyle(cur);
      const v = cs.backgroundColor;
      if (v && !/rgba\(0, 0, 0, 0\)/.test(v)) {
        const m = v.match(/[\d.]+/g);
        if (m && (m.length === 3 || parseFloat(m[3]) > 0.9)) return v;
      }
      cur = cur.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const out = [];
  for (const el of document.querySelectorAll("h1,h2,h3,h4,p,span,th,td,button,a,summary,dt,dd,li,div")) {
    if (el.children.length) continue;
    const t = (el.textContent ?? "").trim();
    if (!t || t.length > 30) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    out.push({
      text: t,
      cls: el.className && typeof el.className === "string" ? el.className : "",
      color: cs.color,
      bg: bgOf(el),
      size: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      tag: el.tagName.toLowerCase(),
    });
  }
  return out;
});

const groups = new Map();
for (const r of rows) {
  const c = parse(r.color), b = parse(r.bg);
  if (!c || !b || (b.a !== undefined && b.a < 0.95)) continue;
  const cr = ratio(c, b);
  const large = r.size >= 18.66 || (r.size >= 14 && Number(r.weight) >= 700);
  if (cr >= (large ? 3 : 4.5)) continue;
  const key = `${r.color}|${r.bg}|${r.size}`;
  if (!groups.has(key)) groups.set(key, { ...r, cr: cr.toFixed(2), n: 0, samples: [] });
  const g = groups.get(key);
  g.n++;
  if (g.samples.length < 4) g.samples.push(t_(r.text));
  function t_(s) { return s; }
}
const list = [...groups.values()].sort((a, b) => Number(a.cr) - Number(b.cr));
console.log(`低对比度分组 ${list.length} 组`);
for (const g of list) {
  console.log(`\n${g.cr}:1  ${g.size}px ${g.tag}  x${g.n}  color=${g.color} on ${g.bg}`);
  console.log(`  例: ${g.samples.join(" / ")}`);
  if (g.cls) console.log(`  class: ${g.cls.slice(0, 180)}`);
}
await browser.close();
