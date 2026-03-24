"use client";

import { useActionState, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { updateMyProfileAction } from "./actions";
import { toast } from "sonner";
import { UserCircle, Upload } from "lucide-react";

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
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

export default function ProfileClient({ initialEmail, initialName, initialImage }: { initialEmail: string, initialName: string, initialImage: string }) {
    const [state, formAction, isPending] = useActionState(updateMyProfileAction, null);
    const [avatarPreview, setAvatarPreview] = useState<string>(initialImage);
    const [base64Image, setBase64Image] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file hình ảnh");
            return;
        }

        try {
            const resizedBase64 = await resizeImage(file);
            setAvatarPreview(resizedBase64);
            setBase64Image(resizedBase64);
        } catch (error) {
            toast.error("Lỗi khi xử lý hình ảnh");
        }
    };

    if (state && !isPending) {
        setTimeout(() => {
            if (state.success) {
                toast.success(state.message);
                if (state.message.includes("thành công")) {
                    setBase64Image("");
                }
            } else {
                toast.error(state.message);
            }
        }, 0);
    }

    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
                <CardTitle>Cập nhật hồ sơ</CardTitle>
                <CardDescription className="text-slate-400">Thay đổi ảnh đại diện và mật khẩu cá nhân.</CardDescription>
            </CardHeader>
            <form action={formAction}>
                <input type="hidden" name="image" value={base64Image} />

                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-12 h-12 text-slate-500" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                            <h3 className="font-medium text-lg">{initialName}</h3>
                            <p className="text-sm text-slate-400">{initialEmail}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Đổi ảnh đại diện
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Mật khẩu mới (Tùy chọn)</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Bỏ trống nếu không đổi mật khẩu"
                                className="bg-slate-950 border-slate-800 text-slate-100"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
