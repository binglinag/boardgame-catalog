"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadGameImage } from "@/app/actions/upload";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 " +
  "bg-gray-50/80 dark:bg-gray-700/40 text-gray-900 dark:text-white " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-300 dark:focus:border-violet-600 " +
  "outline-none transition-all";

interface Props {
  /** 当前图片 URL */
  value: string;
  /** 上传成功或手填后回传 URL */
  onChange: (url: string) => void;
  /** 管理员密码，上传需要 */
  password: string;
  /** 文件名提示，最终存成 covers/{nameHint}-xxx.jpg */
  nameHint?: string;
}

/**
 * 图片上传器：点击选择 / 拖拽 / 直接在页面任意处 Ctrl+V 粘贴剪贴板图片
 * 上传到 Vercel Blob 后把 URL 写回表单字段
 */
export default function ImageUploader({
  value,
  onChange,
  password,
  nameHint = "cover",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      const pw = password.trim();
      if (!pw) {
        setError("请先在上方输入管理员密码，再上传图片");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("只能上传图片文件");
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("password", pw);
        fd.append("file", file);
        fd.append("nameHint", nameHint);
        const res = await uploadGameImage(fd);
        if (res.success && res.url) {
          onChange(res.url);
        } else {
          setError(res.message);
        }
      } catch {
        setError("上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [password, nameHint, onChange],
  );

  // 全局监听粘贴：剪贴板里有图片就直接上传（文本粘贴不拦截）
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void handleFile(file);
            return;
          }
        }
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFile]);

  return (
    <div className="space-y-2.5">
      {value && (
        <div className="relative w-28 aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="封面预览" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center
              rounded-full bg-black/55 text-white text-[11px] leading-none
              hover:bg-black/75 transition-colors"
            title="移除封面"
          >
            ✕
          </button>
        </div>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200 ${
          dragging
            ? "border-violet-400 bg-violet-50/70 dark:bg-violet-900/20"
            : "border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-700/50 hover:bg-violet-50/40 dark:hover:bg-violet-900/10"
        } ${uploading ? "opacity-70 cursor-wait" : ""}`}
      >
        {uploading ? (
          <p className="text-sm text-violet-600 dark:text-violet-400">
            <span className="inline-block w-3.5 h-3.5 mr-1.5 align-[-2px] border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            上传中...
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              点击选择图片 · 拖拽到这里 · 或直接{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-[11px]">
                Ctrl+V
              </kbd>{" "}
              粘贴
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              支持 JPG / PNG / WebP / GIF，单张 3MB 以内
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="也可以直接粘贴图片链接 https://..."
        className={inputCls}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
