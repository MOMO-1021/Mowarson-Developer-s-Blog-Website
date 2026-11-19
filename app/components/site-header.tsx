"use client";

import Link from "next/link";
import { useState } from "react";
import { ReaderSignOut } from "@/app/components/reader-sign-out";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="logo" href="/" aria-label="Mowarson Developer home">
          Mowarson<span>Developer</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={`site-nav${open ? " is-open" : ""}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          <Link className="current" href="/" onClick={() => setOpen(false)}>
            Journal
          </Link>
          <Link href="/#articles" onClick={() => setOpen(false)}>
            Articles
          </Link>
          <a
            href="https://mowarsondeveloper.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            Portfolio <span aria-hidden="true">↗</span>
          </a>
          <Link className="nav-cta" href="/admin" onClick={() => setOpen(false)}>
            Write a post
          </Link>
          <ReaderSignOut />
        </nav>
      </div>
    </header>
  );
}
