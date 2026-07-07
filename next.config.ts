import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.denizlg24.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
