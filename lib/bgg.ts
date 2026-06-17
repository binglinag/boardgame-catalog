/**
 * BGG XML API v2 数据抓取
 */

export interface BggData {
  bggId: number;
  titleEn: string;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  weight: number | null;
  rating: number | null;
  designers: string[];
  image: string | null;
  thumbnail: string | null;
}

/** 从 BGG URL 中提取数字 ID */
export function extractBggId(url: string): number | null {
  const m = url.match(/boardgamegeek\.com\/boardgame\/(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** 提取 XML 标签属性值 */
function attr(xml: string, tag: string, attrName = "value"): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*?${attrName}\\s*=\\s*"([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

/** 提取标签内容 (如 <image>url</image>) */
function tagContent(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>(.*?)</${tag}>`, "is");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/** 提取所有匹配标签的 value 属性 */
function attrsAll(xml: string, tag: string, filterAttr?: string, filterVal?: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*?value\\s*=\\s*"([^"]*)"[^>]*>`, "gi");
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (!filterAttr) {
      results.push(m[1]);
    } else {
      // 检查该标签是否有 filterAttr=filterVal
      const fullTag = m[0];
      if (new RegExp(`${filterAttr}\\s*=\\s*"${filterVal}"`, "i").test(fullTag)) {
        results.push(m[1]);
      }
    }
  }
  return results;
}

/** 调用 BGG API 获取游戏数据 */
export async function fetchBggData(bggId: number): Promise<BggData | null> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`;
  const token = process.env.BGG_API_TOKEN ?? "";

  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const xml = await res.text();

    // 基本字段
    const titleEn = attr(xml, "name", "value") ?? "";
    const yearPublished = Number(attr(xml, "yearpublished", "value")) || null;
    const minPlayers = Number(attr(xml, "minplayers", "value")) || null;
    const maxPlayers = Number(attr(xml, "maxplayers", "value")) || null;
    const playingTime = Number(attr(xml, "playingtime", "value")) || null;

    // 评分 & 重度（嵌套在 statistics/ratings 中）
    const ratingRaw = xml.match(/<average\b[^>]*?value\s*=\s*"([^"]*)"[^>]*\/>/i);
    const rating = ratingRaw ? Number(ratingRaw[1]) : null;

    const weightRaw = xml.match(/<averageweight\b[^>]*?value\s*=\s*"([^"]*)"[^>]*\/>/i);
    const weight = weightRaw ? Number(weightRaw[1]) : null;

    // 设计师
    const designers = attrsAll(xml, "link", "type", "boardgamedesigner");

    // 图片
    const image = tagContent(xml, "image");
    const thumbnail = tagContent(xml, "thumbnail");

    return {
      bggId,
      titleEn: titleEn || "",
      yearPublished,
      minPlayers,
      maxPlayers,
      playingTime,
      weight: weight ? Math.round(weight * 100) / 100 : null,
      rating: rating ? Math.round(rating * 10) / 10 : null,
      designers,
      image: image || null,
      thumbnail: thumbnail || null,
    };
  } catch (err) {
    console.error(`[BGG] fetch failed for id=${bggId}:`, err);
    return null;
  }
}
