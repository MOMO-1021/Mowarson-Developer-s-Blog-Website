"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ArticleCardData {
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
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
  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${post.title} ${post.excerpt} ${post.categoryLabel}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, posts, query]);

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
        <label className="search-box">
          <span className="sr-only">Search articles</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            placeholder="Search articles..."
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
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
                <span className="topic-tag">{post.categoryLabel}</span>
                <span className="reading-time">{post.readingTime} min read</span>
              </div>
              <h3>
                <Link href={post.href}>{post.title}</Link>
              </h3>
              <p>{post.excerpt}</p>
              <div className="card-bottom">
                <span>{formatDate(post.date)}</span>
                <Link className="read-link" href={post.href}>
                  Read article <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No articles match that search. Try another keyword or topic.
        </p>
      )}
    </>
  );
}
