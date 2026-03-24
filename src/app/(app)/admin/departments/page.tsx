"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function DepartmentsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    async function fetchDepartments() {
        setLoading(true);
        const res = await fetch("/api/departments");
        if (res.ok) {
            const data = await res.json();
            setDepartments(data);
        }
        setLoading(false);
    }

    useEffect(() => { fetchDepartments(); }, []);

    function openCreate() {
        setEditing(null);
        setName("");
        setDialogOpen(true);
    }

    function openEdit(d: any) {
        setEditing(d);
        setName(d.name);
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!name.trim()) {
            toast.error("Tên tổ chuyên môn không được để trống");
            return;
        }

        setSaving(true);
        const url = editing ? `/api/departments/${editing.id}` : "/api/departments";
        const method = editing ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });

        if (res.ok) {
            toast.success(editing ? "Cập nhật thành công" : "Đã tạo tổ chuyên môn");
            setDialogOpen(false);
            fetchDepartments();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Có lỗi xảy ra");
        }
        setSaving(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xoá tổ chuyên môn "${name}"?`)) return;
        const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Đã xoá thành công");
            fetchDepartments();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Lỗi xoá dữ liệu");
        }
    }

    if (!isAdmin && session) return null;

    return (
        <div className="space-y-6 flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tổ chuyên môn</h1>
                    <p className="text-slate-400 text-sm mt-1">Quản lý danh sách các phòng, tổ bộ môn</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Thêm Tổ CM
                </Button>
            </div>

            <div className="w-full max-w-4xl">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/5 rounded-2xl" />)}
                    </div>
                ) : departments.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Chưa có tổ chuyên môn nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {departments.map((d) => (
                            <Card key={d.id} className="bg-white/5 border-white/10 flex items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                                        <Building2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-white font-medium">{d.name}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(d)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleDelete(d.id, d.name)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Đổi tên Tổ chuyên môn" : "Thêm Tổ chuyên môn mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tên tổ chuyên môn *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10"
                                placeholder="Ví dụ: Tổ Toán - Tin"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-slate-300 bg-transparent hover:bg-white/5" onClick={() => setDialogOpen(false)}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? "Đang lưu..." : "Lưu lại"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
