import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// Test configuration without database for initial setup
export const authTestOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "test",
      clientSecret: process.env.GITHUB_SECRET || "test",
    }),
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
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET || "test-secret-change-in-production",
};
