"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    BookOpen, LayoutDashboard, Package, ScrollText,
    ShoppingCart, FileText, LogOut,
    BookMarked, Menu, X, Archive, Tag, Users
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const teacherNav = [
    { href: "/catalog", label: "Danh mục thiết bị", icon: Package },
    { href: "/cart", label: "Giỏ đặt mượn", icon: ShoppingCart },
    { href: "/my-bookings", label: "Phiếu của tôi", icon: BookMarked },
];

const adminNav = [
    { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "Phiếu mượn", icon: ScrollText },
    { href: "/admin/assets", label: "Quản lý thiết bị", icon: Package },
    { href: "/admin/categories", label: "Danh mục", icon: Tag },
    { href: "/admin/inventory", label: "Nhật ký kho", icon: Archive },
    { href: "/admin/users", label: "Nhân sự", icon: Users },
    { href: "/admin/reports", label: "Báo cáo", icon: FileText },
];

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "PRINCIPAL";
    const navItems = isAdmin ? adminNav : teacherNav;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">QLTB</p>
                        <p className="text-xs text-slate-400">Quản lý Thiết bị</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                                active
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {session?.user?.name?.[0] ?? "?"}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300 mt-0.5">
                            {session?.user?.role === "ADMIN" ? "Quản trị" : session?.user?.role === "PRINCIPAL" ? "Ban giám hiệu" : "Giáo viên"}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title="Đăng xuất"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-64 flex-col bg-slate-900/95 border-r border-white/10 fixed inset-y-0 left-0 z-30 backdrop-blur-xl">
                <SidebarContent />
            </aside>

            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-slate-900/95 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-white text-sm">QLTB</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="text-slate-400 hover:text-white p-1"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-30">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-white/10">
                        <SidebarContent />
                    </aside>
                </div>
            )}
        </>
    );
}
