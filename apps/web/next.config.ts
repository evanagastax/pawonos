import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pawonos/database", "@pawonos/types", "@pawonos/validation", "@pawonos/ui", "@pawonos/utils"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;