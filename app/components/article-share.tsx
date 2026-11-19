"use client";

import { useState } from "react";

interface ArticleShareProps {
  title: string;
}

export function ArticleShare({ title }: ArticleShareProps) {
  const [message, setMessage] = useState("");

  function getArticleUrl() {
    return window.location.href;
  }

  function openShareWindow(platform: "linkedin" | "facebook" | "threads") {
    const url = encodeURIComponent(getArticleUrl());
    const text = encodeURIComponent(title);
    const targets = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      threads: `https://www.threads.net/intent/post?text=${text}%20${url}`,
    };
    window.open(targets[platform], "_blank", "noopener,noreferrer");
  }

  async function shareToInstagram() {
    const url = getArticleUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("Share menu opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Article link copied. Paste it into Instagram.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setMessage("Could not share automatically. Copy the article URL from your browser.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getArticleUrl());
      setMessage("Article link copied.");
    } catch {
      setMessage("Could not copy the link. Copy the article URL from your browser.");
    }
  }

  return (
    <section className="article-share" aria-label="Share this article">
      <span className="article-share-title">Enjoyed this article? Share it:</span>
      <div className="share-buttons">
        <button type="button" onClick={() => openShareWindow("linkedin")}>LinkedIn</button>
        <button type="button" onClick={() => openShareWindow("facebook")}>Facebook</button>
        <button type="button" onClick={() => openShareWindow("threads")}>Threads</button>
        <button type="button" onClick={() => void shareToInstagram()}>Instagram</button>
        <button type="button" onClick={() => void copyLink()}>Copy link</button>
      </div>
      <span className="sr-only" aria-live="polite">{message}</span>
    </section>
  );
}
