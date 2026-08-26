import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/api/(meta|settings|employees|notifications)",
        headers: [{ key: "Cache-Control", value: "public, max-age=15" }],
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
