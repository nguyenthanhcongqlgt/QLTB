"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, FileText, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

interface CartItem {
    assetId: string;
    assetName: string;
    quantity: number;
    unit: string;
    availableQuantity: number;
}

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [borrowDate, setBorrowDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [purpose, setPurpose] = useState("");
    const [lesson, setLesson] = useState("");
    const [lessonName, setLessonName] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Load cart from localStorage (shared with catalog page)
    useEffect(() => {
        const stored = localStorage.getItem("qltb_cart");
        if (stored) {
            try { setCart(JSON.parse(stored)); } catch { }
        }
    }, []);

    // Default dates
    useEffect(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        setBorrowDate(tomorrow.toISOString().split("T")[0]);
        setReturnDate(nextWeek.toISOString().split("T")[0]);
    }, []);

    async function handleSubmit() {
        if (!borrowDate || !returnDate) {
            toast.error("Vui lòng chọn ngày mượn và ngày trả");
            return;
        }
        if (!lesson.trim() || !lessonName.trim()) {
            toast.error("Vui lòng nhập tiết PPCT và tên bài dạy");
            return;
        }
        if (cart.length === 0) {
            toast.error("Giỏ trống, vui lòng thêm thiết bị");
            return;
        }

        setSubmitting(true);
        const errors: string[] = [];

        for (const item of cart) {
            try {
                const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        assetId: item.assetId,
                        quantity: item.quantity,
                        borrowDate,
                        returnDate,
                        purpose,
                        lesson,
                        lessonName,
                        note,
                    }),
                });
                const data = await res.json();
                if (!res.ok) errors.push(`${item.assetName}: ${data.error}`);
            } catch {
                errors.push(`${item.assetName}: Lỗi kết nối`);
            }
        }

        setSubmitting(false);

        if (errors.length === 0) {
            localStorage.removeItem("qltb_cart");
            toast.success("Đặt mượn thành công! Đang chờ phê duyệt.");
            router.push("/my-bookings");
        } else {
            errors.forEach((e) => toast.error(e));
        }
    }

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Link href="/catalog"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Xác nhận Đặt mượn</h1>
                    <p className="text-slate-400 text-sm mt-1">Điền thông tin và gửi phiếu đặt mượn</p>
                </div>
            </div>

            {cart.length === 0 ? (
                <Card className="bg-white/5 border-white/10 text-center py-12">
                    <CardContent>
                        <p className="text-slate-400 mb-4">Giỏ trống. Vui lòng thêm thiết bị từ danh mục.</p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <Link href="/catalog">Duyệt danh mục</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Selected items */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-base">Thiết bị đặt mượn ({cart.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {cart.map((item) => (
                                <div key={item.assetId} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-white text-sm font-medium">{item.assetName}</p>
                                        <p className="text-slate-400 text-xs">Tối đa: {item.availableQuantity} {item.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold">{item.quantity}</span>
                                        <span className="text-slate-400 text-sm">{item.unit}</span>
                                        <button
                                            onClick={() => setCart((c) => c.filter((i) => i.assetId !== item.assetId))}
                                            className="text-slate-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Thời gian mượn
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Ngày mượn</Label>
                                <Input
                                    type="date"
                                    min={today}
                                    value={borrowDate}
                                    onChange={(e) => setBorrowDate(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Ngày trả</Label>
                                <Input
                                    type="date"
                                    min={borrowDate || today}
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purpose & note */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-base flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                Thông tin bổ sung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Tiết PPCT *</Label>
                                    <Input
                                        placeholder="Ví dụ: 25"
                                        value={lesson}
                                        onChange={(e) => setLesson(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder-slate-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Tên bài dạy *</Label>
                                    <Input
                                        placeholder="Ví dụ: Định luật Ôm"
                                        value={lessonName}
                                        onChange={(e) => setLessonName(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder-slate-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Lớp / Chi tiết mục đích</Label>
                                <Input
                                    placeholder="Lớp 11A1..."
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Ghi chú (tuỳ chọn)</Label>
                                <Textarea
                                    placeholder="Yêu cầu đặc biệt, điều kiện thiết bị..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder-slate-500 resize-none"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 animate-spin" />
                                Đang gửi...
                            </span>
                        ) : "Gửi Phiếu Đặt Mượn"}
                    </Button>
                </>
            )}
        </div>
    );
}
