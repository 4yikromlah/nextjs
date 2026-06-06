/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimasi untuk Vercel
  reactStrictMode: true,
  
  // Output standalone untuk production
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Middleware
  experimental: {
    optimizePackageImports: ['@radix-ui'],
  },
}

module.exports = nextConfig
