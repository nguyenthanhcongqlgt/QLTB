import type { NextAuthConfig } from "next-auth";

type Role = "ADMIN" | "TEACHER" | "PRINCIPAL";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.department = (user as any).department;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as Role;
                session.user.department = token.department as string | null;
            }
            return session;
        },
    },
    providers: [], // Cấu hình providers sẽ được thêm vào lib/auth.ts
    secret: process.env.AUTH_SECRET || "xin-chao-day-la-chuoi-bi-mat-qltb-nextauth-2026",
    trustHost: true,
} satisfies NextAuthConfig;
