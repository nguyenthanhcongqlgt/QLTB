"use client";

import { useEffect, useState } from "react";
import { Package, ScrollText, AlertTriangle, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    PENDING: { label: "Chờ duyệt", class: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    APPROVED: { label: "Đã duyệt", class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    REJECTED: { label: "Từ chối", class: "bg-red-500/20 text-red-300 border-red-500/30" },
    RETURNED: { label: "Đã trả", class: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
    CANCELLED: { label: "Đã huỷ", class: "bg-slate-600/20 text-slate-400 border-slate-600/30" },
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchAll() {
        setLoading(true);
        const [statsRes, bookingsRes] = await Promise.all([
            fetch("/api/dashboard/stats"),
            fetch("/api/bookings?status=PENDING&limit=10"),
        ]);
        const [statsData, bookingsData] = await Promise.all([statsRes.json(), bookingsRes.json()]);
        setStats(statsData);
        setPendingBookings(bookingsData.bookings ?? []);
        setLoading(false);
    }

    useEffect(() => { fetchAll(); }, []);

    async function handleBookingAction(id: string, status: "APPROVED" | "REJECTED") {
        const res = await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            toast.success(status === "APPROVED" ? "Đã phê duyệt phiếu mượn" : "Đã từ chối phiếu mượn");
            fetchAll();
        } else {
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        }
    }

    const statCards = [
        { label: "Tổng thiết bị", value: stats?.totalAssets, icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Phiếu chờ duyệt", value: stats?.pendingBookings, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", highlight: true },
        { label: "Đang mượn", value: stats?.approvedBookings, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Thiết bị hỏng", value: stats?.damagedAssets, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
                <p className="text-slate-400 text-sm mt-1">Quản trị hệ thống thiết bị trường học</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 bg-white/5 rounded-2xl" />)
                    : statCards.map(({ label, value, icon: Icon, color, bg, highlight }) => (
                        <Card key={label} className={`border-white/10 ${highlight && value > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5"}`}>
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    {highlight && value > 0 && (
                                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <p className={`text-3xl font-bold ${color}`}>{value ?? "—"}</p>
                                <p className="text-slate-400 text-xs mt-1">{label}</p>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* Pending approvals */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-amber-400" />
                        Phiếu chờ duyệt
                        {pendingBookings.length > 0 && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 ml-2">{pendingBookings.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 bg-white/5 rounded-lg" />)}
                        </div>
                    ) : pendingBookings.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">Không có phiếu chờ duyệt</p>
                    ) : (
                        <div className="rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Giáo viên</TableHead>
                                        <TableHead className="text-slate-400">Thiết bị</TableHead>
                                        <TableHead className="text-slate-400">SL</TableHead>
                                        <TableHead className="text-slate-400">Ngày mượn</TableHead>
                                        <TableHead className="text-slate-400">Ngày trả</TableHead>
                                        <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingBookings.map((b) => (
                                        <TableRow key={b.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell>
                                                <p className="text-white text-sm font-medium">{b.user?.name}</p>
                                                <p className="text-slate-400 text-xs">{b.user?.department}</p>
                                            </TableCell>
                                            <TableCell className="text-slate-300 text-sm">{b.asset?.name}</TableCell>
                                            <TableCell className="text-white">{b.quantity} {b.asset?.unit}</TableCell>
                                            <TableCell className="text-slate-300 text-sm">{new Date(b.borrowDate).toLocaleDateString("vi-VN")}</TableCell>
                                            <TableCell className="text-slate-300 text-sm">{new Date(b.returnDate).toLocaleDateString("vi-VN")}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs"
                                                        onClick={() => handleBookingAction(b.id, "APPROVED")}
                                                    >
                                                        Duyệt
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs"
                                                        onClick={() => handleBookingAction(b.id, "REJECTED")}
                                                    >
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top borrowed assets */}
            {stats?.topAssets?.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            Thiết bị được mượn nhiều nhất
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topAssets.map((item: any, idx: number) => (
                                <div key={item.assetId} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">{item.asset?.name ?? item.assetId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-400 text-sm font-bold">{item._count.assetId} lượt</p>
                                        <p className="text-slate-400 text-xs">{item._sum?.quantity ?? 0} {item.asset?.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
