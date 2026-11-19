import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

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
      const allowedUsername = process.env.ADMIN_GITHUB_USERNAME?.toLowerCase();
      const githubUsername =
        profile && "login" in profile && typeof profile.login === "string"
          ? profile.login.toLowerCase()
          : "";
      return Boolean(allowedUsername && githubUsername === allowedUsername);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
