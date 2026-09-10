import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Download,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  HelpCircle,
  Code2,
  Calculator,
  TrendingUp,
  Landmark,
} from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import SubjectFilter from "@/components/SubjectFilter";
import ReportModal from "@/components/ReportModal";
import UploadModal from "@/components/UploadModal";

export default function Home({ onOpenAuth, user }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // "latest" | "popular" | "rating"
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDocForReport, setActiveDocForReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const normalizeDocument = (doc) => ({
    id: doc._id || doc.id,
    title: doc.title || "Tài liệu chưa có tiêu đề",
    subject: doc.subjectName || doc.subjectId?.name || "Khác",
    downloads: doc.downloadCount || 0,
    rating: doc.avgRating || 0,
    type: (doc.fileType || "PDF").toString().toUpperCase(),
    uploader: doc.uploaderId?.name || "Thành viên StudyHub",
    isVerified: doc.status === "approved",
    size: doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : null,
    fileUrl: doc.fileUrl,
    createdAt: doc.createdAt,
  });

  const fetchApprovedDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`${apiUrl}/documents?status=approved`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải tài liệu");
      }

      setDocuments(Array.isArray(data.items) ? data.items.map(normalizeDocument) : []);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchApprovedDocuments();
  }, []);

  const handleUploadClick = () => {
    if (!user) {
      onOpenAuth?.("login");
    } else {
      setUploadModalOpen(true);
    }
  };

  const handleReportClick = (doc) => {
    if (!user) {
      onOpenAuth?.("login");
    } else {
      setActiveDocForReport(doc);
      setReportModalOpen(true);
    }
  };

  const handleViewDoc = async (doc) => {
    if (!doc?.id) return;

    try {
      await fetch(`${apiUrl}/documents/${doc.id}/view`, { method: "POST" });
    } catch (e) {
      // ignore view counter failure
    }

    navigate(`/documents/${doc.id}`);
  };

  const handleNewUploadSuccess = (newDoc) => {
    setDocuments((prev) => [normalizeDocument(newDoc), ...prev]);
  };

  const handleSelectSubjectShowcase = (filterKey) => {
    setSelectedSubject(filterKey);
    const el = document.getElementById("featured");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Dynamic Subjects from actual database documents
  const subjects = useMemo(() => {
    const docSubjects = Array.from(
      new Set(documents.map((d) => d.subject).filter(Boolean))
    );
    return ["Tất cả", ...docSubjects];
  }, [documents]);

  // Quick Search suggestions dynamically derived from actual subjects
  const searchSuggestions = useMemo(() => {
    const extracted = Array.from(
      new Set(documents.map((d) => d.subject).filter((s) => s && s !== "Khác"))
    );
    return extracted.length > 0
      ? extracted.slice(0, 4)
      : ["Giải tích", "Đại số tuyến tính", "Lập trình C/C++", "Triết học Mác-Lênin"];
  }, [documents]);

  // Filter & Sort Logic
  const filteredAndSortedDocs = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const title = (doc.title || "").toLowerCase();
      const subject = (doc.subject || "").toLowerCase();
      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        subject.includes(searchQuery.toLowerCase());
      const matchesSubject =
        !selectedSubject ||
        selectedSubject === "Tất cả" ||
        subject.includes(selectedSubject.toLowerCase());
      return matchesSearch && matchesSubject;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "popular") {
        return (b.downloads || 0) - (a.downloads || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      // default "latest"
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [documents, searchQuery, selectedSubject, sortBy]);

  // 100% Real stats calculated directly from database records
  const totalDownloadsCount = useMemo(() => {
    const total = documents.reduce((acc, d) => acc + (d.downloads || 0), 0);
    return total.toLocaleString("vi-VN");
  }, [documents]);

  const totalDocumentsCount = useMemo(() => {
    return documents.length.toLocaleString("vi-VN");
  }, [documents]);

  const totalSubjectsCount = useMemo(() => {
    const unique = new Set(documents.map((d) => d.subject).filter(Boolean));
    return unique.size.toLocaleString("vi-VN");
  }, [documents]);

  // Top Subject Bento categories
  const subjectShowcases = useMemo(
    () => [
      {
        title: "Khoa học máy tính & CNTT",
        filterKey: "Lập trình C/C++",
        description: "Lập trình C/C++, Cấu trúc dữ liệu, Mạng máy tính",
        icon: Code2,
        color: "emerald",
      },
      {
        title: "Toán & Khoa học cơ bản",
        filterKey: "Giải tích",
        description: "Giải tích 1-2-3, Toán cao cấp, Vật lý đại cương",
        icon: Calculator,
        color: "blue",
      },
      {
        title: "Đại số & Toán ứng dụng",
        filterKey: "Đại số tuyến tính",
        description: "Ma trận, Định thức, Không gian véctơ, Xác suất thống kê",
        icon: TrendingUp,
        color: "purple",
      },
      {
        title: "Lý luận chính trị & Xã hội",
        filterKey: "Triết học Mác-Lênin",
        description: "Triết học Mác-Lênin, Kinh tế chính trị, Pháp luật đại cương",
        icon: Landmark,
        color: "amber",
      },
    ],
    []
  );

  const getSubjectDocCount = (filterKey) => {
    return documents.filter((d) =>
      (d.subject || "").toLowerCase().includes(filterKey.toLowerCase())
    ).length;
  };

  // FAQ list
  const faqs = [
    {
      q: "Tải tài liệu trên StudyHub có mất phí không?",
      a: "Hoàn toàn miễn phí! Toàn bộ tài liệu, đề thi và slide bài giảng được chia sẻ trên StudyHub đều cho phép xem trước trực tuyến và tải về máy miễn phí nhằm phục vụ mục đích học tập phi thương mại.",
    },
    {
      q: "Tài liệu sau khi tôi đăng tải mất bao lâu để được phê duyệt?",
      a: "Ban quản trị kiểm duyệt tài liệu định kỳ. Tài liệu hợp lệ, không vi phạm quy định sẽ được kiểm tra và kích hoạt hiển thị công khai trên nền tảng.",
    },
    {
      q: "StudyHub hỗ trợ những định dạng tệp tin nào?",
      a: "Nền tảng hỗ trợ các định dạng học tập thông dụng hiện nay bao gồm PDF (.pdf), Word (.doc, .docx), và Slide thuyết trình (.ppt, .pptx).",
    },
    {
      q: "Làm thế nào nếu tôi phát hiện tài liệu có nội dung sai lệch hoặc lỗi?",
      a: "Tại trang chi tiết của mỗi tài liệu, bạn chỉ cần bấm nút 'Báo cáo' ở góc tác vụ và chọn lý do. Đội ngũ kiểm duyệt sẽ tiếp nhận và xử lý phản hồi.",
    },
  ];

  return (
    <div className="space-y-16 max-w-6xl mx-auto text-left pb-12">
      {/* 1. HERO SECTION */}
      <section className="text-center py-12 md:py-16 px-6 rounded-3xl bg-gradient-to-b from-emerald-50/70 via-slate-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-6">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nền tảng chia sẻ học thuật & đề thi đại học</span>
        </div>

        {/* Title */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Kho tàng tri thức & đề thi chuẩn cho{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Sinh viên Việt Nam
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tra cứu nhanh đề thi, bài tập lớn, slide bài giảng đã qua kiểm duyệt kỹ lưỡng. Ôn tập hiệu quả, bứt phá điểm số trong kỳ thi.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative pt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học, tên đề thi, giáo trình (ví dụ: Giải tích, C/C++...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-24 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Xóa
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("featured");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute right-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Quick search suggestions */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span className="font-medium">Tìm nhanh theo học phần:</span>
          {searchSuggestions.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setSelectedSubject(term);
                const el = document.getElementById("featured");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors font-medium shadow-2xs cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* 2. REAL PLATFORM STATS BAR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalDocumentsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tài liệu đã kiểm duyệt
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {totalDownloadsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Lượt tải về
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {totalSubjectsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Học phần có tài liệu
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              100%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Miễn phí tải & chia sẻ
            </p>
          </div>
        </div>
      </section>

      {/* 3. BENTO SUBJECT SHOWCASE */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Khối ngành nổi bật
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Khám phá theo khối ngành
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Bấm chọn để lọc nhanh danh sách tài liệu tương ứng bên dưới
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectShowcases.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedSubject === cat.filterKey;
            const docCount = getSubjectDocCount(cat.filterKey);

            return (
              <div
                key={idx}
                onClick={() => handleSelectSubjectShowcase(cat.filterKey)}
                className={`group p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20"
                    : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50 hover:shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {docCount} tài liệu
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Lọc tài liệu</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DOCUMENTS CATALOG WITH SORTING TABS */}
      <section id="featured" className="space-y-6">
        {/* Horizontal Subject Pill Bar */}
        <div className="space-y-3">
          <SubjectFilter
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
          />
        </div>

        {/* Section Header with Sort Tabs & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Tài liệu học tập
              </h2>
              {selectedSubject && selectedSubject !== "Tất cả" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedSubject}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hiển thị {filteredAndSortedDocs.length} tài liệu đã kiểm duyệt sẵn sàng tải về
            </p>
          </div>

          {/* Sorting Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSortBy("latest")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === "latest"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Mới nhất
            </button>
            <button
              type="button"
              onClick={() => setSortBy("popular")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === "popular"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tải nhiều nhất
            </button>
            <button
              type="button"
              onClick={() => setSortBy("rating")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === "rating"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Đánh giá cao
            </button>
          </div>
        </div>

        {/* Document Grid */}
        {loadingDocs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredAndSortedDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onReport={handleReportClick}
                onView={handleViewDoc}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                Không tìm thấy tài liệu phù hợp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc học phần để xem tất cả tài liệu.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchQuery || selectedSubject) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
              <button
                type="button"
                onClick={handleUploadClick}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Đóng góp tài liệu môn này
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. HOW IT WORKS (3 STEPS) */}
      <section className="p-8 md:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Đơn giản & Tiện lợi
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            StudyHub hoạt động như thế nào?
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Trải nghiệm chia sẻ tài liệu học tập văn minh, an toàn và hoàn toàn miễn phí
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Khám phá & Tìm kiếm
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dễ dàng tra cứu đề thi, bài tập và giáo trình theo tên học phần và các bộ lọc thông minh.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Xem trước & Tải an toàn
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Xem trước trực tiếp tài liệu PDF trực tuyến, kiểm tra đánh giá trước khi tải về máy nhanh chóng.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Chia sẻ & Lan tỏa
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Đóng góp tài liệu học tập của bạn lên hệ thống để cùng xây dựng cộng đồng sinh viên vững mạnh.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
      <section id="faq" className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Những thông tin bạn cần biết khi tham gia học tập và chia sẻ tài liệu trên StudyHub
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. UPLOAD CTA BANNER */}
      <section className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute right-0 bottom-0 -mr-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-3 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thư viện tri thức mở StudyHub</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bạn có đề thi hoặc tài liệu học phần hay?
          </h3>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
            Mỗi tài liệu bạn đóng góp sẽ giúp các bạn sinh viên khác ôn tập thuận tiện hơn. Đăng tải nhanh chỉ trong 30 giây!
          </p>
        </div>

        <button
          onClick={handleUploadClick}
          className="relative z-10 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Đăng tải tài liệu ngay</span>
        </button>
      </section>

      {/* Modals */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setActiveDocForReport(null);
        }}
        document={activeDocForReport}
        onSuccess={(reportedDocumentId) => {
          setDocuments((previousDocuments) =>
            previousDocuments.filter((document) => document.id !== reportedDocumentId)
          );
        }}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleNewUploadSuccess}
      />
    </div>
  );
}