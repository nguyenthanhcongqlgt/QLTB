import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const asset = await prisma.asset.findUnique({
        where: { id },
        include: {
            category: true,
            inventoryLogs: {
                include: { createdBy: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });

    if (!asset) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json(asset);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, categoryId, totalQuantity, unit, status, imageUrl } = body;

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    const qtyDiff = totalQuantity != null ? Number(totalQuantity) - existing.totalQuantity : 0;

    const updated = await prisma.asset.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(categoryId && { categoryId }),
            ...(totalQuantity != null && {
                totalQuantity: Number(totalQuantity),
                availableQuantity: existing.availableQuantity + qtyDiff,
            }),
            ...(unit && { unit }),
            ...(status && { status }),
            ...(imageUrl !== undefined && { imageUrl }),
        },
        include: { category: true },
    });

    if (qtyDiff !== 0) {
        await prisma.inventoryLog.create({
            data: {
                assetId: id,
                action: qtyDiff > 0 ? "IMPORT" : "ADJUST",
                quantityChanged: qtyDiff,
                note: "Cập nhật số lượng",
                createdById: session.user.id,
            },
        });
    }

    return NextResponse.json(updated);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
