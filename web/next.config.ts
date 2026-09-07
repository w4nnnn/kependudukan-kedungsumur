import type { NextConfig } from "next"

const envDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      .map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean)
  : []

const nextConfig: NextConfig = {
  ...(envDevOrigins.length > 0 ? { allowedDevOrigins: envDevOrigins } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
