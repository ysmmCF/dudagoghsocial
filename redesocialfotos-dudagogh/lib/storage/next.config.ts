import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true, // Allows deployment flexibility and external images
  },
  // Ensure large file uploads through API route if needed
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default nextConfig;
