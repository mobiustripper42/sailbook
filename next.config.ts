import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.202', 'sailbook-dev', '100.118.147.49'],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.50.202', 'sailbook-dev:3000', '100.118.147.49:3000', '*.app.github.dev'],
    },
  },
};

export default nextConfig;
