"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateAdminProfileAction, resetDatabaseAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsClient({ initialEmail }: { initialEmail: string }) {
    const [state, formAction, isPending] = useActionState(updateAdminProfileAction, null);
    const [isResetPending, setIsResetPending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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

    if (state && !isPending) {
        setTimeout(() => {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
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
                        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-red-900/50 bg-slate-900 text-slate-100">
                <CardHeader>
                    <CardTitle className="text-red-500">Khu vực nguy hiểm</CardTitle>
                    <CardDescription className="text-slate-400">Các thao tác không thể hoàn tác.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">Khôi phục cài đặt gốc (Xóa dữ liệu)</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle>Xóa toàn bộ dữ liệu?</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Hành động này sẽ xóa vĩnh viễn TOÀN BỘ tài khoản thành viên, danh mục, thiết bị và lịch sử mượn trả.
                                    Chỉ DUY NHẤT tài khoản Admin hiện tại của bạn được giữ lại. Hành động này không thể hoàn tác!
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white" onClick={() => setIsDialogOpen(false)} disabled={isResetPending}>Hủy</Button>
                                <Button variant="destructive" onClick={handleReset} disabled={isResetPending}>
                                    {isResetPending ? "Đang xóa..." : "Xác nhận Xóa"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
