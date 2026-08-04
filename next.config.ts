import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dev-api-bengkelmouse.duaenam.id',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
