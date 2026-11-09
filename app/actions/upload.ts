"use server";

import { uploadImageFile, hasBlobToken } from "@/lib/blob";

/**
 * 上传图片到 Vercel Blob（供新增/编辑页的封面图使用）
 * 用 FormData 传参：password / file / nameHint
 */
export async function uploadGameImage(
  formData: FormData,
): Promise<{ success: boolean; url?: string; message: string }> {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return { success: false, message: "密码错误" };
  }

  if (!hasBlobToken()) {
    return {
      success: false,
      message: "未配置 Vercel Blob，请先创建 Blob Store 并勾选 read-write token",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "没有收到图片文件" };
  }

  const nameHint = String(formData.get("nameHint") ?? "cover");
  const res = await uploadImageFile(file, nameHint);

  if (!res.url) {
    return { success: false, message: res.error ?? "上传失败" };
  }

  return { success: true, url: res.url, message: "上传成功" };
}
