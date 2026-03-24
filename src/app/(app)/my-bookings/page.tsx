"use client";

import { useEffect, useState } from "react";
import { BookMarked, RefreshCw } from "lucide-react";
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

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchBookings() {
        setLoading(true);
        const res = await fetch("/api/bookings");
        const data = await res.json();
        setBookings(data.bookings ?? []);
        setLoading(false);
    }

    useEffect(() => { fetchBookings(); }, []);

    async function cancelBooking(id: string) {
        const res = await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
        });
        if (res.ok) {
            toast.success("Đã huỷ phiếu mượn");
            fetchBookings();
        } else {
            toast.error("Không thể huỷ phiếu này");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Phiếu của tôi</h1>
                    <p className="text-slate-400 text-sm mt-1">Lịch sử và trạng thái các phiếu đặt mượn</p>
                </div>
                <Button variant="outline" size="sm" className="border-white/10 text-slate-300" onClick={fetchBookings}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm mới
                </Button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-20">
                    <BookMarked className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Bạn chưa có phiếu mượn nào</p>
                </div>
            ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-slate-400">Thiết bị</TableHead>
                                <TableHead className="text-slate-400">SL</TableHead>
                                <TableHead className="text-slate-400">Tiết - Bài dạy</TableHead>
                                <TableHead className="text-slate-400">Ngày mượn</TableHead>
                                <TableHead className="text-slate-400">Ngày trả</TableHead>
                                <TableHead className="text-slate-400">Trạng thái</TableHead>
                                <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((b) => {
                                const statusCfg = STATUS_CONFIG[b.status] ?? { label: b.status, class: "" };
                                return (
                                    <TableRow key={b.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <p className="text-white font-medium text-sm">{b.asset?.name}</p>
                                            <p className="text-slate-400 text-xs">{b.asset?.category?.name}</p>
                                        </TableCell>
                                        <TableCell className="text-white">{b.quantity} {b.asset?.unit}</TableCell>
                                        <TableCell>
                                            <p className="text-slate-300 text-sm">{b.lesson ? `Tiết ${b.lesson}` : ""} - {b.lessonName}</p>
                                            <p className="text-slate-500 text-xs max-w-[150px] truncate">{b.purpose}</p>
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">
                                            {new Date(b.borrowDate).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">
                                            {new Date(b.returnDate).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs border ${statusCfg.class}`}>{statusCfg.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {b.status === "PENDING" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                                    onClick={() => cancelBooking(b.id)}
                                                >
                                                    Huỷ
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
