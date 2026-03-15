import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the root directory of the workspace
    // This fixes "We couldn't find the Next.js package" error in Turbopack
    root: path.resolve(__dirname, ".."), 
  },
};

export default nextConfig;
