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

/** 单张图片体积上限（Vercel Edge 请求体约 4.5MB，留余量） */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * 上传用户选择的图片文件（点击上传 / 拖拽 / 粘贴剪贴板图片）
 * 文件名带时间戳后缀，避免同名覆盖
 */
export async function uploadImageFile(
  file: File,
  nameHint = "cover",
): Promise<{ url: string | null; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: `不支持的文件类型: ${file.type || "未知"}` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      url: null,
      error: `图片 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过 ${MAX_IMAGE_BYTES / 1024 / 1024}MB 上限`,
    };
  }

  try {
    const ext = EXT_BY_TYPE[file.type] ?? "jpg";
    const safeName = nameHint
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_")
      .slice(0, 60) || "cover";
    const pathname = `${BLOB_PREFIX}/${safeName}-${Date.now().toString(36)}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    return { url: blob.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blob] uploadImageFile failed:", msg);
    return { url: null, error: `上传失败: ${msg}` };
  }
}
