import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { name, description, color, icon } = await req.json();

    if (!name) return NextResponse.json({ error: "Tên danh mục là bắt buộc" }, { status: 400 });

    try {
        const category = await prisma.category.update({
            where: { id },
            data: { name, description, ...(color ? { color } : {}), ...(icon ? { icon } : {}) },
        });
        return NextResponse.json(category);
    } catch {
        return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if any assets belong to this category
    const assetCount = await prisma.asset.count({ where: { categoryId: id } });
    if (assetCount > 0) {
        return NextResponse.json(
            { error: `Không thể xoá: còn ${assetCount} thiết bị trong danh mục này` },
            { status: 409 }
        );
    }

    try {
        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    }
}
