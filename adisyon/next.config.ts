import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/Umur",
  assetPrefix: "/Umur",
};

export default nextConfig;
