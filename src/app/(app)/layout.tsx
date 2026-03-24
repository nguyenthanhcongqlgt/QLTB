import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
                    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}
