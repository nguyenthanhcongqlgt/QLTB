"use client";

import { useEffect, useState } from "react";
import { ScrollText, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    async function fetchBookings() {
        setLoading(true);
        const params = new URLSearchParams({ limit: "50" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/bookings?${params}`);
        const data = await res.json();
        setBookings(data.bookings ?? []);
        setLoading(false);
    }

    useEffect(() => { fetchBookings(); }, [statusFilter]);

    async function handleAction(id: string, status: "APPROVED" | "REJECTED" | "RETURNED") {
        const res = await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            const labels: Record<string, string> = { APPROVED: "Đã duyệt", REJECTED: "Đã từ chối", RETURNED: "Đã ghi nhận trả" };
            toast.success(labels[status]);
            fetchBookings();
        } else {
            toast.error("Có lỗi xảy ra");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý Phiếu mượn</h1>
                    <p className="text-slate-400 text-sm mt-1">Xem, phê duyệt và quản lý tất cả phiếu mượn</p>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Lọc trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                            <SelectItem value="RETURNED">Đã trả</SelectItem>
                            <SelectItem value="REJECTED">Từ chối</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="border-white/10 text-slate-300" onClick={fetchBookings}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 bg-white/5 rounded-xl" />)}
                </div>
            ) : (
                <div className="rounded-xl border border-white/10 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-slate-400">Giáo viên</TableHead>
                                <TableHead className="text-slate-400">Thiết bị</TableHead>
                                <TableHead className="text-slate-400">SL</TableHead>
                                <TableHead className="text-slate-400">Ngày mượn</TableHead>
                                <TableHead className="text-slate-400">Ngày trả</TableHead>
                                <TableHead className="text-slate-400">Bài dạy & Mục đích</TableHead>
                                <TableHead className="text-slate-400">Trạng thái</TableHead>
                                <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-slate-400 py-10">
                                        <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                        Không có phiếu nào
                                    </TableCell>
                                </TableRow>
                            ) : bookings.map((b) => {
                                const sc = STATUS_CONFIG[b.status] ?? { label: b.status, class: "" };
                                return (
                                    <TableRow key={b.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <p className="text-white text-sm font-medium">{b.user?.name}</p>
                                            <p className="text-slate-400 text-xs">{b.user?.email}</p>
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">{b.asset?.name}</TableCell>
                                        <TableCell className="text-white">{b.quantity} {b.asset?.unit}</TableCell>
                                        <TableCell className="text-slate-300 text-sm">{new Date(b.borrowDate).toLocaleDateString("vi-VN")}</TableCell>
                                        <TableCell className="text-slate-300 text-sm">{new Date(b.returnDate).toLocaleDateString("vi-VN")}</TableCell>
                                        <TableCell>
                                            <p className="text-slate-300 text-sm">{b.lesson ? `Tiết ${b.lesson}` : ""} {b.lessonName ? `- ${b.lessonName}` : ""}</p>
                                            <p className="text-slate-500 text-xs max-w-[150px] truncate">{b.purpose}</p>
                                        </TableCell>
                                        <TableCell><Badge className={`text-xs border ${sc.class}`}>{sc.label}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                {b.status === "PENDING" && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleAction(b.id, "APPROVED")} title="Duyệt">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleAction(b.id, "REJECTED")} title="Từ chối">
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {b.status === "APPROVED" && (
                                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400 hover:text-white text-xs" onClick={() => handleAction(b.id, "RETURNED")}>
                                                        Ghi nhận trả
                                                    </Button>
                                                )}
                                            </div>
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
