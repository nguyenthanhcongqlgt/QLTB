import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const departments = await prisma.department.findMany({
            orderBy: { name: "asc" }
        });
        return NextResponse.json(departments);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: "Tên không được trống" }, { status: 400 });

        const dept = await prisma.department.create({
            data: { name }
        });
        return NextResponse.json(dept);
    } catch (e: any) {
        if (e.code === 'P2002') return NextResponse.json({ error: "Tổ chuyên môn đã tồn tại" }, { status: 400 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
