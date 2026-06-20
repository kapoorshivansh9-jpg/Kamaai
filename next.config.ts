import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Stop the app being embedded in iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Browsers must respect declared content types
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak full URLs to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only geolocation is needed (zone detection); block the rest
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
