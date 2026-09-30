import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent WebstormProject folder has its own package-lock.json; pin the root here.
  turbopack: { root: __dirname },
};

export default nextConfig;
