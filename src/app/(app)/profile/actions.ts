"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateMyProfileAction(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");

        const currentUserId = session.user.id;
        const newPassword = formData.get("password") as string;
        const imageBase64 = formData.get("image") as string;

        const updateData: any = {};

        if (newPassword && newPassword.length >= 6) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        } else if (newPassword && newPassword.length > 0) {
            return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" };
        }

        if (imageBase64) {
            updateData.image = imageBase64;
        }

        if (Object.keys(updateData).length === 0) {
            return { success: false, message: "Không có thay đổi nào" };
        }

        await prisma.user.update({
            where: { id: currentUserId },
            data: updateData
        });

        revalidatePath("/profile");
        revalidatePath("/", "layout");

        return { success: true, message: "Cập nhật hồ sơ thành công!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Có lỗi xảy ra khi cập nhật hồ sơ" };
    }
}
