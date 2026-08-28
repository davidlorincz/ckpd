import type { NextConfig } from "next";

const convexSite = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

const nextConfig: NextConfig = {
  /**
   * Partnerské ověřovací API běží jako Convex httpAction (rate limit, lookup
   * i zápis do logu proběhnou atomicky v jedné mutaci). Ven ho vystavujeme pod
   * vlastní doménou, aby partneři dokumentovali `https://ckpd.cz/api/v1/verify`
   * a ne `*.convex.site`. Pozor: `/api/v1` je vyjmuté z matcheru v middleware.ts.
   */
  async rewrites() {
    if (!convexSite) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${convexSite}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
