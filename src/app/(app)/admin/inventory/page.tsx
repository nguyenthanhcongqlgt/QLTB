"use client";

import { useEffect, useState } from "react";
import { Plus, PackagePlus, Wrench, AlertOctagon, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ACTION_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
    IMPORT: { label: "Nhập kho", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: PackagePlus },
    EXPORT: { label: "Xuất kho", class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Plus },
    DAMAGE: { label: "Hư hỏng", class: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertOctagon },
    REPAIR: { label: "Sửa chữa", class: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Wrench },
    ADJUST: { label: "Điều chỉnh", class: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: SlidersHorizontal },
};

export default function InventoryPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ assetId: "", action: "IMPORT", quantityChanged: "", note: "" });

    async function fetchAll() {
        setLoading(true);
        const [logsRes, assetsRes] = await Promise.all([
            fetch("/api/inventory-logs?limit=100").then((r) => r.json()),
            fetch("/api/assets?limit=200").then((r) => r.json()),
        ]);
        setLogs(logsRes.logs ?? []);
        setAssets(assetsRes.assets ?? []);
        setLoading(false);
    }

    useEffect(() => { fetchAll(); }, []);

    async function handleSave() {
        if (!form.assetId || !form.action || !form.quantityChanged) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }
        if (Number(form.quantityChanged) <= 0) {
            toast.error("Số lượng phải lớn hơn 0");
            return;
        }
        setSaving(true);
        const res = await fetch("/api/inventory-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                assetId: form.assetId,
                action: form.action,
                quantityChanged: Number(form.quantityChanged),
                note: form.note,
            }),
        });

        if (res.ok) {
            toast.success("Đã ghi nhận vào nhật ký kho");
            setDialogOpen(false);
            setForm({ assetId: "", action: "IMPORT", quantityChanged: "", note: "" });
            fetchAll();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Có lỗi xảy ra");
        }
        setSaving(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Nhật ký Kho</h1>
                    <p className="text-slate-400 text-sm mt-1">Lịch sử nhập kho, xuất kho, hư hỏng và sửa chữa thiết bị</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="border-white/10 text-slate-300" onClick={fetchAll}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="w-4 h-4" /> Ghi nhận mới
                    </Button>
                </div>
            </div>

            {/* Summary cards */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
                        const count = logs.filter((l) => l.action === key).length;
                        const Icon = cfg.icon;
                        return (
                            <Card key={key} className="bg-white/5 border-white/10">
                                <CardContent className="pt-4 pb-3 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.class.split(" ").slice(0, 1).join(" ")}`}>
                                        <Icon className={`w-4 h-4 ${cfg.class.split(" ")[1]}`} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg leading-none">{count}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{cfg.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white text-base">Lịch sử hoạt động</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 bg-white/5 rounded-lg" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16">
                            <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Chưa có dữ liệu nhật ký</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Thời gian</TableHead>
                                        <TableHead className="text-slate-400">Thiết bị</TableHead>
                                        <TableHead className="text-slate-400">Hành động</TableHead>
                                        <TableHead className="text-slate-400">Số lượng</TableHead>
                                        <TableHead className="text-slate-400">Ghi chú</TableHead>
                                        <TableHead className="text-slate-400">Người thực hiện</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => {
                                        const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.ADJUST;
                                        const isPositive = log.action === "IMPORT" || log.action === "REPAIR" || (log.action === "ADJUST" && log.quantityChanged > 0);
                                        return (
                                            <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                                                <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-white text-sm font-medium">{log.asset?.name}</p>
                                                    <p className="text-slate-500 text-xs">{log.asset?.unit}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs border ${cfg.class}`}>
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`font-bold text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                                        {isPositive ? "+" : ""}{log.quantityChanged}
                                                    </span>
                                                    <span className="text-slate-500 text-xs ml-1">{log.asset?.unit}</span>
                                                </TableCell>
                                                <TableCell className="text-slate-400 text-xs max-w-[180px] truncate">
                                                    {log.note || "—"}
                                                </TableCell>
                                                <TableCell className="text-slate-300 text-sm">
                                                    {log.createdBy?.name}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create log dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Ghi nhận hoạt động kho</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Thiết bị *</Label>
                            <Select value={form.assetId} onValueChange={(v) => setForm((f) => ({ ...f, assetId: v }))}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Chọn thiết bị" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {assets.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name} <span className="text-slate-400 text-xs ml-1">({a.availableQuantity} {a.unit} sẵn)</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Hành động *</Label>
                            <Select value={form.action} onValueChange={(v) => setForm((f) => ({ ...f, action: v }))}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ACTION_CONFIG).filter(([k]) => k !== "EXPORT").map(([key, cfg]) => (
                                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Số lượng *</Label>
                            <Input
                                type="number"
                                min={1}
                                value={form.quantityChanged}
                                onChange={(e) => setForm((f) => ({ ...f, quantityChanged: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Nhập số lượng..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Ghi chú</Label>
                            <Textarea
                                value={form.note}
                                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white resize-none"
                                rows={2}
                                placeholder="Lý do nhập/xuất kho, tình trạng thiết bị..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => setDialogOpen(false)}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? "Đang lưu..." : "Ghi nhận"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
