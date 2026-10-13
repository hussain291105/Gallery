import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export is compatible with Vercel hosting and Capacitor's WebView.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true }
};
export default nextConfig;