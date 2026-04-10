import type { NextConfig } from "next"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000")
  .replace(/\/$/, "")
  .replace(/\/api$/, "")

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
