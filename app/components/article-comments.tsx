"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { clearReaderSessionHint, setReaderSessionHint } from "@/lib/reader-auth/client";

interface ArticleComment {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [canComment, setCanComment] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/articles/${encodeURIComponent(slug)}/comments`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not load comments.");
      }
      setComments(result.comments);
      const allowed = Boolean(result.canComment);
      setCanComment(allowed);
      if (allowed) {
        setReaderSessionHint();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load comments.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/articles/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      const result = await response.json();
      if (response.status === 401) {
        clearReaderSessionHint();
        setCanComment(false);
      }
      if (!response.ok) {
        throw new Error(result.error || "Could not post your comment.");
      }
      setComments((current) => [...current, result.comment]);
      setBody("");
      setMessage("Your comment has been posted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  }

  const redirectParam = encodeURIComponent(`/articles/${slug}`);

  return (
    <section className="article-comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Join the conversation</h2>
      <p>Share a thought or question about this article.</p>
      {canComment ? (
        <form className="comment-form" onSubmit={submitComment} aria-busy={submitting}>
          <label htmlFor="comment-body">Your comment</label>
          <textarea
            id="comment-body"
            name="body"
            rows={4}
            maxLength={1000}
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What are your thoughts?"
          />
          <div className="comment-form-footer">
            <span>{body.length}/1000</span>
            <button className="button" type="submit" disabled={submitting || !body.trim()}>
              {submitting && <span className="loading-spinner" aria-hidden="true" />}
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : loading ? null : (
        <div className="comments-auth-prompt">
          <p>Sign in with a reader account to post a comment.</p>
          <div className="comments-auth-actions">
            <Link className="button" href={`/auth/sign-in?redirectTo=${redirectParam}`}>
              Sign in to comment
            </Link>
            <Link className="button button-outline" href={`/auth/sign-up?redirectTo=${redirectParam}`}>
              Create account
            </Link>
          </div>
        </div>
      )}
      {error && <p className="comments-alert is-error" role="alert">{error}</p>}
      {message && <p className="comments-alert is-success" role="status">{message}</p>}
      <div className="comment-list" aria-live="polite">
        {loading ? (
          <p className="comments-loading"><span className="loading-spinner" /> Loading comments…</p>
        ) : error ? null : comments.length ? (
          comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-meta">
                <strong>{comment.name}</strong>
                <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
              </div>
              <p>{comment.body}</p>
            </article>
          ))
        ) : (
          <p className="comments-empty">No comments yet. Start the conversation.</p>
        )}
      </div>
    </section>
  );
}
