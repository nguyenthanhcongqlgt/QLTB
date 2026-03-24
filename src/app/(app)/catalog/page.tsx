"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, Filter, ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Asset {
    id: string;
    name: string;
    description: string | null;
    availableQuantity: number;
    totalQuantity: number;
    unit: string;
    status: string;
    category: { id: string; name: string; color: string };
}

interface CartItem {
    assetId: string;
    assetName: string;
    quantity: number;
    unit: string;
    availableQuantity: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: "Còn hàng", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    LOW_STOCK: { label: "Sắp hết", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    OUT_OF_STOCK: { label: "Hết hàng", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    DAMAGED: { label: "Hỏng", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

const CART_KEY = "qltb_cart";

function loadCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"); } catch { return []; }
}

export default function CatalogPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = loadCart();
        if (stored.length > 0) setCart(stored);
    }, []);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        if (mounted) localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }, [cart, mounted]);

    useEffect(() => {
        fetchAssets();
        fetchCategories();
    }, [search, categoryFilter]);

    async function fetchAssets() {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
        const res = await fetch(`/api/assets?${params}`);
        const data = await res.json();
        setAssets(data.assets ?? []);
        setLoading(false);
    }

    async function fetchCategories() {
        const res = await fetch("/api/categories");
        if (res.ok) {
            const data = await res.json();
            setCategories(data);
        }
    }

    function addToCart(asset: Asset) {
        if (asset.status !== "AVAILABLE" && asset.status !== "LOW_STOCK") return;
        setCart((prev) => {
            const existing = prev.find((i) => i.assetId === asset.id);
            if (existing) {
                if (existing.quantity >= asset.availableQuantity) {
                    toast.error(`Chỉ còn ${asset.availableQuantity} ${asset.unit}`);
                    return prev;
                }
                return prev.map((i) => i.assetId === asset.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            toast.success(`Đã thêm "${asset.name}" vào giỏ`);
            return [...prev, {
                assetId: asset.id,
                assetName: asset.name,
                quantity: 1,
                unit: asset.unit,
                availableQuantity: asset.availableQuantity
            }];
        });
    }

    function removeFromCart(assetId: string) {
        setCart((prev) => prev.filter((i) => i.assetId !== assetId));
    }

    function updateQty(assetId: string, delta: number) {
        setCart((prev) =>
            prev.map((i) => {
                if (i.assetId !== assetId) return i;
                const newQty = i.quantity + delta;
                if (newQty <= 0) return i;
                if (newQty > i.availableQuantity) {
                    toast.error(`Tối đa ${i.availableQuantity} ${i.unit}`);
                    return i;
                }
                return { ...i, quantity: newQty };
            })
        );
    }

    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Danh mục Thiết bị</h1>
                    <p className="text-slate-400 text-sm mt-1">Duyệt và chọn thiết bị cần mượn</p>
                </div>
                <Button
                    onClick={() => setCartOpen(true)}
                    className="relative bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Giỏ đặt mượn
                    {mounted && cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                            {cartCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm thiết bị..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder-slate-500"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                        <Filter className="w-4 h-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Asset grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="bg-white/5 border-white/10">
                            <CardHeader><Skeleton className="h-5 w-3/4 bg-white/10" /></CardHeader>
                            <CardContent><Skeleton className="h-4 w-full bg-white/10" /></CardContent>
                        </Card>
                    ))
                    : assets.map((asset) => {
                        const inCart = cart.find((i) => i.assetId === asset.id);
                        const statusInfo = STATUS_LABELS[asset.status] ?? STATUS_LABELS.AVAILABLE;
                        const canBorrow = asset.status === "AVAILABLE" || asset.status === "LOW_STOCK";
                        return (
                            <Card key={asset.id} className="bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/8 transition-all duration-200 flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-white text-sm font-semibold leading-tight line-clamp-2">{asset.name}</CardTitle>
                                        <Badge className={`text-xs shrink-0 border ${statusInfo.color}`}>{statusInfo.label}</Badge>
                                    </div>
                                    <Badge variant="outline" className="w-fit text-xs border-white/10 text-slate-400 mt-1">
                                        {asset.category.name}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pb-2 flex-1">
                                    {asset.description && (
                                        <p className="text-slate-400 text-xs line-clamp-2">{asset.description}</p>
                                    )}
                                    <p className="text-slate-300 text-sm font-medium mt-2">
                                        Còn: <span className="text-white font-bold">{asset.availableQuantity}</span>
                                        <span className="text-slate-400"> / {asset.totalQuantity} {asset.unit}</span>
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    {inCart ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <Button size="icon" variant="outline" className="h-8 w-8 border-white/10" onClick={() => updateQty(asset.id, -1)}><Minus className="w-3 h-3" /></Button>
                                            <span className="text-white font-bold flex-1 text-center">{inCart.quantity}</span>
                                            <Button size="icon" variant="outline" className="h-8 w-8 border-white/10" onClick={() => updateQty(asset.id, 1)}><Plus className="w-3 h-3" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => removeFromCart(asset.id)}><X className="w-3 h-3" /></Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full h-8 text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all"
                                            disabled={!canBorrow}
                                            onClick={() => addToCart(asset)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            {canBorrow ? "Thêm vào giỏ" : "Không có sẵn"}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
            </div>

            {!loading && assets.length === 0 && (
                <div className="text-center py-20">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Không tìm thấy thiết bị nào</p>
                </div>
            )}

            {/* Cart drawer */}
            {cartOpen && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-white font-bold text-lg">Giỏ đặt mượn ({cartCount})</h2>
                            <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">Giỏ trống</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.assetId} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="text-white text-sm font-medium">{item.assetName}</p>
                                            <button onClick={() => removeFromCart(item.assetId)} className="text-slate-500 hover:text-red-400 ml-2"><X className="w-3 h-3" /></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="outline" className="h-7 w-7 border-white/10" onClick={() => updateQty(item.assetId, -1)}><Minus className="w-3 h-3" /></Button>
                                            <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                                            <Button size="icon" variant="outline" className="h-7 w-7 border-white/10" onClick={() => updateQty(item.assetId, 1)}><Plus className="w-3 h-3" /></Button>
                                            <span className="text-slate-400 text-xs">{item.unit}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="p-4 border-t border-white/10">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                                    onClick={() => { setCartOpen(false); router.push("/cart"); }}
                                >
                                    Tiến hành đặt mượn →
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
