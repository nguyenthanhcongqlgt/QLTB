import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assets
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [assets, total] = await Promise.all([
        prisma.asset.findMany({
            where,
            include: { category: true },
            orderBy: { name: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.asset.count({ where }),
    ]);

    return NextResponse.json({ assets, total, page, limit });
}

// POST /api/assets — admin only
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role === "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, categoryId, totalQuantity, unit, imageUrl } = body;

    if (!name || !categoryId || totalQuantity == null) {
        return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const asset = await prisma.asset.create({
        data: {
            name,
            description,
            categoryId,
            totalQuantity: Number(totalQuantity),
            availableQuantity: Number(totalQuantity),
            unit: unit ?? "cái",
            imageUrl,
        },
        include: { category: true },
    });

    // Create import log
    await prisma.inventoryLog.create({
        data: {
            assetId: asset.id,
            action: "IMPORT",
            quantityChanged: asset.totalQuantity,
            note: "Nhập kho lần đầu",
            createdById: session.user.id,
        },
    });

    return NextResponse.json(asset, { status: 201 });
}
