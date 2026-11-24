import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { getSiteUrl } from "@/lib/seo";

// Cache the sitemap at build time; revalidate every 24 hours.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const siteUrl = getSiteUrl();

  // Only include publicly crawlable pages (not /auth, /admin, /api).
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date("2026-11-19T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/articles/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
