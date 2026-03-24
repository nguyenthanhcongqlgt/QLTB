import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookings/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            asset: { include: { category: true } },
        },
    });

    if (!booking) return NextResponse.json({ error: "Không tìm thấy phiếu mượn" }, { status: 404 });

    if (session.user.role === "TEACHER" && booking.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
}

// PATCH /api/bookings/[id] — approve/reject/return/cancel
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status, note } = body;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { asset: true, user: true },
    });

    if (!booking) return NextResponse.json({ error: "Không tìm thấy phiếu mượn" }, { status: 404 });

    const isAdminOrPrincipal = ["ADMIN", "PRINCIPAL"].includes(session.user.role);
    const isOwner = booking.userId === session.user.id;

    if (!isAdminOrPrincipal && !isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isAdminOrPrincipal && status !== "CANCELLED") {
        return NextResponse.json({ error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await prisma.$transaction(async (tx: any) => {
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: { status, note: note ?? booking.note },
            });

            if (["REJECTED", "RETURNED", "CANCELLED"].includes(status) &&
                !["REJECTED", "RETURNED", "CANCELLED"].includes(booking.status)) {
                await tx.asset.update({
                    where: { id: booking.assetId },
                    data: {
                        availableQuantity: { increment: booking.quantity },
                        status: "AVAILABLE",
                    },
                });

                await tx.inventoryLog.create({
                    data: {
                        assetId: booking.assetId,
                        action: "IMPORT",
                        quantityChanged: booking.quantity,
                        note: `Hoàn trả phiếu #${id} — ${status}`,
                        createdById: session.user.id,
                    },
                });
            }

            return updatedBooking;
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH /api/bookings/[id]]", err);
        return NextResponse.json({ error: "Hệ thống đang bận, vui lòng thử lại sau." }, { status: 500 });
    }
}
