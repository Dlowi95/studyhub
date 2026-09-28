# StudyHub

Nền tảng chia sẻ tài liệu học tập có kiểm duyệt dành cho sinh viên.

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, Radix UI / shadcn-style components
- Backend: Node.js, Express 5
- Database: MongoDB + Mongoose
- Authentication: JWT + Google OAuth
- Upload: Multer + Cloudinary (có local fallback)

## Cấu trúc

```text
studyhub/
├─ frontend/
│  └─ src/
│     ├─ components/
│     ├─ context/
│     ├─ hooks/
│     └─ pages/
└─ backend/
   ├─ config/
   ├─ controllers/
   ├─ middleware/
   ├─ models/
   └─ routes/
```

## Chạy local

### Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ cấu hình mẫu của dự án và điền các secret cần thiết.

```bash
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
```

Tạo `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Sau đó:

```bash
npm run dev
```

## Phân chia module

### Thành viên 1 — Auth & Admin

Phụ trách:

- đăng ký / đăng nhập / JWT
- role student / moderator / admin
- hồ sơ người dùng
- duyệt tài liệu
- quản lý user
- xử lý báo cáo phía quản trị
- chuẩn API dùng chung và deploy

### Thành viên 2 — Documents & Subjects

Phụ trách:

- upload tài liệu
- CRUD document
- subject / học phần
- search + filter
- view / download statistics
- giao diện upload, danh sách và chi tiết tài liệu

### Thành viên 3 — Reviews & Reports

Phụ trách:

- rating + comment
- average rating
- report tài liệu
- trạng thái report
- giao diện review/report
- trang báo cáo của tôi

Chi tiết công việc tiếp theo nằm trong `docs/TEAM_ROADMAP.md`.

## Quy tắc branch

Không code trực tiếp trên `main`.

Gợi ý:

```text
feature/member1-refresh-token
feature/member2-subjects
feature/member3-review-report
fix/<ten-loi>
```

Mỗi PR nên:

1. chỉ tập trung một nhóm chức năng;
2. ghi rõ API/schema thay đổi;
3. không sửa file thuộc module người khác nếu không cần;
4. build frontend trước khi merge;
5. test API liên quan trước khi merge.

## API hiện tại

Các nhóm route chính:

```text
/api/auth
/api/documents
/api/admin
/api/reports
/api/reviews
/api/notifications
```

## Trạng thái cần hoàn thiện

Các phần đáng ưu tiên tiếp theo:

- refresh token / session lifecycle
- Subject model + Subject API thật
- validation và error handling thống nhất
- rate limiting / CORS production
- test backend + frontend
- CI bằng GitHub Actions
- loại bỏ API URL hard-code và gom API client phía frontend
