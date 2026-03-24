"use client";

import { useState } from "react";
import { FileText, Download, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ReportsPage() {
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split("T")[0];
    });
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    async function fetchReport() {
        setLoading(true);
        const [bookingsRes, logsRes] = await Promise.all([
            fetch(`/api/bookings?limit=500`).then((r) => r.json()),
            fetch(`/api/inventory-logs?limit=500`).then((r) => r.json()),
        ]);
        const bookings = (bookingsRes.bookings ?? []).filter((b: any) => {
            const d = new Date(b.borrowDate);
            return d >= new Date(fromDate) && d <= new Date(toDate);
        });
        const logs = (logsRes.logs ?? []).filter((l: any) => {
            const d = new Date(l.createdAt);
            return d >= new Date(fromDate) && d <= new Date(toDate);
        });
        setReportData({ bookings, logs });
        setLoading(false);
        toast.success(`Đã tải ${bookings.length} phiếu mượn, ${logs.length} lượt nhật ký`);
    }

    function exportExcel() {
        if (!reportData) { toast.error("Chưa có dữ liệu, nhấn 'Tải báo cáo' trước"); return; }

        const wb = XLSX.utils.book_new();

        // Sheet 1: Bookings
        const bookingRows = reportData.bookings.map((b: any) => ({
            "Mã phiếu": b.id,
            "Giáo viên": b.user?.name,
            "Email": b.user?.email,
            "Bộ môn": b.user?.department ?? "",
            "Thiết bị": b.asset?.name,
            "Danh mục": b.asset?.category?.name ?? "",
            "Số lượng": b.quantity,
            "Đơn vị": b.asset?.unit ?? "",
            "Ngày mượn": new Date(b.borrowDate).toLocaleDateString("vi-VN"),
            "Ngày trả": new Date(b.returnDate).toLocaleDateString("vi-VN"),
            "Mục đích": b.purpose ?? "",
            "Trạng thái": { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", RETURNED: "Đã trả", CANCELLED: "Đã huỷ" }[b.status as string] ?? b.status,
            "Ngày tạo": new Date(b.createdAt).toLocaleDateString("vi-VN"),
        }));

        const ws1 = XLSX.utils.json_to_sheet(bookingRows);
        ws1["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Phiếu mượn");

        // Sheet 2: Inventory logs
        const logRows = reportData.logs.map((l: any) => ({
            "Mã log": l.id,
            "Thiết bị": l.asset?.name,
            "Hành động": { IMPORT: "Nhập kho", EXPORT: "Xuất kho", DAMAGE: "Hư hỏng", REPAIR: "Sửa chữa", ADJUST: "Điều chỉnh" }[l.action as string] ?? l.action,
            "Số lượng thay đổi": l.quantityChanged,
            "Ghi chú": l.note ?? "",
            "Người thực hiện": l.createdBy?.name,
            "Ngày": new Date(l.createdAt).toLocaleDateString("vi-VN"),
        }));

        const ws2 = XLSX.utils.json_to_sheet(logRows);
        XLSX.utils.book_append_sheet(wb, ws2, "Nhật ký kho");

        const fileName = `QLTB_BaoCao_${fromDate}_${toDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success(`Đã xuất file ${fileName}`);
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Báo cáo</h1>
                <p className="text-slate-400 text-sm mt-1">Xuất báo cáo phiếu mượn và nhật ký kho theo khoảng thời gian</p>
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-400" />
                        Chọn khoảng thời gian
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Từ ngày</Label>
                            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Đến ngày</Label>
                            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button onClick={fetchReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <FileText className="w-4 h-4" />
                            {loading ? "Đang tải..." : "Tải báo cáo"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={exportExcel}
                            disabled={!reportData}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Xuất Excel (.xlsx)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="pt-5">
                            <p className="text-3xl font-bold text-blue-400">{reportData.bookings.length}</p>
                            <p className="text-slate-400 text-sm mt-1">Phiếu mượn trong kỳ</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="pt-5">
                            <p className="text-3xl font-bold text-emerald-400">{reportData.logs.length}</p>
                            <p className="text-slate-400 text-sm mt-1">Lượt nhật ký kho</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
