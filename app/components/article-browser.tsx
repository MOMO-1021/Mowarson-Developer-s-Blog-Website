"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FORMAT_LABELS, type PostFormat } from "@/lib/blog-taxonomy";

export interface ArticleCardData {
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  format?: PostFormat;
  postCode?: string;
  series?: string;
  date: string;
  readingTime: number;
  href: string;
}

const categories = [
  { value: "all", label: "All topics" },
  { value: "web-design", label: "Web design" },
  { value: "growth", label: "Growth & marketing" },
  { value: "strategy", label: "Strategy" },
  { value: "brand-positioning", label: "Brand positioning & messaging" },
];

const formats: Array<{ value: PostFormat | "all"; label: string }> = [
  { value: "all", label: "All formats" },
  { value: "guide", label: "Guide" },
  { value: "playbook", label: "Playbook" },
  { value: "case-study", label: "Case Study" },
  { value: "field-note", label: "Field Note" },
  { value: "checklist", label: "Checklist" },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function ArticleBrowser({ posts }: { posts: ArticleCardData[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFormat, setActiveFormat] = useState<PostFormat | "all">("all");

  const hasFormatTags = posts.some((p) => Boolean(p.format));

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.category === activeCategory;
      const matchesFormat =
        activeFormat === "all" || post.format === activeFormat;
      const matchesQuery =
        !normalizedQuery ||
        `${post.title} ${post.excerpt} ${post.categoryLabel} ${post.postCode ?? ""} ${post.series ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesFormat && matchesQuery;
    });
  }, [activeCategory, activeFormat, posts, query]);

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Field notes &amp; guides
          </p>
          <h2>Latest articles</h2>
        </div>
        <p className="article-count">
          {visiblePosts.length} {visiblePosts.length === 1 ? "article" : "articles"}
        </p>
      </div>
      <div className="article-tools">
        <div className="article-tools-row">
          <label className="search-box">
            <span className="sr-only">Search articles</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              placeholder="Search articles, codes (e.g. BP-01), or series..."
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {hasFormatTags && (
            <select
              className="format-select"
              value={activeFormat}
              onChange={(e) => setActiveFormat(e.target.value as PostFormat | "all")}
              aria-label="Filter by format"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="category-list" role="group" aria-label="Filter by topic">
          {categories.map((category) => (
            <button
              className={`category-chip${activeCategory === category.value ? " active" : ""}`}
              type="button"
              key={category.value}
              aria-pressed={activeCategory === category.value}
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      {visiblePosts.length ? (
        <div className="article-grid">
          {visiblePosts.map((post) => (
            <article className="article-card" key={post.href}>
              <div className="card-topline">
                <div className="card-badges">
                  {post.postCode && <span className="post-code-pill">{post.postCode}</span>}
                  <span className="topic-tag">{post.categoryLabel}</span>
                  {post.format && (
                    <span className="format-pill">{FORMAT_LABELS[post.format]}</span>
                  )}
                </div>
                <span className="reading-time">{post.readingTime} min read</span>
              </div>
              <h3>
                <Link href={post.href}>{post.title}</Link>
              </h3>
              <p>{post.excerpt}</p>
              {post.series && (
                <p className="card-series">Series: {post.series}</p>
              )}
              <div className="card-bottom">
                <span>{formatDate(post.date)}</span>
                <Link className="read-link" href={`${post.href}#article-top`}>
                  Read article <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No articles match that search. Try another keyword, topic, or format.
        </p>
      )}
    </>
  );
}
