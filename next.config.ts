import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://g48k8k0osckgs00ok8ww088o.89.117.53.152.sslip.io/:path*",
      },
    ];
  },
};

export default nextConfig;
