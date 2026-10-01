import type { MetadataRoute } from "next";
import { conversionTools } from "@/content/tools";
import { guides } from "@/content/guides";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/guides",
    "/tools",
    "/privacy",
    "/help",
    "/about",
    "/terms",
    "/contact",
    ...conversionTools.map(({ slug }) => `/tools/${slug}`),
    ...guides.map(({ slug }) => `/guides/${slug}`),
  ].map((path) => ({ url: `https://nshome.life${path}` }));
}
