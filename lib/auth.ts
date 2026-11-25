import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
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
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const allowedUsername = getAllowedAdminUsername();
  if (!session?.user?.isAdmin || !allowedUsername) {
    return null;
  }
  if (session.user.username?.toLowerCase() !== allowedUsername) {
    return null;
  }
  return session;
}
