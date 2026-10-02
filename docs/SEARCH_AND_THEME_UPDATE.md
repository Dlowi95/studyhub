# Tìm kiếm và giao diện sáng/tối

## Đã hoàn thiện

- Gợi ý tìm kiếm có độ trễ 250 ms, hủy request cũ khi người dùng gõ tiếp và bỏ qua phản hồi đến muộn.
- Gợi ý được tách thành học phần và tài liệu. Chỉ tài liệu đã duyệt mới được trả về; dữ liệu gợi ý không chứa email, file URL hay nội dung file.
- Có lịch sử tìm kiếm gần đây ở trình duyệt, tối đa 6 mục, có nút xóa và hỗ trợ phím mũi tên, Enter, Escape.
- Tìm kiếm nâng cao gồm học phần, định dạng, điểm tối thiểu, lượt tải tối thiểu, khoảng ngày đăng, phạm vi tìm kiếm và cách khớp từ khóa.
- Bộ lọc được lưu trong URL nên tải lại trang hoặc chia sẻ liên kết vẫn giữ nguyên kết quả. Ngày lọc được xử lý theo giờ Việt Nam.
- API luôn giới hạn kết quả công khai ở trạng thái `approved`, escape regex đầu vào và trả lỗi `400` cho ngày hoặc bộ lọc không hợp lệ.
- Đăng xuất chỉ xóa dữ liệu tài khoản cục bộ; giao diện, lịch sử tìm kiếm và tùy chọn sáng/tối vẫn được giữ.
- Chế độ tối dùng cùng token màu với chế độ sáng, giảm màu pastel chói trên nền tối, giữ trạng thái sau reload và cập nhật `color-scheme` cho trình duyệt.
- Tài liệu đã lưu được gắn với tài khoản trên server, có thể thêm/bỏ lưu và đồng bộ giữa các thiết bị. Bookmark cũ trong trình duyệt được tự động thử chuyển sang tài khoản khi mở Hồ sơ.
- Admin có tab **Nhật ký kiểm duyệt** và API phân trang, ghi người xử lý, thời điểm, trạng thái trước/sau, lý do từ chối và lịch sử xử lý báo cáo.
- Lượt xem và lượt tải dùng mã phiên trình duyệt cùng cửa sổ chống lặp; lượt tải chỉ gửi bộ đếm sau khi file đã tải thành công.

## URL tìm kiếm

Các tham số công khai gồm:

`q`, `subject`, `sort=latest|popular|rating`, `fileType`, `minRating`, `minDownloads`, `from`, `to`, `searchIn=all|title|tags`, `match=all|phrase`, `page`.

Ví dụ:

`/?q=giải tích&fileType=PDF&minRating=4&searchIn=title&match=phrase#featured`

## Ưu tiên sản phẩm tiếp theo

1. Bổ sung lại 5 file nguồn đang thiếu và làm luồng tải lại file trong khu vực quản trị; metadata vẫn hiển thị khi file vật lý không còn.
2. Bổ sung metadata học kỳ, khoa/lớp và loại tài liệu để bộ lọc nâng cao phục vụ đúng ngữ cảnh học tập.
