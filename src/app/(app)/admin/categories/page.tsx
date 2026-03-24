"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: "", description: "", color: "#3B82F6" });
    const [saving, setSaving] = useState(false);

    async function fetchCategories() {
        setLoading(true);
        const res = await fetch("/api/categories");
        if (res.ok) {
            const data = await res.json();
            setCategories(data);
        }
        setLoading(false);
    }

    useEffect(() => { fetchCategories(); }, []);

    function openCreate() {
        setEditing(null);
        setForm({ name: "", description: "", color: "#3B82F6" });
        setDialogOpen(true);
    }

    function openEdit(cat: any) {
        setEditing(cat);
        setForm({ name: cat.name, description: cat.description ?? "", color: cat.color ?? "#3B82F6" });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim()) { toast.error("Tên danh mục không được để trống"); return; }
        setSaving(true);

        const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
        const method = editing ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            toast.success(editing ? "Đã cập nhật danh mục" : "Đã thêm danh mục mới");
            setDialogOpen(false);
            fetchCategories();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Có lỗi xảy ra");
        }
        setSaving(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xoá danh mục "${name}"? Thao tác này sẽ thất bại nếu còn thiết bị thuộc danh mục này.`)) return;
        const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        if (res.ok) { toast.success("Đã xoá danh mục"); fetchCategories(); }
        else { const d = await res.json(); toast.error(d.error ?? "Không thể xoá danh mục này"); }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Danh mục Thiết bị</h1>
                    <p className="text-slate-400 text-sm mt-1">Quản lý các nhóm phân loại thiết bị</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Thêm danh mục
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />)}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-20">
                    <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Chưa có danh mục nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <Card key={cat.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: (cat.color ?? "#3B82F6") + "22", border: `1px solid ${cat.color ?? "#3B82F6"}44` }}
                                        >
                                            <Tag className="w-5 h-5" style={{ color: cat.color ?? "#3B82F6" }} />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{cat.name}</p>
                                            {cat.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{cat.description}</p>}
                                            <p className="text-slate-500 text-xs mt-0.5">{cat._count?.assets ?? 0} thiết bị</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => openEdit(cat)}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => handleDelete(cat.id, cat.name)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tên danh mục *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Thiết bị điện tử, Hóa chất thí nghiệm..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Màu đại diện</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                                />
                                <Input
                                    value={form.color}
                                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white font-mono"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Mô tả</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white resize-none"
                                rows={2}
                                placeholder="Mô tả ngắn về nhóm thiết bị..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => setDialogOpen(false)}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
