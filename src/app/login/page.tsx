"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            router.push("/catalog");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            <div className="relative w-full max-w-md space-y-8">
                <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">QLTB</h1>
                    <p className="text-blue-200/70 text-sm">Quản lý Thiết bị Trường học</p>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-white text-xl">Đăng nhập</CardTitle>
                        <CardDescription className="text-slate-400">
                            Sử dụng tài khoản nội bộ để truy cập hệ thống
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email</Label>
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@school.edu.vn"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Mật khẩu</Label>
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 mt-2"
                            >
                                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                            </Button>
                        </form>

                        <p className="text-xs text-center text-slate-500 mt-6">
                            Vui lòng liên hệ Ban Giám Hiệu nếu bạn quên mật khẩu.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                        { icon: Shield, label: "Bảo mật" },
                        { icon: Zap, label: "Nhanh chóng" },
                        { icon: Building2, label: "Tập trung" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
                            <Icon className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
