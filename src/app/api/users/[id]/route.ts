import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    // Only ADMIN can edit users (or user editing themselves, but let's stick to ADMIN for now)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, department, password } = body;

    try {
        const data: any = {};
        if (name) data.name = name;
        if (role) data.role = role;
        if (department !== undefined) data.department = department; // can be null
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, role: true, department: true }
        });

        return NextResponse.json(user);
    } catch {
        return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.user.id) {
        return NextResponse.json({ error: "Không thể tự xoá tài khoản của mình" }, { status: 400 });
    }

    // Check if user has bookings or inventory logs
    const [bookingCount, logCount] = await Promise.all([
        prisma.booking.count({ where: { userId: id } }),
        prisma.inventoryLog.count({ where: { createdById: id } })
    ]);

    if (bookingCount > 0 || logCount > 0) {
        return NextResponse.json(
            { error: `Không thể xoá vì tài khoản này đã có ${bookingCount} phiếu mượn và ${logCount} tác vụ kho.` },
            { status: 409 }
        );
    }

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
}
