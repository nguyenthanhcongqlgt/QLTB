import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl, auth: session } = req as any;
    const isLoggedIn = !!session;

    // Public routes
    const publicRoutes = ["/login", "/api/auth"];
    const isPublic = publicRoutes.some((r) => nextUrl.pathname.startsWith(r));

    if (isPublic) return NextResponse.next();

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // ADMIN/PRINCIPAL only routes
    const adminRoutes = ["/admin"];
    const isAdminRoute = adminRoutes.some((r) => nextUrl.pathname.startsWith(r));
    const role = session?.user?.role;

    if (isAdminRoute && role === "TEACHER") {
        return NextResponse.redirect(new URL("/catalog", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
