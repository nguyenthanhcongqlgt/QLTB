"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    AVAILABLE: { label: "Còn hàng", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    LOW_STOCK: { label: "Sắp hết", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    OUT_OF_STOCK: { label: "Hết hàng", class: "bg-red-500/20 text-red-400 border-red-500/30" },
    DAMAGED: { label: "Hỏng", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

export default function AdminAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: "", description: "", categoryId: "", totalQuantity: "", unit: "cái" });
    const [saving, setSaving] = useState(false);

    async function fetchAll() {
        setLoading(true);
        const [a, c] = await Promise.all([
            fetch("/api/assets?limit=100").then((r) => r.json()),
            fetch("/api/categories").then((r) => r.json()),
        ]);
        setAssets(a.assets ?? []);
        setCategories(c ?? []);
        setLoading(false);
    }

    useEffect(() => { fetchAll(); }, []);

    function openCreate() {
        setEditing(null);
        setForm({ name: "", description: "", categoryId: "", totalQuantity: "", unit: "cái" });
        setDialogOpen(true);
    }

    function openEdit(asset: any) {
        setEditing(asset);
        setForm({
            name: asset.name,
            description: asset.description ?? "",
            categoryId: asset.categoryId,
            totalQuantity: String(asset.totalQuantity),
            unit: asset.unit,
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.name || !form.categoryId || !form.totalQuantity) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }
        setSaving(true);
        const url = editing ? `/api/assets/${editing.id}` : "/api/assets";
        const method = editing ? "PATCH" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, totalQuantity: Number(form.totalQuantity) }),
        });
        if (res.ok) {
            toast.success(editing ? "Đã cập nhật thiết bị" : "Đã thêm thiết bị mới");
            setDialogOpen(false);
            fetchAll();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Có lỗi xảy ra");
        }
        setSaving(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xoá thiết bị "${name}"?`)) return;
        const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
        if (res.ok) { toast.success("Đã xoá"); fetchAll(); }
        else toast.error("Không thể xoá thiết bị này");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý Thiết bị</h1>
                    <p className="text-slate-400 text-sm mt-1">Thêm, sửa, xoá thiết bị trong hệ thống</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Thêm thiết bị
                </Button>
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 bg-white/5 rounded-lg" />)}
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Chưa có thiết bị nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Tên thiết bị</TableHead>
                                        <TableHead className="text-slate-400">Danh mục</TableHead>
                                        <TableHead className="text-slate-400">Tổng SL</TableHead>
                                        <TableHead className="text-slate-400">Còn lại</TableHead>
                                        <TableHead className="text-slate-400">Trạng thái</TableHead>
                                        <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.map((a) => {
                                        const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.AVAILABLE;
                                        return (
                                            <TableRow key={a.id} className="border-white/5 hover:bg-white/5">
                                                <TableCell>
                                                    <p className="text-white font-medium text-sm">{a.name}</p>
                                                    {a.description && <p className="text-slate-400 text-xs truncate max-w-[200px]">{a.description}</p>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs border-white/10 text-slate-300">{a.category?.name}</Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-300">{a.totalQuantity} {a.unit}</TableCell>
                                                <TableCell className="text-white font-medium">{a.availableQuantity} {a.unit}</TableCell>
                                                <TableCell><Badge className={`text-xs border ${sc.class}`}>{sc.label}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(a)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleDelete(a.id, a.name)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
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

            {/* Create/Edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tên thiết bị *</Label>
                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Đồng hồ vạn năng..." />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Danh mục *</Label>
                            <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Số lượng *</Label>
                                <Input type="number" min={0} value={form.totalQuantity} onChange={(e) => setForm((f) => ({ ...f, totalQuantity: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Đơn vị</Label>
                                <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="cái, bộ, chiếc..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Mô tả</Label>
                            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-white/5 border-white/10 text-white resize-none" rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => setDialogOpen(false)}>Huỷ</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
