import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 内部服务器部署，不需要图片优化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
