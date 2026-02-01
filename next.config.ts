import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 型エラーがあってもデプロイを続行させる設定
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
