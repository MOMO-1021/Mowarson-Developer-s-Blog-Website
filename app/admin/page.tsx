"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  CATEGORY_META,
  FORMAT_LABELS,
  INFOGRAPHIC_SNIPPETS,
  POST_FORMAT_TEMPLATES,
  buildPrefixedSlug,
  type PostCategory,
  type PostFormat,
} from "@/lib/blog-taxonomy";
import { ArticleMarkdown } from "../components/article-markdown";
import KanbanBoard from "../components/kanban-board";

interface AdminPost {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  format?: PostFormat;
  postCode?: string;
  series?: string;
  seriesOrder?: number;
  date: string;
  readingTime: number;
  draft: boolean;
  body: string;
}

const starterBody = POST_FORMAT_TEMPLATES.guide;

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
  format: "guide",
  postCode: "",
  series: "",
  seriesOrder: undefined,
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
  const [editorPreview, setEditorPreview] = useState(false);
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
                    onChange={(event) =>
                      setPost({
                        ...post,
                        title: event.target.value,
                        slug: editing
                          ? post.slug
                          : buildPrefixedSlug(event.target.value, post.category),
                      })
                    }
                  />
                </label>
                <label>
                  Article URL (auto-prefixed by topic)
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
                    onChange={(event) => {
                      const nextCategory = event.target.value as PostCategory;
                      setPost({
                        ...post,
                        category: nextCategory,
                        slug:
                          !editing && post.title
                            ? buildPrefixedSlug(post.title, nextCategory)
                            : post.slug,
                      });
                    }}
                  >
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label} ({meta.slugPrefix})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Post Format
                  <select
                    value={post.format ?? "guide"}
                    onChange={(event) =>
                      setPost({ ...post, format: event.target.value as PostFormat })
                    }
                  >
                    {Object.entries(FORMAT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Post Code (e.g. {CATEGORY_META[post.category]?.codePrefix}-01)
                  <input
                    maxLength={20}
                    placeholder={`${CATEGORY_META[post.category]?.codePrefix}-01`}
                    value={post.postCode ?? ""}
                    onChange={(event) =>
                      setPost({ ...post, postCode: event.target.value.toUpperCase() })
                    }
                  />
                </label>
                <label>
                  Series name (optional)
                  <input
                    maxLength={80}
                    placeholder="e.g. Brand Positioning Basics"
                    value={post.series ?? ""}
                    onChange={(event) => setPost({ ...post, series: event.target.value })}
                  />
                </label>
                <label>
                  Series part # (optional)
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="1"
                    value={post.seriesOrder ?? ""}
                    onChange={(event) =>
                      setPost({
                        ...post,
                        seriesOrder: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
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
              <div className="editor-toolbar">
                <div className="editor-toolbar-group">
                  <button
                    type="button"
                    className={`editor-mode-btn${!editorPreview ? " is-active" : ""}`}
                    onClick={() => setEditorPreview(false)}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    className={`editor-mode-btn${editorPreview ? " is-active" : ""}`}
                    onClick={() => setEditorPreview(true)}
                  >
                    Live Preview
                  </button>
                </div>
                <div className="editor-toolbar-group">
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() => {
                      const fmt = post.format ?? "guide";
                      if (
                        !post.body.trim() ||
                        window.confirm(`Replace editor content with the "${FORMAT_LABELS[fmt]}" template?`)
                      ) {
                        setPost({ ...post, body: POST_FORMAT_TEMPLATES[fmt] });
                      }
                    }}
                  >
                    Apply {FORMAT_LABELS[post.format ?? "guide"]} template
                  </button>
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() =>
                      setPost({ ...post, body: `${post.body}\n\n${INFOGRAPHIC_SNIPPETS.callout}` })
                    }
                  >
                    + Callout
                  </button>
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() =>
                      setPost({
                        ...post,
                        body: `${post.body}\n\n${INFOGRAPHIC_SNIPPETS["stat-grid"]}`,
                      })
                    }
                  >
                    + Stat Grid
                  </button>
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() =>
                      setPost({
                        ...post,
                        body: `${post.body}\n\n${INFOGRAPHIC_SNIPPETS["process-steps"]}`,
                      })
                    }
                  >
                    + Process Steps
                  </button>
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() =>
                      setPost({
                        ...post,
                        body: `${post.body}\n\n${INFOGRAPHIC_SNIPPETS.comparison}`,
                      })
                    }
                  >
                    + Comparison
                  </button>
                  <button
                    type="button"
                    className="kb-chip"
                    onClick={() =>
                      setPost({
                        ...post,
                        body: `${post.body}\n\n${INFOGRAPHIC_SNIPPETS["bar-chart"]}`,
                      })
                    }
                  >
                    + Bar Chart
                  </button>
                </div>
              </div>
              {editorPreview ? (
                <div className="editor-preview post-content">
                  <ArticleMarkdown content={post.body} />
                </div>
              ) : (
                <label className="markdown-label">
                  Article content <span>Markdown, callouts, and infographics are supported.</span>
                  <textarea
                    className="markdown-editor"
                    required
                    value={post.body}
                    onChange={(event) => setPost({ ...post, body: event.target.value })}
                  />
                </label>
              )}
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
