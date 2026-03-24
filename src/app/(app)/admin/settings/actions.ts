"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function resetDatabaseAction() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const currentUserId = session.user.id;

        await prisma.$transaction([
            prisma.inventoryLog.deleteMany({}),
            prisma.booking.deleteMany({}),
            prisma.asset.deleteMany({}),
            prisma.category.deleteMany({}),
            prisma.user.deleteMany({
                where: {
                    id: { not: currentUserId }
                }
            })
        ]);

        return { success: true, message: "Đã xóa toàn bộ dữ liệu thành công!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Có lỗi xảy ra khi xóa dữ liệu" };
    }
}

export async function updateAdminProfileAction(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const currentUserId = session.user.id;
        const email = formData.get("email") as string;
        const newPassword = formData.get("password") as string;

        if (!email) {
            return { success: false, message: "Email không được để trống" };
        }

        const updateData: any = { email };

        if (newPassword && newPassword.length >= 6) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        } else if (newPassword && newPassword.length > 0) {
            return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" };
        }

        await prisma.user.update({
            where: { id: currentUserId },
            data: updateData
        });

        revalidatePath("/admin/settings");
        return { success: true, message: "Cập nhật tài khoản thành công! Bạn có thể cần đăng nhập lại." };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "Email này đã được sử dụng" };
        }
        return { success: false, message: error.message || "Có lỗi xảy ra khi cập nhật cập nhật" };
    }
}
