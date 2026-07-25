import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-to-img (pdfjs + native canvas) and puppeteer-core (spawns a system
  // browser) cannot be bundled by the server build.
  serverExternalPackages: ["pdf-to-img", "puppeteer-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "api.denizlg24.com",
        port: "",
        pathname: "/v2/**",
      },
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
