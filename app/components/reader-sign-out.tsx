"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearReaderSessionHint, readerAuthClient } from "@/lib/reader-auth/client";

export function ReaderSignOut({ onSignedOut }: { onSignedOut?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await readerAuthClient.signOut();
      if (result.error) {
        throw new Error(result.error.message || "Could not sign out.");
      }
      clearReaderSessionHint();
      onSignedOut?.();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="reader-sign-out"
        type="button"
        onClick={() => void signOut()}
        disabled={pending}
        aria-busy={pending}
      >
        {pending && <span className="loading-spinner" aria-hidden="true" />}
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <span className="reader-sign-out-error" role="alert">{error}</span>}
    </>
  );
}
