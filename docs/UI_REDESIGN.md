# StudyHub — Giao diện mới

## Hướng thiết kế

Tham khảo mẫu Variant do chủ dự án cung cấp: https://variant.com/shared/354db7f1-62c9-4743-be4f-9a48d8620ede.

- Nền giấy màu kem, chữ xanh olive, điểm nhấn hồng, lavender và mint.
- Font Plus Jakarta Sans, tiêu đề đậm, viền rõ, bóng đổ lệch và nhãn kiểu sticker.
- Minh họa trang chủ bằng CSS và icon có sẵn; không phụ thuộc ảnh banner tải từ dịch vụ bên ngoài.
- Số liệu, học phần, tài liệu và trạng thái lấy từ API; không dùng số liệu quảng cáo của mẫu.

## Các màn hình đã cập nhật

| Màn hình | Thay đổi |
| --- | --- |
| Trang chủ | Hero hai cột, tìm kiếm, minh họa học liệu, lợi ích, thống kê, học phần, thư viện, đóng góp và FAQ |
| Thư viện | Bìa tài liệu pastel, nhãn định dạng/kiểm duyệt, tên người đăng, số lượt tải đỏ, cảnh báo tệp thiếu, bộ lọc và trạng thái rỗng |
| Chi tiết tài liệu | Màu sắc và thẻ thông tin đồng bộ; tác vụ đặt trước bản xem trước trên điện thoại; số lượt tải đỏ |
| Hồ sơ | Tiêu đề chung, thẻ thông tin cá nhân, thống kê và danh sách tài liệu theo cùng bảng màu |
| Đăng tải và báo cáo | Tiêu đề, form, trạng thái, hộp thoại và nút đồng bộ; vùng chọn tệp dùng được bằng bàn phím |
| Quản trị | Sidebar, logo, bảng, biểu đồ, trạng thái và hộp thoại đồng bộ; hỗ trợ đổi sáng/tối thay cho giao diện tối cố định |
| Thành phần chung | Menu máy tính/điện thoại, thông báo, footer, favicon, nút, dialog và toast |

## Cấu trúc

- `frontend/src/index.css`: token màu sáng/tối và quy tắc nền tảng.
- `frontend/src/design-system.css`: bố cục, minh họa và breakpoint.
- `SiteHeader`, `SiteFooter`, `BrandMark`, `PageHeading`, `StudyArtwork`: các thành phần dùng chung.
- Giữ lazy loading theo route, tìm kiếm/phân trang trên server và các API nghiệp vụ hiện có.

## Kiểm tra

- Frontend lint và production build.
- 29 mục kiểm tra UI đã đạt, không ghi nhận lỗi JavaScript ứng dụng trong phiên kiểm tra.
- 14 kiểm tra backend hiện có.
- Chrome: trang chủ ở 320/390/768/1280/1440px; trang hồ sơ, đăng tải, báo cáo, chi tiết và quản trị trên máy tính/điện thoại.
- Kiểm tra menu và cuộn tới section, thông báo, tìm kiếm/xóa lọc, lưu tài liệu, dialog đăng nhập/báo cáo và chọn tệp đến bước xác nhận gửi duyệt.
- Phiên kiểm tra UI chặn mọi request ghi vào API. Không gửi tài liệu, đánh giá hay thay đổi trạng thái quản trị trong kiểm tra giao diện.

Các tệp nguồn đã bị thiếu trước đó vẫn cần người đăng tải lại; đổi giao diện không khôi phục nội dung tệp. Form dùng font hệ thống dự phòng nếu Google Fonts không tải được.
