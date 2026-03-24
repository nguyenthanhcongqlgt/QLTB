import { auth } from "@/lib/auth";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-slate-100">Cài đặt hệ thống</h1>
            <SettingsClient initialEmail={session.user.email || ""} />
        </div>
    );
}
