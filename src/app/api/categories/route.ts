import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { assets: true } } },
    });

    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, color, icon } = await req.json();
    if (!name) return NextResponse.json({ error: "Tên danh mục là bắt buộc" }, { status: 400 });

    const category = await prisma.category.create({
        data: { name, description, color: color ?? "#3B82F6", icon: icon ?? "package" },
    });

    return NextResponse.json(category, { status: 201 });
}
