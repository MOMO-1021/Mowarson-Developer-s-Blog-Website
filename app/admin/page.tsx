"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import KanbanBoard from "../components/kanban-board";

interface AdminPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
  draft: boolean;
  body: string;
}

const starterBody = `## The short version

Write a concise summary of the key idea.

## Why it matters

Explain the problem your reader is trying to solve.

## Practical steps

Share useful, specific guidance.

## Final thoughts

Summarize the takeaway and suggest a next step.
`;

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

const emptyPost = (): AdminPost => ({
  slug: "",
  title: "",
  excerpt: "",
  category: "web-design",
  date: today(),
  readingTime: 5,
  draft: true,
  body: starterBody,
});

type ActiveTab = "articles" | "kanban";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("articles");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [post, setPost] = useState<AdminPost>(emptyPost);
  const [editing, setEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setError("");
    try {
      const response = await fetch("/api/admin/posts", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not load articles.");
      }
      setPosts(result.posts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load articles.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      void loadPosts();
    }
  }, [loadPosts, status]);

  function startNewPost() {
    setPost(emptyPost());
    setEditing(false);
    setShowEditor(true);
    setMessage("");
    setError("");
  }

  function editPost(selected: AdminPost) {
    setPost({ ...selected });
    setEditing(true);
    setShowEditor(true);
    setMessage("");
    setError("");
  }

  async function savePost(draft: boolean) {
    setSaving(true);
    setMessage("");
    setError("");
    const payload = { ...post, draft };
    try {
      const response = await fetch("/api/admin/posts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "The article could not be saved.");
      }
      setPost(payload);
      setEditing(true);
      setMessage(
        draft
          ? "Draft saved to GitHub."
          : "Article published to GitHub. Netlify will deploy it shortly.",
      );
      await loadPosts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The article could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(selected: AdminPost) {
    if (
      !window.confirm(
        `Delete "${selected.title}"? This removes it from the blog and cannot be undone from this dashboard.`,
      )
    ) {
      return;
    }

    setDeletingSlug(selected.slug);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected.slug }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "The article could not be deleted.");
      }
      setPosts((current) => current.filter((item) => item.slug !== selected.slug));
      if (post.slug === selected.slug) {
        setShowEditor(false);
        setEditing(false);
      }
      setMessage("Article deleted from GitHub. Netlify will deploy the removal shortly.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The article could not be deleted.");
    } finally {
      setDeletingSlug(null);
    }
  }

  if (status === "loading") {
    return (
      <main className="admin-page">
        <p className="admin-empty">
          <span className="loading-spinner" aria-hidden="true" /> Checking your sign-in…
        </p>
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="admin-page">
        <div className="admin-topbar">
          <a className="logo" href="/">Mowarson<span>Developer</span></a>
          <a href="/">View blog</a>
        </div>
        <section className="admin-login">
          <p className="eyebrow"><span className="eyebrow-dot" /> Private writing area</p>
          <h1>Your blog dashboard</h1>
          <p>Sign in with the GitHub account allowed to manage this blog.</p>
          <button className="button" type="button" onClick={() => signIn("github")}>
            Continue with GitHub <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-topbar">
        <a className="logo" href="/">Mowarson<span>Developer</span></a>
        <div className="admin-account">
          <span>Signed in as {session.user?.name || "blog editor"}</span>
          <button className="text-button" type="button" onClick={() => signOut({ callbackUrl: "/admin" })}>
            Sign out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab${activeTab === "articles" ? " is-active" : ""}`}
          onClick={() => setActiveTab("articles")}
        >
          ✍️ Articles
        </button>
        <button
          className={`admin-tab${activeTab === "kanban" ? " is-active" : ""}`}
          onClick={() => setActiveTab("kanban")}
        >
          📋 Kanban Board
        </button>
      </div>

      {/* Articles Tab */}
      {activeTab === "articles" && (
        <div className="admin-main">
          <div className="admin-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> Writing dashboard</p>
              <h1>Your articles</h1>
              <p>Write a post, save a draft, or publish it to your blog.</p>
            </div>
            <button className="button" type="button" onClick={startNewPost}>
              + New article
            </button>
          </div>

          {error && <p className="admin-alert is-error" role="alert">{error}</p>}
          {message && <p className="admin-alert is-success" role="status">{message}</p>}

          <section className="admin-card" aria-labelledby="article-list-heading">
            <div className="admin-card-heading">
              <h2 id="article-list-heading">Posts in your GitHub repository</h2>
              <button className="text-button" type="button" onClick={() => void loadPosts()} disabled={loadingPosts}>
                {loadingPosts ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            {loadingPosts ? (
              <p className="admin-empty">Loading your articles…</p>
            ) : posts.length ? (
              <div className="admin-post-list">
                {posts.map((item) => (
                  <article className="admin-post-row" key={item.slug}>
                    <div>
                      <span className={`status-pill${item.draft ? " is-draft" : " is-published"}`}>
                        {item.draft ? "Draft" : "Published"}
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.excerpt}</p>
                    </div>
                    <div className="admin-post-actions">
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() => editPost(item)}
                        disabled={Boolean(deletingSlug)}
                      >
                        Edit
                      </button>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => void deletePost(item)}
                        disabled={saving || Boolean(deletingSlug)}
                      >
                        {deletingSlug === item.slug ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">
                No dashboard articles yet. Choose <strong>New article</strong> to start writing.
              </p>
            )}
          </section>

          {showEditor && (
            <section className="admin-card admin-editor" aria-labelledby="editor-heading">
              <div className="admin-card-heading">
                <div>
                  <p className="eyebrow"><span className="eyebrow-dot" /> Article editor</p>
                  <h2 id="editor-heading">{editing ? "Edit article" : "Write a new article"}</h2>
                </div>
                <button className="text-button" type="button" onClick={() => setShowEditor(false)}>
                  Close
                </button>
              </div>
              <div className="admin-form-grid">
                <label>
                  Title
                  <input
                    required
                    maxLength={160}
                    value={post.title}
                    onChange={(event) => setPost({
                      ...post,
                      title: event.target.value,
                      slug: editing ? post.slug : slugFromTitle(event.target.value),
                    })}
                  />
                </label>
                <label>
                  Article URL
                  <input
                    required
                    value={post.slug}
                    disabled={editing}
                    onChange={(event) => setPost({ ...post, slug: slugFromTitle(event.target.value) })}
                  />
                </label>
                <label className="form-wide">
                  Short summary
                  <textarea
                    required
                    rows={2}
                    maxLength={300}
                    value={post.excerpt}
                    onChange={(event) => setPost({ ...post, excerpt: event.target.value })}
                  />
                </label>
                <label>
                  Topic
                  <select
                    value={post.category}
                    onChange={(event) => setPost({ ...post, category: event.target.value })}
                  >
                    <option value="web-design">Web design</option>
                    <option value="growth">Growth &amp; marketing</option>
                    <option value="strategy">Strategy</option>
                    <option value="brand-positioning">Brand positioning &amp; messaging</option>
                  </select>
                </label>
                <label>
                  Publish date
                  <input
                    type="date"
                    required
                    value={post.date}
                    onChange={(event) => setPost({ ...post, date: event.target.value })}
                  />
                </label>
                <label>
                  Reading time (minutes)
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={post.readingTime}
                    onChange={(event) => setPost({ ...post, readingTime: Number(event.target.value) })}
                  />
                </label>
              </div>
              <label className="markdown-label">
                Article content <span>Markdown is supported (use ## for a section heading).</span>
                <textarea
                  className="markdown-editor"
                  required
                  value={post.body}
                  onChange={(event) => setPost({ ...post, body: event.target.value })}
                />
              </label>
              <div className="admin-editor-actions">
                <button
                  className="button button-outline"
                  type="button"
                  disabled={saving}
                  onClick={() => void savePost(true)}
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={saving}
                  onClick={() => void savePost(false)}
                >
                  {saving ? "Publishing…" : "Publish article"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Kanban Tab */}
      {activeTab === "kanban" && (
        <div className="admin-main admin-main-wide">
          <KanbanBoard articleSlugs={posts.map((p) => p.slug)} />
        </div>
      )}
    </main>
  );
}
