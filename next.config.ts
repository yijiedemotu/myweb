import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the native SQLite addon out of the bundler (it is loaded at runtime).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
