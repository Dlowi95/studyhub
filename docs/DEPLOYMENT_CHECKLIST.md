# Checklist deploy StudyHub

## Cấu hình dịch vụ

### Render API

- Tạo service từ Blueprint `render.yaml` ở repo root, nhánh `main`.
- `rootDir` là `backend`; lệnh build là `npm ci`, lệnh chạy là `npm start`.
- Nhập `MONGO_URI` của MongoDB Atlas. Blueprint tự tạo `JWT_SECRET` và đặt `NODE_ENV=production`.
- Sau khi có domain Vercel, đặt `CORS_ORIGINS` trên Render thành đúng origin production, ví dụ `https://studyhub.example` (không thêm `/` cuối). Có thể nhập nhiều origin, phân cách bằng dấu phẩy.
- Dùng Render Dashboard để lấy các outbound IP ranges của service, rồi thêm những CIDR cần thiết vào Atlas Project IP Access List. Không mở Atlas cho toàn bộ Internet.
- Kiểm tra `https://<api-domain>/api/health`; service chỉ báo healthy khi MongoDB đã kết nối.

### Vercel frontend

- Tạo Project từ cùng repo và đặt Root Directory là `frontend`.
- Framework preset: Vite; build command `npm run build`; output directory `dist`.
- Đặt `VITE_API_URL` thành `https://<api-domain>/api`.
- Nếu dùng Google Sign-In, đặt thêm `VITE_GOOGLE_CLIENT_ID`; đây là client ID công khai, không đặt secret ở biến có tiền tố `VITE_`.
- Sau deploy, thêm domain production vào `CORS_ORIGINS` của Render rồi redeploy/restart API.

## Lưu ý dữ liệu và kiểm thử

- Không đưa `.env` lên Git. Tham khảo `backend/.env.example` và `frontend/.env.example`; nhập giá trị thật trong dashboard của từng dịch vụ.
- Khi không cấu hình Cloudinary, upload mới dùng MongoDB GridFS. Không dùng filesystem của Render làm kho file lâu dài: filesystem của gói Free có tính tạm thời.
- Gói Render Free có thể ngủ sau 15 phút không có request; lần truy cập sau có thể chậm khi service khởi động lại.
- Tài liệu cũ có URL `localhost` cần được trỏ lại về API đang deploy. Các URL GridFS và `/uploads` nội bộ đã được frontend chuẩn hóa theo `VITE_API_URL`.
- Trước khi mở cho người dùng khác, kiểm tra lại file nguồn trong Atlas, đăng nhập, đăng tài liệu, duyệt/từ chối, xem trước, tải, thông báo và báo cáo vi phạm bằng hai tài khoản thử.
- Thay đổi học phần có dùng MongoDB transaction; MongoDB deployment phải hỗ trợ replica set.

## Smoke test sau deploy

1. Mở `/api/health` trên domain Render và xác nhận `status: "ok"`, `mongo: "connected"`.
2. Mở trang gốc và refresh trực tiếp các route `/documents/...`, `/profile` trên Vercel.
3. Đăng nhập bằng tài khoản thử; kiểm tra trang học phần, tài liệu, đánh giá và thông báo.
4. Tải lên một file nhỏ, duyệt bằng tài khoản quản trị, rồi xem trước/tải file sau khi service khởi động lại.
5. Xác nhận một request từ origin không nằm trong `CORS_ORIGINS` không nhận được quyền CORS.
