"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReaderSignOut } from "@/app/components/reader-sign-out";
import { clearReaderSessionHint, hasReaderSessionHint } from "@/lib/reader-auth/client";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!hasReaderSessionHint()) {
      return;
    }

    let cancelled = false;
    fetch("/api/reader-session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { signedIn: false }))
      .then((data: { signedIn?: boolean }) => {
        if (cancelled) {
          return;
        }
        if (data.signedIn) {
          setSignedIn(true);
        } else {
          clearReaderSessionHint();
          setSignedIn(false);
        }
      })
      .catch(() => {
        // Keep header non-blocking if session check fails transiently.
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          <Link href="/#articles" onClick={() => setOpen(false)}>
            Articles
          </Link>
          {signedIn ? (
            <ReaderSignOut onSignedOut={() => setSignedIn(false)} />
          ) : (
            <Link className="nav-cta" href="/auth/sign-in" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
