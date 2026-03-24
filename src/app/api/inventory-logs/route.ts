import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("assetId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");

    const where = assetId ? { assetId } : {};

    const [logs, total] = await Promise.all([
        prisma.inventoryLog.findMany({
            where,
            include: {
                asset: { select: { name: true, unit: true } },
                createdBy: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.inventoryLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { assetId, action, quantityChanged, note } = body;

    if (!assetId || !action || quantityChanged == null) {
        return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        const log = await tx.inventoryLog.create({
            data: {
                assetId,
                action,
                quantityChanged: Number(quantityChanged),
                note,
                createdById: session.user.id,
            },
        });

        // Update quantities based on action
        const delta = Number(quantityChanged);
        if (action === "IMPORT" || action === "REPAIR") {
            await tx.asset.update({
                where: { id: assetId },
                data: {
                    totalQuantity: { increment: delta },
                    availableQuantity: { increment: delta },
                },
            });
        } else if (action === "DAMAGE") {
            await tx.asset.update({
                where: { id: assetId },
                data: {
                    availableQuantity: { decrement: Math.abs(delta) },
                    status: "DAMAGED",
                },
            });
        } else if (action === "ADJUST") {
            await tx.asset.update({
                where: { id: assetId },
                data: {
                    totalQuantity: { increment: delta },
                    availableQuantity: { increment: delta },
                },
            });
        }

        return log;
    });

    return NextResponse.json(result, { status: 201 });
}
