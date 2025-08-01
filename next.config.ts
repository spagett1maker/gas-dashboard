import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Vercel 빌드 중 ESLint 오류 무시
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
