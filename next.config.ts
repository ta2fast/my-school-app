import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 型エラーがあってもデプロイを続行させる設定
    ignoreBuildErrors: true,
  },
  eslint: {
    // 文法チェックのエラーがあってもデプロイを続行させる設定
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
