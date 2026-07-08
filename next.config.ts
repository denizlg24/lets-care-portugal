import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-to-img (pdfjs + native canvas) cannot be bundled by the server build.
  serverExternalPackages: ["pdf-to-img"],
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
