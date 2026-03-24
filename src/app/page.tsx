import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = session.user?.role === "ADMIN" || session.user?.role === "PRINCIPAL";
  redirect(isAdmin ? "/admin/dashboard" : "/catalog");
}
