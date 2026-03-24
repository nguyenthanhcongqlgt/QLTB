import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                createdAt: true,
                _count: { select: { bookings: true } }
            }
        });
        return NextResponse.json(users);
    } catch {
        return NextResponse.json({ error: "Lỗi tải danh sách người dùng" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, role, department } = await req.json();

    if (!email || !password || !name) {
        return NextResponse.json({ error: "Tên, email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
        return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role ?? "TEACHER",
                department,
            } as any,
            select: { id: true, name: true, email: true, role: true, department: true }
        });
        return NextResponse.json(user, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Lỗi tạo tài khoản" }, { status: 500 });
    }
}
