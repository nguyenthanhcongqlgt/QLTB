import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
        totalAssets,
        availableAssets,
        damagedAssets,
        pendingBookings,
        approvedBookings,
        totalBookings,
        categoriesCount,
        recentBookings,
        topAssets,
    ] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { status: "AVAILABLE" } }),
        prisma.asset.count({ where: { status: "DAMAGED" } }),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "APPROVED" } }),
        prisma.booking.count(),
        prisma.category.count(),
        // Recent 5 bookings
        prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                asset: { select: { name: true, unit: true } },
            },
        }),
        // Top 5 most borrowed assets
        prisma.booking.groupBy({
            by: ["assetId"],
            _count: { assetId: true },
            _sum: { quantity: true },
            orderBy: { _count: { assetId: "desc" } },
            take: 5,
        }),
    ]);

    // Fetch asset names for top assets
    const topAssetDetails = await prisma.asset.findMany({
        where: { id: { in: topAssets.map((a) => a.assetId) } },
        select: { id: true, name: true, unit: true },
    });

    const topAssetsWithNames = topAssets.map((a) => ({
        ...a,
        asset: topAssetDetails.find((d) => d.id === a.assetId),
    }));

    return NextResponse.json({
        totalAssets,
        availableAssets,
        damagedAssets,
        pendingBookings,
        approvedBookings,
        totalBookings,
        categoriesCount,
        recentBookings,
        topAssets: topAssetsWithNames,
    });
}
