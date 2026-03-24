"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function UsersPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "TEACHER", department: "" });
    const [saving, setSaving] = useState(false);

    async function fetchUsers() {
        setLoading(true);
        const res = await fetch("/api/users");
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        }
        setLoading(false);
    }

    async function fetchDepartments() {
        const res = await fetch("/api/departments");
        if (res.ok) {
            const data = await res.json();
            setDepartments(data);
        }
    }

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    function openCreate() {
        setEditing(null);
        setForm({ name: "", email: "", password: "", role: "TEACHER", department: "" });
        setDialogOpen(true);
    }

    function openEdit(u: any) {
        setEditing(u);
        setForm({ name: u.name, email: u.email, password: "", role: u.role, department: u.department ?? "" });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.email.trim()) {
            toast.error("Tên và Email không được để trống");
            return;
        }
        if (!editing && !form.password) {
            toast.error("Bắt buộc tạo mật khẩu cho tài khoản mới");
            return;
        }

        setSaving(true);
        const url = editing ? `/api/users/${editing.id}` : "/api/users";
        const method = editing ? "PATCH" : "POST";

        const submitData = { ...form, department: form.department === "none" ? "" : form.department };

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData),
        });

        if (res.ok) {
            toast.success(editing ? "Cập nhật thành công" : "Đã tạo tài khoản mới");
            setDialogOpen(false);
            fetchUsers();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Có lỗi xảy ra");
        }
        setSaving(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Xoá tài khoản "${name}"? Thao tác này sẽ thất bại nếu người dùng này từng hoạt động.`)) return;
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Đã xoá tài khoản");
            fetchUsers();
        } else {
            const d = await res.json();
            toast.error(d.error ?? "Lỗi xoá dữ liệu");
        }
    }

    if (!isAdmin && session) {
        return (
            <div className="text-center py-20 text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p>Bạn không có quyền quản lý tài khoản</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý Nhân sự</h1>
                    <p className="text-slate-400 text-sm mt-1">Danh sách tài khoản giáo viên và quản trị viên</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Tạo tài khoản
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-2xl" />)}
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Chưa có dữ liệu</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((u) => (
                        <Card key={u.id} className="bg-white/5 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                                    {u.role === "ADMIN" ? <Shield className="w-5 h-5 text-purple-400" /> : <BookOpen className="w-5 h-5 text-blue-400" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-medium text-sm">{u.name}</p>
                                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${u.role === 'ADMIN' ? 'text-purple-300 border-purple-500/30' : 'text-blue-300 border-blue-500/30'}`}>
                                            {u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'PRINCIPAL' ? 'Ban giám hiệu' : 'Giáo viên'}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 text-xs">{u.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="hidden md:block text-slate-400 min-w-32">
                                    {u.department || "Chưa xếp tổ"}
                                </div>
                                <div className="hidden lg:block text-slate-500 text-xs">
                                    {u._count.bookings} phiếu mượn
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(u)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleDelete(u.id, u.name)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Họ và tên *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="bg-white/5 border-white/10"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Email (để đăng nhập) *</Label>
                            <Input
                                type="email"
                                value={form.email}
                                disabled={!!editing}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="bg-white/5 border-white/10 disabled:opacity-50"
                                placeholder="giao.vien@truong.edu.vn"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">{editing ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu *"}</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="bg-white/5 border-white/10"
                                placeholder={editing ? "••••••••" : "Nhập mật khẩu mặc định..."}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Phân quyền</Label>
                                <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEACHER">Giáo viên</SelectItem>
                                        <SelectItem value="ADMIN">Quản trị viên / Thủ kho</SelectItem>
                                        <SelectItem value="PRINCIPAL">Ban giám hiệu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Phòng / Tổ chuyên môn</Label>
                                <Select value={form.department || "none"} onValueChange={(v) => setForm(f => ({ ...f, department: v }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Chọn tổ môn" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="none">-- Không chọn --</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-slate-300 bg-transparent hover:bg-white/5" onClick={() => setDialogOpen(false)}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
