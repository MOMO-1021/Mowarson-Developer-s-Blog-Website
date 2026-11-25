import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleComments } from "@/app/components/article-comments";
import { ArticleMarkdown } from "@/app/components/article-markdown";
import { ArticleShare } from "@/app/components/article-share";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import {
  CATEGORY_META,
  FORMAT_LABELS,
  extractHeadings,
  getPublishedPost,
  getPublishedPosts,
} from "@/lib/posts";
import { createArticleSchema, getSiteUrl } from "@/lib/seo";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  return post
    ? {
        title: post.title,
        description: post.excerpt,
        alternates: {
          canonical: `${getSiteUrl()}/articles/${post.slug}`,
        },
        openGraph: {
          type: "article",
          title: post.title,
          description: post.excerpt,
          url: `${getSiteUrl()}/articles/${post.slug}`,
          publishedTime: post.date,
          authors: ["Mowarson"],
        },
      }
    : { title: "Article not found" };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  const allPosts = await getPublishedPosts();
  const seriesPosts = post.series
    ? allPosts
        .filter((p) => p.series === post.series)
        .sort((a, b) => (a.seriesOrder ?? 999) - (b.seriesOrder ?? 999))
    : [];

  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const headings = extractHeadings(post.body);
  const categoryLabel = CATEGORY_META[post.category]?.label ?? post.category.replace("-", " ");
  const formatLabel = post.format ? FORMAT_LABELS[post.format] : null;
  const displayDate = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${post.date}T12:00:00Z`));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createArticleSchema(post)),
        }}
      />
      <SiteHeader />
      <main className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/#articles">Articles</Link>
          <span aria-hidden="true">/</span>
          <span>{categoryLabel}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.postCode ? `${post.postCode}: ` : ""}{post.title}</span>
        </nav>
        <div className="post-layout">
          <article className="post" id="article-top">
            <div className="post-badges">
              {post.postCode && <span className="post-code-pill">{post.postCode}</span>}
              <span className="topic-tag">{categoryLabel}</span>
              {formatLabel && <span className="format-pill">{formatLabel}</span>}
            </div>
            <h1>{post.title}</h1>
            <p className="post-dek">{post.excerpt}</p>
            <div className="post-meta">
              <Image
                src="/assets/mowarson.jpg"
                alt=""
                width={36}
                height={36}
                priority
              />
              <span>By <strong>Mowarson</strong></span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{displayDate}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
            </div>

            {post.series && seriesPosts.length > 1 && (
              <div className="series-banner">
                <strong>Series: {post.series}</strong>
                <ol className="series-list">
                  {seriesPosts.map((sp, idx) => (
                    <li key={sp.slug} className={sp.slug === post.slug ? "is-current" : ""}>
                      {sp.slug === post.slug ? (
                        <span>
                          Part {sp.seriesOrder ?? idx + 1}: {sp.title} (reading)
                        </span>
                      ) : (
                        <Link href={`/articles/${sp.slug}`}>
                          Part {sp.seriesOrder ?? idx + 1}: {sp.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="post-content">
              <ArticleMarkdown content={post.body} />
            </div>
            <ArticleComments slug={post.slug} />
            <ArticleShare title={post.title} />
            <div className="post-end">
              <p>Want to clarify the story behind your brand?</p>
              <a
                className="button"
                href="https://mowarsondeveloper.netlify.app/contact.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Let&apos;s talk <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>

          <aside className="post-aside" aria-label="Article navigation">
            {headings.length > 0 && (
              <div className="toc-box">
                <h2>In this article</h2>
                <nav className="toc-nav" aria-label="Table of contents">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={h.level === 3 ? "toc-sub" : undefined}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {relatedPosts.length > 0 && (
              <div className="aside-related">
                <h2>Related in {categoryLabel}</h2>
                <ul>
                  {relatedPosts.map((rp) => (
                    <li key={rp.slug}>
                      <Link href={`/articles/${rp.slug}`}>{rp.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="aside-all">
              <h2>Keep reading</h2>
              <Link href="/#articles">View all articles →</Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
