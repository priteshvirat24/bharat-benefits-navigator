import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      alasql: path.resolve(__dirname, 'node_modules/alasql/dist/alasql.min.js'),
    };
    return config;
  },
};

export default nextConfig;
