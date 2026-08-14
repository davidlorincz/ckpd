import type { MetadataRoute } from "next";
import { SHOW_MEMBERS } from "@/lib/flags";
import { getStanoviska } from "@/lib/stanoviska";

const BASE = "https://ckpd.cz";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/o-komore",
    "/clenstvi",
    "/stanoviska",
    "/kontakt",
    "/eticky-kodex",
    "/ochrana-osobnich-udaju",
    ...(SHOW_MEMBERS ? ["/clenove"] : []),
  ].map((p) => ({ url: `${BASE}${p}` }));

  const positions = getStanoviska().map((s) => ({
    url: `${BASE}/stanoviska/${s.slug}`,
    lastModified: s.date,
  }));

  return [...staticPages, ...positions];
}
