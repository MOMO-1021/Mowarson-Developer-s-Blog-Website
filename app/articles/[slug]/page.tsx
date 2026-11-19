import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArticleComments } from "@/app/components/article-comments";
import { ArticleShare } from "@/app/components/article-share";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getPublishedPost } from "@/lib/posts";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  return post
    ? { title: post.title, description: post.excerpt }
    : { title: "Article not found" };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  const categoryLabel = post.category.replace("-", " ");
  const displayDate = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${post.date}T12:00:00Z`));

  return (
    <>
      <SiteHeader />
      <main className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Journal</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>
        <div className="post-layout">
          <article className="post">
            <span className="topic-tag">{categoryLabel}</span>
            <h1>{post.title}</h1>
            <p className="post-dek">{post.excerpt}</p>
            <div className="post-meta">
              <img src="/assets/mowarson.jpg" alt="" width="36" height="36" />
              <span>By <strong>Mowarson</strong></span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{displayDate}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
            </div>
            <ArticleShare title={post.title} />
            <div className="post-content">
              <ReactMarkdown>{post.body}</ReactMarkdown>
            </div>
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
            <ArticleComments slug={post.slug} />
          </article>
          <aside className="post-aside" aria-label="More articles">
            <h2>Keep reading</h2>
            <Link href="/#articles">View all articles →</Link>
            <Link href="/admin">Write a post →</Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
