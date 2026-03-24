import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookings — list bookings (admin sees all, teacher sees own)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where =
        session.user.role === "TEACHER"
            ? { userId: session.user.id, ...(status ? { status: status as any } : {}) }
            : { ...(status ? { status: status as any } : {}) };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, department: true } },
                asset: { include: { category: { select: { name: true, color: true } } } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, limit });
}

// POST /api/bookings — create booking with SELECT FOR UPDATE to prevent over-booking
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { assetId, quantity, borrowDate, returnDate, purpose, note, lesson, lessonName } = body;

    if (!assetId || !quantity || !borrowDate || !returnDate || !lesson || !lessonName) {
        return NextResponse.json({ error: "Thiếu thông tin bắt buộc (cần có Tiết PPCT và Tên bài)" }, { status: 400 });
    }

    if (quantity < 1) {
        return NextResponse.json({ error: "Số lượng không hợp lệ" }, { status: 400 });
    }

    const borrow = new Date(borrowDate);
    const returnD = new Date(returnDate);
    if (returnD <= borrow) {
        return NextResponse.json({ error: "Ngày trả phải sau ngày mượn" }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Lock the asset row to prevent race conditions
            const asset = await tx.$queryRaw<{ id: string; availableQuantity: number; name: string }[]>`
        SELECT id, "availableQuantity", name
        FROM "Asset"
        WHERE id = ${assetId}
        FOR UPDATE
      `;

            if (!asset[0]) {
                throw new Error("ASSET_NOT_FOUND");
            }

            if (asset[0].availableQuantity < quantity) {
                throw new Error(`INSUFFICIENT_QUANTITY:${asset[0].availableQuantity}`);
            }

            // Create booking
            const booking = await tx.booking.create({
                data: {
                    userId: session.user.id,
                    assetId,
                    quantity,
                    borrowDate: borrow,
                    returnDate: returnD,
                    status: "PENDING",
                    purpose,
                    lesson,
                    lessonName,
                    note,
                } as any,
                include: {
                    asset: { select: { name: true } },
                },
            });

            // Deduct available quantity
            await tx.asset.update({
                where: { id: assetId },
                data: {
                    availableQuantity: { decrement: quantity },
                    status: asset[0].availableQuantity - quantity <= 0 ? "OUT_OF_STOCK"
                        : asset[0].availableQuantity - quantity <= 3 ? "LOW_STOCK"
                            : "AVAILABLE",
                },
            });

            // Log the action
            await tx.inventoryLog.create({
                data: {
                    assetId,
                    action: "EXPORT",
                    quantityChanged: -quantity,
                    note: `Phiếu mượn #${booking.id} — ${purpose ?? ""}`,
                    createdById: session.user.id,
                },
            });

            return booking;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        if (err.message === "ASSET_NOT_FOUND") {
            return NextResponse.json({ error: "Thiết bị không tồn tại" }, { status: 404 });
        }
        if (err.message?.startsWith("INSUFFICIENT_QUANTITY")) {
            const available = err.message.split(":")[1];
            return NextResponse.json(
                { error: `Không đủ số lượng. Hiện còn ${available} thiết bị.` },
                { status: 409 }
            );
        }
        console.error("[POST /api/bookings]", err);
        return NextResponse.json({ error: "Hệ thống đang bận, vui lòng thử lại sau." }, { status: 500 });
    }
}
