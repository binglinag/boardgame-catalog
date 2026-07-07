/**
 * Vercel Blob 图片存储
 * 将 BGG/Notion 外部图片转存到 Vercel Blob，获得稳定的 URL + CDN 加速
 */
import { put } from "@vercel/blob";

const BLOB_PREFIX = "covers"; // Blob 存储中的目录前缀

/** 下载外部图片并上传到 Vercel Blob，返回 Blob URL */
export async function uploadCoverToBlob(
  imageUrl: string,
  gameTitle: string,
): Promise<string | null> {
  try {
    // 1. 下载图片
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "BoardGameCatalog/1.0" },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    // 2. 生成安全文件名
    const ext = contentType.includes("png") ? "png" : "jpg";
    const safeName = gameTitle
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_")
      .slice(0, 60);
    const pathname = `${BLOB_PREFIX}/${safeName}.${ext}`;

    // 3. 上传到 Vercel Blob（同名覆盖）
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return blob.url;
  } catch (err) {
    console.error("[Blob] upload failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
