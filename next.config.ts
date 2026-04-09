import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.202'],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.50.202', '*.app.github.dev'],
    },
  },
};

export default nextConfig;
