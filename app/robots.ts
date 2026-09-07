import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Soukromé a technické cesty: členská sekce, přihlašování, platební tok,
      // administrace a strojové API. Nic z toho nepatří do indexu.
      disallow: [
        "/muj-ucet",
        "/digiuniverzita",
        "/prihlaseni",
        "/registrace",
        "/platba",
        "/admin",
        "/api/",
        // v adrese je ověřovací kód člena, tedy tajemství — do indexu nepatří
        "/overit/clen/",
      ],
    },
    sitemap: "https://ckpd.cz/sitemap.xml",
  };
}
