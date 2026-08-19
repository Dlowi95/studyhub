import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Star,
  Bookmark,
  BookmarkCheck,
  Flag,
  CheckCircle2,
  ChevronLeft,
  Eye,
  Calendar,
  User,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import ReportModal from "@/components/ReportModal";

export default function DocumentDetail({ user, onOpenAuth }) {
  const { id } = useParams();

  // Mock document database
  const sampleDocuments = {
    "doc-1": {
      id: "doc-1",
      title: "Đề cương ôn tập Triết học Mác-Lênin (12 chương có lời giải chi tiết)",
      subject: "Triết học Mác-Lênin",
      university: "Đại học Bách Khoa",
      downloads: 1420,
      views: 3890,
      rating: 4.8,
      ratingCount: 24,
      pages: 18,
      type: "PDF",
      size: "2.4 MB",
      uploader: "Huy Thịnh",
      uploadDate: "12/02/2026",
      isVerified: true,
      description:
        "Tài liệu tổng hợp toàn bộ 12 chương trọng tâm môn Triết học Mác-Lênin kèm câu hỏi trắc nghiệm và câu hỏi tự luận có đáp án mẫu chi tiết dành cho sinh viên ôn thi cuối kỳ.",
      previewPages: [
        {
          pageNumber: 1,
          heading: "CHƯƠNG 1: TRIẾT HỌC VÀ VAI TRÒ CỦA TRIẾT HỌC TRONG ĐỜI SỐNG XÃ HỘI",
          content: `I. KHÁI LƯỢC VỀ TRIẾT HỌC
1. Nguồn gốc của triết học:
- Nguồn gốc nhận thức: Triết học ra đời khi tư duy con người đạt đến trình độ khái quát hóa, trừu tượng hóa cao.
- Nguồn gốc xã hội: Triết học ra đời khi có sự phân công lao động xã hội (lao động trí óc tách khỏi lao động chân tay) và xuất hiện chế độ tư hữu, phân chia giai cấp.

2. Khái niệm triết học:
Triết học là hệ thống quan điểm lý luận chung nhất về thế giới và vị trí của con người trong thế giới đó; là khoa học về những quy luật vận động, phát triển chung nhất của tự nhiên, xã hội và tư duy.`,
        },
        {
          pageNumber: 2,
          heading: "II. VẤN ĐỀ CƠ BẢN CỦA TRIẾT HỌC",
          content: `1. Nội dung vấn đề cơ bản của triết học:
Theo Ph.Ăngghen: "Vấn đề cơ bản lớn của mọi triết học, đặc biệt là của triết học hiện đại, là vấn đề quan hệ giữa tư duy với tồn tại (giữa ý thức và vật chất)".

Vấn đề cơ bản gồm 2 mặt:
- Mặt thứ nhất (Bản thể luận): Giữa ý thức và vật chất, cái nào có trước, cái nào có sau, cái nào quyết định cái nào?
- Mặt thứ hai (Nhận thức luận): Con người có khả năng nhận thức được thế giới hay không?

2. Chủ nghĩa duy vật và chủ nghĩa duy tâm:
- Chủ nghĩa duy vật: Cho rằng vật chất có trước, sinh ra và quyết định ý thức.
- Chủ nghĩa duy tâm: Cho rằng ý thức, tinh thần có trước và quyết định vật chất.`,
        },
        {
          pageNumber: 3,
          heading: "III. BÀI TẬP VÀ CÂU HỎI ÔN TẬP TRỌNG TÂM",
          content: `Câu 1: Phân tích sự đối lập giữa phương pháp biện chứng và phương pháp siêu hình trong lịch sử triết học?
Hướng dẫn trả lời:
- Phương pháp siêu hình: Nhìn nhận sự vật trong trạng thái cô lập, tĩnh tại, không vận động, không phát triển.
- Phương pháp biện chứng: Nhìn nhận sự vật trong mối liên hệ phổ biến, trong sự vận động, biến đổi và phát triển không ngừng thông qua việc giải quyết các mâu thuẫn nội tại.

(Các trang tiếp theo chứa câu hỏi trắc nghiệm từ câu 1 đến câu 100...)`,
        },
      ],
    },
    "doc-2": {
      id: "doc-2",
      title: "Giáo trình và bài tập Cấu trúc dữ liệu và Giải thuật",
      subject: "Cấu trúc dữ liệu",
      university: "Đại học Bách Khoa",
      downloads: 850,
      views: 2100,
      rating: 5.0,
      ratingCount: 18,
      pages: 45,
      type: "PDF",
      size: "5.1 MB",
      uploader: "Lâm Nguyễn",
      uploadDate: "05/02/2026",
      isVerified: true,
      description: "Giáo trình chi tiết về danh sách liên kết, cây nhị phân tìm kiếm, đồ thị, giải thuật sắp xếp và tìm kiếm kèm code mẫu C++.",
      previewPages: [
        {
          pageNumber: 1,
          heading: "BÀI 1: TỔNG QUAN VỀ CẤU TRÚC DỮ LIỆU & ĐỘ PHỨC TẠP THUẬT TOÁN",
          content: `1. Khái niệm Cấu trúc dữ liệu:
Cấu trúc dữ liệu (Data Structure) là cách tổ chức, quản lý và lưu trữ dữ liệu trong bộ nhớ máy tính để có thể truy xuất và thao tác một cách hiệu quả.

2. Đánh giá độ phức tạp thuật toán (Big O Notation):
- O(1): Thời gian hằng số (truy xuất mảng theo index).
- O(log N): Thời gian logarit (tìm kiếm nhị phân).
- O(N): Thời gian tuyến tính (duyệt danh sách).
- O(N log N): Sắp xếp nhanh (QuickSort, MergeSort).
- O(N^2): Sắp xếp chọn, nổi bọt (BubbleSort, SelectionSort).`,
        },
      ],
    },
  };

  // Fallback if doc not in sample
  const doc = sampleDocuments[id] || {
    id: id || "doc-1",
    title: "Đề thi cuối kỳ Giải tích 1 có đáp án chi tiết",
    subject: "Giải tích",
    university: "Đại học Bách Khoa",
    downloads: 2100,
    views: 4500,
    rating: 4.6,
    ratingCount: 15,
    pages: 12,
    type: "PDF",
    size: "1.8 MB",
    uploader: "Ban Học Tập",
    uploadDate: "10/01/2026",
    isVerified: true,
    description: "Bộ đề thi chính thức kỳ thi kết thúc học phần Giải tích 1 kèm lời giải từng bước các câu tích phân suy rộng và chuỗi số.",
    previewPages: [
      {
        pageNumber: 1,
        heading: "ĐỀ THI CUỐI KỲ MÔN GIẢI TÍCH 1",
        content: `Câu 1 (2.0 điểm): Tính giới hạn sau bằng quy tắc L'Hospital hoặc khai triển Maclaurin:
lim (x -> 0) (e^x - cos(x) - x) / (x * sin(x))

Câu 2 (2.5 điểm): Xét sự hội tụ của tích phân suy rộng:
I = ∫ (từ 1 đến vô cùng) (ln(x) + 1) / (x^2 + 3x) dx

Câu 3 (2.5 điểm): Tìm miền hội tụ của chuỗi lũy thừa:
∑ (từ n=1 đến vô cùng) ((x - 2)^n) / (n * 3^n)`,
      },
    ],
  };

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Rating & Comments state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: "Nguyễn Hoàng Nam",
      rating: 5,
      date: "15/02/2026",
      content: "Tài liệu rất chuẩn và đầy đủ, mình vừa ôn xong thi được 9 điểm. Cảm ơn bạn đã chia sẻ!",
    },
    {
      id: 2,
      author: "Trần Mai Anh",
      rating: 5,
      date: "14/02/2026",
      content: "Trình bày rõ ràng, dễ hiểu. Phần câu hỏi ôn tập bám sát đề thi thật.",
    },
  ]);

  const handleDownload = () => {
    if (!user) {
      onOpenAuth?.("login");
      return;
    }
    alert(`Bắt đầu tải về tài liệu: ${doc.title} (${doc.size})`);
  };

  const handleBookmarkToggle = () => {
    if (!user) {
      onOpenAuth?.("login");
      return;
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.("login");
      return;
    }
    if (!commentText.trim()) return;

    const newReview = {
      id: Date.now(),
      author: user.name || "Tôi",
      rating: userRating,
      date: "Hôm nay",
      content: commentText.trim(),
    };

    setReviews([newReview, ...reviews]);
    setCommentText("");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
        <span>/</span>
        <span>{doc.subject}</span>
        <span>/</span>
        <span className="text-slate-800 truncate max-w-xs">{doc.title}</span>
      </nav>

      {/* Document Title Header */}
      <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            {doc.subject}
          </span>
          {doc.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã kiểm duyệt chất lượng
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">
            {doc.type} • {doc.pages} trang • {doc.size}
          </span>
        </div>

        <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-snug">
          {doc.title}
        </h1>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Đăng bởi: <strong className="text-slate-700">{doc.uploader}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Ngày đăng: {doc.uploadDate}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <strong className="text-slate-800">{doc.rating}</strong> ({doc.ratingCount} đánh giá)
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              {doc.downloads} lượt tải
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {doc.views} lượt xem
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Preview (Left) & Actions/Metadata (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Document Preview Viewport & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Document Reader Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Reader Toolbar */}
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Xem trước tài liệu (Trang 1 - {doc.previewPages.length})</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Định dạng {doc.type}</span>
              </div>
            </div>

            {/* Document Pages Rendering */}
            <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
              {doc.previewPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="bg-white p-6 md:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-4 min-h-[380px] text-left relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Trang {page.pageNumber} / {doc.pages}
                    </span>
                    <span className="text-[11px] text-slate-400">StudyHub</span>
                  </div>

                  <h3 className="font-bold text-sm md:text-base text-slate-900">
                    {page.heading}
                  </h3>

                  <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-mono">
                    {page.content}
                  </div>
                </div>
              ))}

              {/* End of Preview Barrier Notice */}
              <div className="text-center py-8 px-4 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                <FileText className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Đang hiển thị {doc.previewPages.length} trang xem trước đầu tiên
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tải về tài liệu hoàn chỉnh gồm {doc.pages} trang để xem toàn bộ nội dung và bài tập.
                </p>
                <Button
                  onClick={handleDownload}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-6 py-2 rounded-xl"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Tải về toàn bộ tài liệu ({doc.size})
                </Button>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Mô tả tài liệu</h3>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {doc.description}
            </p>
          </div>

          {/* Reviews & Comments Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đánh giá & Nhận xét ({reviews.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Chia sẻ nhận xét của bạn để giúp các bạn sinh viên khác tham khảo.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{doc.rating} / 5</span>
              </div>
            </div>

            {/* Write Review Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Chấm điểm chất lượng:</span>
                {/* Interactive Star Picker */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (hoverRating || userRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1.5">{userRating} sao</span>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Nhận xét về độ chính xác, tính đầy đủ của tài liệu..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                className="w-full p-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />

              <div className="flex justify-end">
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 rounded-xl">
                  Gửi nhận xét
                </Button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3.5 pt-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                        {rev.author.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{rev.author}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-slate-400 text-[11px]">{rev.date}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 pl-8">{rev.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar: Primary Actions & Metadata */}
        <div className="space-y-6 lg:sticky lg:top-20">
          {/* Action Box Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Button
              onClick={handleDownload}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Tải về tài liệu ({doc.size})</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBookmarkToggle}
                className={`w-full text-xs font-semibold rounded-xl border-slate-200 h-10 flex items-center justify-center gap-1.5 ${
                  isBookmarked ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    <span>Đã lưu</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Lưu tài liệu</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setReportModalOpen(true)}
                className="w-full text-xs font-semibold rounded-xl border-slate-200 hover:text-destructive hover:border-destructive/30 h-10 flex items-center justify-center gap-1.5"
              >
                <Flag className="w-4 h-4" />
                <span>Báo cáo</span>
              </Button>
            </div>

            {/* Quick spec items */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Định dạng file:</span>
                <span className="font-semibold text-slate-800">{doc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số trang:</span>
                <span className="font-semibold text-slate-800">{doc.pages} trang</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dung lượng:</span>
                <span className="font-semibold text-slate-800">{doc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kiểm duyệt:</span>
                <span className="font-semibold text-emerald-700">Đã kiểm duyệt</span>
              </div>
            </div>
          </div>

          {/* Uploader Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người đăng tải</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                {doc.uploader.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{doc.uploader}</p>
                <p className="text-xs text-slate-500">Thành viên cộng đồng StudyHub</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        document={doc}
      />
    </div>
  );
}
