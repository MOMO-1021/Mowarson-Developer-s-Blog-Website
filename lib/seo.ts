import type { BlogPost } from "@/lib/posts";

const defaultSiteUrl =
  "https://mowarson-developer-s-blog-website.netlify.app";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || defaultSiteUrl
  );
}

export const siteName = "The Mowarson Developer Journal";
export const siteDescription =
  "Straightforward lessons on websites, search, and growing a brand online.";

export const author = {
  "@type": "Person",
  name: "Mowarson",
  url: "https://mowarsondeveloper.netlify.app/",
  sameAs: [
    "https://www.linkedin.com/in/mowarson-developer-298404302/",
    "https://www.instagram.com/mowarson_developer/",
    "https://x.com/MowarsonDev",
  ],
};

function articleUrl(slug: string): string {
  return `${getSiteUrl()}/articles/${slug}`;
}

export function createWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: siteName,
    description: siteDescription,
    url: getSiteUrl(),
    publisher: author,
  };
}

export function createBlogSchema(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${getSiteUrl()}/#blog`,
    name: siteName,
    description: siteDescription,
    url: getSiteUrl(),
    author,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${articleUrl(post.slug)}#article`,
      headline: post.title,
      description: post.excerpt,
      url: articleUrl(post.slug),
      datePublished: post.date,
      dateModified: post.date,
      author,
    })),
  };
}

export function createArticleSchema(post: BlogPost) {
  const url = articleUrl(post.slug);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@id": `${getSiteUrl()}/#blog`,
    },
    author,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    timeRequired: `PT${post.readingTime}M`,
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
  };
}
