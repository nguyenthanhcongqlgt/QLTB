# Hệ thống Quản lý Thiết bị trường học (QLTB)

Dự án này là một ứng dụng web hiện đại được xây dựng bằng Next.js 15, hỗ trợ quản lý việc mượn và trả thiết bị, dụng cụ thí nghiệm trong trường học.

## 🚀 Công nghệ sử dụng

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons.
- **UI Components**: shadcn/ui.
- **Backend**: Next.js API Routes.
- **Database**: PostgreSQL với Prisma ORM.
- **Authentication**: NextAuth.js (hỗ trợ Credentials và Google OAuth sau này).

## ✨ Tính năng chính

- **Quản lý thiết bị**: Xem danh sách, tìm kiếm, phân loại thiết bị theo danh mục.
- **Hệ thống mượn trả**: Đặt mượn thiết bị kèm thông tin Tiết PPCT, Tên bài dạy. Admin duyệt hoặc từ chối phiếu mượn.
- **Quản lý nhân sự**: Admin quản lý tài khoản giáo viên, phân quyền và reset mật khẩu.
- **Nhật ký kho**: Tự động lưu vết các hoạt động nhập, xuất, hỏng hóc thiết bị.
- **Dashboard Admin**: Thống kê nhanh tình trạng kho và các phiếu mượn đang chờ.

## 🛠️ Cài đặt và Chạy dự án

### 1. Cài đặt phụ thuộc
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo tệp `.env` dựa trên `.env.example` và cấu hình `DATABASE_URL` (PostgreSQL).

### 3. Cấu hình Database
```bash
npx prisma db push
npx prisma db seed
```

### 4. Chạy chế độ Development
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 📝 Tài khoản thử nghiệm (Mặc định)

- **Admin**: `admin@school.edu.vn` / `123456`
- **Teacher**: `teacher@school.edu.vn` / `123456`

