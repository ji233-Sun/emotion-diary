import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 输出模式：使用 standalone 以优化部署大小
  output: "standalone",

  // 启用 React 严格模式（推荐）
  reactStrictMode: true,

  // 如果您使用了 Turbopack（Next.js 16+ 默认），无需额外配置
  // 但为了 Cloudflare 兼容性，可能需要禁用某些功能
  experimental: {
    // 如果遇到边缘运行时问题，可以尝试：
    // runtime: "experimental-edge",
  },
};

export default nextConfig;

