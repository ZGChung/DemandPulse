import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

const GITHUB_ID = process.env.GITHUB_ID?.trim() || "";
const GITHUB_SECRET = process.env.GITHUB_SECRET?.trim() || "";
const isProduction = process.env.NODE_ENV === "production";
const isPlaceholder = (v: string) => !v || v === "test" || /your_|example|placeholder/i.test(v);
const isGitHubConfigured =
  GITHUB_ID.length > 0 &&
  GITHUB_SECRET.length > 0 &&
  !isPlaceholder(GITHUB_ID) &&
  !isPlaceholder(GITHUB_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    ...(isGitHubConfigured
      ? [
          GitHubProvider({
            clientId: GITHUB_ID,
            clientSecret: GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      // Fetch user role from database
      if (token.sub && prisma) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true },
          });
          if (dbUser?.role) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
