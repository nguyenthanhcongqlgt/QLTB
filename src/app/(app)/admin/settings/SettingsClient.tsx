"use client";

import { useActionState, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateAdminProfileAction, resetDatabaseAction, updateSystemLogoAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, ImageIcon } from "lucide-react";

function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 250;
                const MAX_HEIGHT = 250;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/png", 0.9));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

export default function SettingsClient({ initialEmail }: { initialEmail: string }) {
    const [state, formAction, isPending] = useActionState(updateAdminProfileAction, null);
    const [logoState, logoAction, isLogoPending] = useActionState(updateSystemLogoAction, null);

    const [isResetPending, setIsResetPending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [logoPreview, setLogoPreview] = useState<string>("/api/settings/logo");
    const [base64Logo, setBase64Logo] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleReset = async () => {
        setIsResetPending(true);
        const result = await resetDatabaseAction();
        setIsResetPending(false);
        if (result.success) {
            toast.success(result.message);
            setIsDialogOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file hình ảnh");
            return;
        }
        try {
            const resized = await resizeImage(file);
            setLogoPreview(resized);
            setBase64Logo(resized);
        } catch {
            toast.error("Lỗi xử lý hình ảnh");
        }
    };

    if (state && !isPending) {
        setTimeout(() => {
            state.success ? toast.success(state.message) : toast.error(state.message);
        }, 0);
    }

    if (logoState && !isLogoPending) {
        setTimeout(() => {
            if (logoState.success) {
                toast.success(logoState.message);
                if (logoState.message.includes("thành công")) setBase64Logo("");
            } else {
                toast.error(logoState.message);
            }
        }, 0);
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                    <CardTitle>Cập nhật tài khoản</CardTitle>
                    <CardDescription className="text-slate-400">Đổi thông tin đăng nhập của Admin.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email / Username</Label>
                            <Input id="email" name="email" type="email" defaultValue={initialEmail} required className="bg-slate-950 border-slate-800 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Mật khẩu mới (Tùy chọn)</Label>
                            <Input id="password" name="password" type="password" placeholder="Bỏ trống nếu không đổi" className="bg-slate-950 border-slate-800 text-slate-100" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                            {isPending ? "Đang lưu..." : "Lưu tài khoản"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                    <CardTitle>Biểu trưng hệ thống</CardTitle>
                    <CardDescription className="text-slate-400">Thay đổi Logo và Favicon cho toàn bộ trang web.</CardDescription>
                </CardHeader>
                <form action={logoAction}>
                    <input type="hidden" name="logo" value={base64Logo} />
                    <CardContent className="space-y-4 flex flex-col items-center justify-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-700 bg-white flex items-center justify-center p-2">
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
                                <ImageIcon className="w-10 h-10 text-slate-300 hidden" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <span className="text-xs text-white">Tải ảnh lên</span>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        <p className="text-xs text-slate-400 text-center uppercase tracking-wider">Hỗ trợ PNG, JPG, WEBP</p>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLogoPending || !base64Logo} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                            {isLogoPending ? "Đang xử lý..." : "Cập nhật Logo"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-red-900/50 bg-slate-900 text-slate-100 md:col-span-2 max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle className="text-red-500">Khu vực nguy hiểm</CardTitle>
                    <CardDescription className="text-slate-400">Khôi phục ứng dụng về trạng thái nguyên bản.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">Xóa sạch toàn bộ dữ liệu hệ thống</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>Bạn có CHẮC CHẮN muốn xóa?</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Hành động này sẽ xóa vĩnh viễn TOÀN BỘ tài khoản cá nhân, danh mục, thiết bị, và lịch sử mượn.
                                    Chỉ DUY NHẤT thiết lập và tài khoản của Admin đăng nhập hiện tại được bảo vệ.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0 mt-4">
                                <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => setIsDialogOpen(false)} disabled={isResetPending}>Hủy thao tác</Button>
                                <Button variant="destructive" onClick={handleReset} disabled={isResetPending}>
                                    {isResetPending ? "Đang tiến hành xóa..." : "Xác nhận Xóa Vĩnh Viễn"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
