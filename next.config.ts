import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://dc8wck04cgw8wc4ockg0okc4.89.117.53.152.sslip.io/:path*",
      },
    ];
  },
};

export default nextConfig;
