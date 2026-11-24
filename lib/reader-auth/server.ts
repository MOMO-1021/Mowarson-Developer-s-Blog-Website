import { createNeonAuth } from "@neon/auth/next/server";
import { cookies } from "next/headers";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret) {
  throw new Error(
    "Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET to enable reader accounts.",
  );
}

export const readerAuth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret },
});

/**
 * Checks whether the request includes a Neon Auth session cookie before
 * invoking upstream session verification.
 */
export async function hasReaderSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some((cookie) => cookie.name.includes("neon-auth.session_token"));
}
