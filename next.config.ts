import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Fallbacks for browser compatibility
    },
  },
  // Enable Web Workers
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
