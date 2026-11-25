import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";
import GitHubProvider from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      isAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    isAdmin?: boolean;
  }
}

function getAllowedAdminUsername(): string {
  return process.env.ADMIN_GITHUB_USERNAME?.trim().toLowerCase() ?? "";
}

// When NextAuth is mounted at a custom basePath (/api/admin-auth), we must
// declare cookie names explicitly so that getServerSession() (which also uses
// these authOptions) can find the same cookies the handler sets.
const useSecureCookies =
  typeof process.env.NEXTAUTH_URL === "string" &&
  process.env.NEXTAUTH_URL.startsWith("https://");

const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async signIn({ profile }) {
      const allowedUsername = getAllowedAdminUsername();
      const githubUsername =
        profile && "login" in profile && typeof profile.login === "string"
          ? profile.login.toLowerCase()
          : "";
      return Boolean(allowedUsername && githubUsername === allowedUsername);
    },
    async jwt({ token, profile }) {
      const allowedUsername = getAllowedAdminUsername();
      if (profile && "login" in profile && typeof profile.login === "string") {
        const username = profile.login.toLowerCase();
        token.username = username;
        token.isAdmin = Boolean(allowedUsername && username === allowedUsername);
      } else if (token.username) {
        token.isAdmin = Boolean(allowedUsername && token.username === allowedUsername);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Verifies that the current request has a valid NextAuth session belonging
 * strictly to the configured ADMIN_GITHUB_USERNAME.
 *
 * Pass the NextRequest from a Route Handler so that getToken() can read the
 * JWT cookie directly from the incoming request — this is the most reliable
 * approach in the Next.js App Router with a custom NextAuth basePath.
 * Falls back to getServerSession() when no request is provided (e.g. in
 * Server Components).
 */
export async function requireAdminSession(req?: NextRequest) {
  const allowedUsername = getAllowedAdminUsername();
  if (!allowedUsername) return null;

  if (req) {
    // Route Handler path: read the JWT directly from the request cookie.
    // getToken() handles both __Secure- and plain cookie names automatically.
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: `${cookiePrefix}next-auth.session-token`,
    });
    if (!token?.isAdmin) return null;
    if ((token.username as string | undefined)?.toLowerCase() !== allowedUsername) return null;
    return token;
  }

  // Server Component path: use getServerSession (reads from next/headers context).
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return null;
  if (session.user.username?.toLowerCase() !== allowedUsername) return null;
  return session;
}
