import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET || "xin-chao-day-la-chuoi-bi-mat-qltb-nextauth-2026",
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        CredentialsProvider({
            name: "Tài khoản",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mật khẩu", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Vui lòng nhập email và mật khẩu");
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });
                const currentUser = user as any;
                if (!currentUser || !currentUser.password) {
                    throw new Error("Sai email hoặc mật khẩu");
                }
                const isMatch = await bcrypt.compare(credentials.password as string, currentUser.password);
                if (!isMatch) {
                    throw new Error("Sai email hoặc mật khẩu");
                }
                return user as any;
            }
        })
    ],
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
    pages: {
        signIn: "/login",
        error: "/login",
    },
});

// Extend next-auth types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: Role;
            department?: string | null;
        };
    }
}
