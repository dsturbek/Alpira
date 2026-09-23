import type { NextConfig } from "next";

const konfiguracija: NextConfig = {
  async rewrites() {
    const cilj = process.env.API_INTERNI;
    if (!cilj) return [];

    return [{ source: "/api/:path*", destination: `${cilj}/api/:path*` }];
  },
};

export default konfiguracija;
