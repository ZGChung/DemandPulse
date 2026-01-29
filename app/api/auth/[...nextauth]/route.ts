import NextAuth from "next-auth";

import { authTestOptions } from "@/lib/auth-test";

const handler = NextAuth(authTestOptions);

export { handler as GET, handler as POST };
