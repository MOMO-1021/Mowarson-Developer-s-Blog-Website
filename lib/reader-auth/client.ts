"use client";

import { createAuthClient } from "@neon/auth/next";

export const readerAuthClient = createAuthClient();

const HINT_COOKIE_NAME = "reader_session_hint";

export function hasReaderSessionHint(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${HINT_COOKIE_NAME}=1`);
}

export function setReaderSessionHint(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${HINT_COOKIE_NAME}=1; path=/; max-age=2592000; samesite=lax`;
}

export function clearReaderSessionHint(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${HINT_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
