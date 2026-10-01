import type { MetadataRoute } from "next";
import { guides } from "@/content/guides";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/guides",
    "/privacy",
    ...guides.map(({ slug }) => `/guides/${slug}`),
  ].map((path) => ({ url: `https://nshome.life${path}` }));
}
