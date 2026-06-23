import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Notion 图片 URL 是预签名的临时链接，不适合走 Next.js 优化/缓存
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cf.geekdo-images.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
