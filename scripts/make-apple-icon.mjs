/**
 * 从 app/icon.svg 生成 app/apple-icon.png（180×180）
 *
 * iOS「添加到主屏幕」不吃 SVG，且透明底会渲染成黑色。
 * 所以铺一层砖红底再把图形居中缩放，圆角外的透明区自然被底色填满。
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("app/icon.svg");
const BG = "#9A3412"; // 与 svg 里的砖红一致

const inner = await sharp(svg, { density: 400 }).resize(148, 148).png().toBuffer();

const buf = await sharp({
  create: { width: 180, height: 180, channels: 4, background: BG },
})
  .composite([{ input: inner, gravity: "center" }])
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync("app/apple-icon.png", buf);
console.log("已生成 app/apple-icon.png", buf.length, "字节");
