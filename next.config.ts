import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "21.0.10.174",
    "0.0.0.0",
    "**.space-z.ai",
  ],
};

export default nextConfig;
