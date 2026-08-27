import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["undici"],
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
