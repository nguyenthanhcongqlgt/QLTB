import { auth } from "@/lib/auth";
import ProfileClient from "./ProfileClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-100">Hồ sơ cá nhân</h1>
            <ProfileClient
                initialEmail={session.user.email || ""}
                initialName={session.user.name || ""}
                initialImage={session.user.image || ""}
            />
        </div>
    );
}
