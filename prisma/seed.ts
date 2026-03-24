import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱  Bắt đầu seeding dữ liệu mẫu...");

    // 1. Xóa dữ liệu cũ (để tránh trùng lặp khi chạy lại)
    await prisma.inventoryLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});

    // 2. Tạo User (Admin & Teacher)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: "admin@school.edu.vn" },
            update: {},
            create: {
                name: "Quản trị viên",
                email: "admin@school.edu.vn",
                password: hashedPassword,
                role: "ADMIN",
                department: "Ban Giám Hiệu",
            },
        }),
        prisma.user.upsert({
            where: { email: "teacher@school.edu.vn" },
            update: {},
            create: {
                name: "Giáo viên Toán",
                email: "teacher@school.edu.vn",
                password: hashedPassword,
                role: "TEACHER",
                department: "Tổ Toán-Tin",
            },
        }),
    ]);
    console.log(`✅ Đã tạo ${users.length} tài khoản mẫu.`);

    // 2. Tạo Danh mục (Categories)
    const categories = [
        { name: "Vật lý", description: "Thiết bị thí nghiệm điện, cơ, quang học", color: "#3B82F6" },
        { name: "Hóa học", description: "Dụng cụ thủy tinh, hóa chất cơ bản", color: "#10B981" },
        { name: "Sinh học", description: "Mô hình cơ thể, kính hiển vi, tiêu bản", color: "#8B5CF6" },
        { name: "Tin học & TB số", description: "Máy tính, máy chiếu, bảng tương tác", color: "#EF4444" },
        { name: "Thể dục", description: "Bóng, thảm, dụng cụ thể thao", color: "#F59E0B" },
    ];

    const createdCategories = await Promise.all(
        categories.map(cat => prisma.category.create({ data: cat }))
    );
    console.log(`✅ Đã tạo ${createdCategories.length} danh mục.`);

    const [phys, chem, bio, tech, sport] = createdCategories;

    // 3. Tạo Thiết bị (Assets)
    const assets = [
        // Vật lý
        { name: "Đồng hồ vạn năng", categoryId: phys.id, totalQuantity: 15, availableQuantity: 15, unit: "cái", status: "AVAILABLE" },
        { name: "Bộ thí nghiệm thấu kính", categoryId: phys.id, totalQuantity: 10, availableQuantity: 10, unit: "bộ", status: "AVAILABLE" },
        { name: "Nguồn điện một chiều 0-12V", categoryId: phys.id, totalQuantity: 12, availableQuantity: 12, unit: "cái", status: "AVAILABLE" },

        // Hóa học
        { name: "Cốc thủy tinh 250ml", categoryId: chem.id, totalQuantity: 50, availableQuantity: 50, unit: "cái", status: "AVAILABLE" },
        { name: "Ống nghiệm phi 16", categoryId: chem.id, totalQuantity: 100, availableQuantity: 100, unit: "ống", status: "AVAILABLE" },
        { name: "Giá đỡ thí nghiệm", categoryId: chem.id, totalQuantity: 20, availableQuantity: 20, unit: "cái", status: "LOW_STOCK" },

        // Sinh học
        { name: "Kính hiển vi quang học", categoryId: bio.id, totalQuantity: 8, availableQuantity: 8, unit: "cái", status: "AVAILABLE" },
        { name: "Mô hình bộ xương người", categoryId: bio.id, totalQuantity: 2, availableQuantity: 2, unit: "bộ", status: "AVAILABLE" },
        { name: "Tủ nuôi cấy vi sinh", categoryId: bio.id, totalQuantity: 1, availableQuantity: 1, unit: "chiếc", status: "AVAILABLE" },

        // Tin học
        { name: "Máy chiếu Panasonic", categoryId: tech.id, totalQuantity: 5, availableQuantity: 5, unit: "chiếc", status: "AVAILABLE" },
        { name: "Laptop Dell Vostro", categoryId: tech.id, totalQuantity: 10, availableQuantity: 10, unit: "chiếc", status: "AVAILABLE" },
        { name: "Loa kéo di động", categoryId: tech.id, totalQuantity: 3, availableQuantity: 2, unit: "cái", status: "AVAILABLE" },

        // Thể dục
        { name: "Bóng đá số 5", categoryId: sport.id, totalQuantity: 30, availableQuantity: 30, unit: "quả", status: "AVAILABLE" },
        { name: "Thảm tập Gym", categoryId: sport.id, totalQuantity: 20, availableQuantity: 20, unit: "chiếc", status: "AVAILABLE" },
    ];

    await Promise.all(assets.map(asset => prisma.asset.create({ data: asset as any })));
    console.log(`✅ Đã tạo ${assets.length} thiết bị mẫu.`);

    console.log("🎉 Hoàn tất seeding dữ liệu!");
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
