// 复古皮肤下抽查关键文字与背景的对比度，找 <4.5:1 的可读性问题
import { chromium } from "playwright";

const parse = (s) => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(",").map((v) => parseFloat(v));
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
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
};

const url = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-CN" });
const skin = process.env.SKIN ?? "";
const theme = process.env.THEME ?? "";
if (skin || theme) {
  await ctx.addInitScript(
    ([s, t]) => {
      if (s) {
        localStorage.setItem("skin", s);
        document.documentElement.dataset.skin = s;
      }
      if (t) localStorage.setItem("theme", t);
    },
    [skin, theme],
  );
}
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

const rows = await page.evaluate(() => {
  // 背景：沿祖先链找第一个不透明背景
  const bgOf = (el) => {
    let cur = el;
    while (cur) {
      const cs = getComputedStyle(cur);
      if (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)/.test(cs.backgroundColor)) {
        const m = cs.backgroundColor.match(/[\d.]+/g);
        if (m && (m.length === 3 || parseFloat(m[3]) > 0.9)) return cs.backgroundColor;
      }
      cur = cur.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const texts = [...document.querySelectorAll("h1,h2,h3,h4,p,span,th,td,button,a,summary,dt,dd")];
  const seen = new Set();
  const out = [];
  for (const el of texts) {
    const t = (el.textContent ?? "").trim();
    if (!t || t.length > 24) continue;
    if (el.children.length > 0) continue; // 只看叶子节点
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    out.push({
      text: t,
      color: cs.color,
      bg: bgOf(el),
      size: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      tag: el.tagName.toLowerCase(),
    });
    if (out.length > 400) break;
  }
  return out;
});

const bad = [];
for (const r of rows) {
  const c = parse(r.color), b = parse(r.bg);
  if (!c || !b) continue;
  if (b.a !== undefined && b.a < 0.95) continue;
  const cr = Number(ratio(c, b));
  const large = r.size >= 18.66 || (r.size >= 14 && Number(r.weight) >= 700);
  const need = large ? 3 : 4.5;
  if (cr < need) bad.push({ ...r, contrast: cr, need });
}
bad.sort((a, b) => a.contrast - b.contrast);
console.log(`检查 ${rows.length} 处文字，低于阈值 ${bad.length} 处`);
for (const b of bad.slice(0, 25)) {
  console.log(`${String(b.contrast).padStart(5)} (需${b.need}) ${b.tag} "${b.text}"  ${b.size}px  color=${b.color} bg=${b.bg}`);
}
await browser.close();
