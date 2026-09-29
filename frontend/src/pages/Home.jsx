import { useCallback, useState, useEffect, useMemo } from "react";
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
  ShieldCheck,
  Users2,
  ArrowUpRight,
} from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import SubjectFilter from "@/components/SubjectFilter";
import ReportModal from "@/components/ReportModal";
import UploadModal from "@/components/UploadModal";
import heroVisual from "@/assets/studyhub-hero-visual.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

const studyJourney = [
  {
    step: "01",
    title: "Tìm đúng nội dung",
    description: "Tra cứu theo tên tài liệu, học phần hoặc chọn nhanh nhóm ngành phù hợp.",
    icon: Search,
    tone: "bg-emerald-500 text-white shadow-emerald-500/25",
  },
  {
    step: "02",
    title: "Xem trước an toàn",
    description: "Kiểm tra nội dung ngay trên trình duyệt cùng trạng thái kiểm duyệt rõ ràng.",
    icon: ShieldCheck,
    tone: "bg-cyan-500 text-white shadow-cyan-500/25",
  },
  {
    step: "03",
    title: "Tải về hoặc đóng góp",
    description: "Lưu tài liệu miễn phí và chia sẻ học liệu hữu ích cho cộng đồng sinh viên.",
    icon: UploadCloud,
    tone: "bg-violet-500 text-white shadow-violet-500/25",
  },
];

export default function Home({ onOpenAuth, user }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") || ""
  );
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // "latest" | "popular" | "rating"
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDocForReport, setActiveDocForReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const fetchApprovedDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`${API_URL}/documents?status=approved`);
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
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchApprovedDocuments();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [fetchApprovedDocuments]);

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
      await fetch(`${API_URL}/documents/${doc.id}/view`, { method: "POST" });
    } catch {
      // ignore view counter failure
    }

    navigate(`/documents/${doc.id}`);
  };

  const handleNewUploadSuccess = (newDoc) => {
    if (newDoc?.status === "approved") {
      setDocuments((prev) => [normalizeDocument(newDoc), ...prev]);
    }
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

  const platformStats = [
    {
      value: totalDocumentsCount,
      label: "Tài liệu đã duyệt",
      icon: BookOpen,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      value: totalDownloadsCount,
      label: "Lượt tải học tập",
      icon: Download,
      tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      value: totalSubjectsCount,
      label: "Học phần đang có",
      icon: Layers,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
    {
      value: "100%",
      label: "Miễn phí cho sinh viên",
      icon: CheckCircle2,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
  ];

  // Top Subject Bento categories
  const subjectShowcases = useMemo(
    () => [
      {
        title: "Khoa học máy tính & CNTT",
        filterKey: "Mạng máy tính",
        description: "Lập trình C/C++, Cấu trúc dữ liệu, Mạng máy tính",
        icon: Code2,
        label: "Công nghệ",
        surface: "from-emerald-50 to-teal-50/30 dark:from-emerald-500/10 dark:to-teal-500/5",
        iconTone: "bg-emerald-600 text-white shadow-emerald-600/20",
        accent: "text-emerald-700 dark:text-emerald-300",
      },
      {
        title: "Toán & Khoa học cơ bản",
        filterKey: "Giải tích",
        description: "Giải tích 1-2-3, Toán cao cấp, Vật lý đại cương",
        icon: Calculator,
        label: "Khoa học",
        surface: "from-blue-50 to-cyan-50/30 dark:from-blue-500/10 dark:to-cyan-500/5",
        iconTone: "bg-blue-600 text-white shadow-blue-600/20",
        accent: "text-blue-700 dark:text-blue-300",
      },
      {
        title: "Đại số & Toán ứng dụng",
        filterKey: "Đại số tuyến tính",
        description: "Ma trận, Định thức, Không gian véctơ, Xác suất thống kê",
        icon: TrendingUp,
        label: "Ứng dụng",
        surface: "from-violet-50 to-fuchsia-50/30 dark:from-violet-500/10 dark:to-fuchsia-500/5",
        iconTone: "bg-violet-600 text-white shadow-violet-600/20",
        accent: "text-violet-700 dark:text-violet-300",
      },
      {
        title: "Lý luận chính trị & Xã hội",
        filterKey: "Triết học",
        description: "Triết học Mác-Lênin, Kinh tế chính trị, Pháp luật đại cương",
        icon: Landmark,
        label: "Đại cương",
        surface: "from-amber-50 to-orange-50/30 dark:from-amber-500/10 dark:to-orange-500/5",
        iconTone: "bg-amber-500 text-white shadow-amber-500/20",
        accent: "text-amber-700 dark:text-amber-300",
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
      a: "Nền tảng hỗ trợ PDF (.pdf), Word (.docx), PowerPoint (.pptx), Excel (.xlsx) và văn bản (.txt). Tệp được kiểm tra định dạng trước khi chuyển đến quản trị viên kiểm duyệt.",
    },
    {
      q: "Làm thế nào nếu tôi phát hiện tài liệu có nội dung sai lệch hoặc lỗi?",
      a: "Tại trang chi tiết của mỗi tài liệu, bạn chỉ cần bấm nút 'Báo cáo' ở góc tác vụ và chọn lý do. Đội ngũ kiểm duyệt sẽ tiếp nhận và xử lý phản hồi.",
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-20 pb-16 text-left">
      {/* 1. HERO + LIVE PLATFORM STATS */}
      <div className="relative pb-10 md:pb-14">
        <section className="studyhub-hero relative w-full min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-[#071b1c] text-white shadow-[0_30px_90px_-35px_rgba(5,150,105,0.55)]">
          <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative grid min-w-0 items-center lg:grid-cols-[1.03fr_0.97fr]">
            <div className="min-w-0 px-6 py-10 sm:px-9 md:py-14 lg:px-14 lg:py-16 xl:py-20">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Học liệu được cộng đồng kiểm duyệt
              </div>

              <div className="mt-6 max-w-2xl space-y-5">
                <h1 className="text-[2rem] font-black leading-[1.03] tracking-[-0.045em] text-white min-[420px]:text-[2.55rem] sm:text-5xl lg:text-[3.65rem] xl:text-[4.15rem]">
                  Học đúng tài liệu.
                  <span className="block bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    Ôn đúng trọng tâm.
                  </span>
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Kho đề thi, giáo trình và bài giảng dành cho sinh viên Việt Nam — dễ tìm, xem trước an toàn và hoàn toàn miễn phí.
                </p>
              </div>

              <div className="mt-7 max-w-xl rounded-2xl border border-white/10 bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    aria-label="Tìm kiếm tài liệu"
                    placeholder="Tìm môn học, đề thi, giáo trình..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="h-12 w-full rounded-xl bg-white pl-11 pr-28 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/25"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-[6.8rem] text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                    >
                      Xóa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
                    className="absolute right-1.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                  >
                    Tìm ngay <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Tìm nhanh:</span>
                {searchSuggestions.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(term);
                      document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-200"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Xem trước an toàn
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users2 className="h-4 w-4 text-cyan-300" /> Chia sẻ bởi sinh viên
                </span>
              </div>
            </div>

            <div className="relative min-w-0 px-5 pb-7 sm:px-8 lg:px-3 lg:pb-0 lg:pr-7">
              <div className="hero-float relative overflow-hidden rounded-[1.65rem] border border-white/15 bg-slate-900 shadow-2xl">
                <img
                  src={heroVisual}
                  alt="Không gian học tập số với sách, máy tính và tài liệu đã kiểm duyệt"
                  className="aspect-[3/2] h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/5" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  StudyHub Learning Space
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold">Nội dung đáng tin cậy</p>
                  <p className="text-[10px] text-slate-400">Kiểm duyệt trước khi công khai</p>
                </div>
                <span className="ml-auto hidden rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200 sm:inline-flex">
                  Đã xác minh
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-3 -mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900 md:mx-10 md:-mt-8 md:grid-cols-4 md:rounded-3xl">
          {platformStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex items-center gap-3 px-4 py-4 sm:px-5 md:py-5 ${
                  index % 2 === 0 ? "border-r border-slate-100 dark:border-slate-800" : ""
                } ${index < 2 ? "border-b border-slate-100 dark:border-slate-800 md:border-b-0" : ""} ${
                  index > 0 ? "md:border-l md:border-slate-100 md:dark:border-slate-800" : ""
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white md:text-2xl">{stat.value}</p>
                  <p className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* 3. SUBJECT SHOWCASE */}
      <section id="subjects" className="scroll-mt-28 space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              <span className="h-px w-7 bg-emerald-500" /> Khối ngành nổi bật
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-3xl">
              Bắt đầu từ môn bạn đang học
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Đi thẳng tới nhóm tài liệu phù hợp, từ bài giảng nền tảng đến đề ôn tập chuyên sâu.
            </p>
          </div>
          <a
            href="#featured"
            className="inline-flex items-center gap-1.5 self-start text-xs font-extrabold text-emerald-700 transition hover:gap-2.5 dark:text-emerald-300 sm:self-auto"
          >
            Xem toàn bộ tài liệu <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjectShowcases.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedSubject === category.filterKey;
            const docCount = getSubjectDocCount(category.filterKey);

            return (
              <button
                type="button"
                key={category.filterKey}
                onClick={() => handleSelectSubjectShowcase(category.filterKey)}
                className={`group relative min-h-56 overflow-hidden rounded-[1.55rem] border bg-gradient-to-br p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_-30px_rgba(15,23,42,0.55)] ${category.surface} ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                <span className="absolute right-4 top-3 text-5xl font-black tracking-tighter text-slate-900/[0.035] dark:text-white/[0.035]">
                  0{index + 1}
                </span>

                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg ${category.iconTone}`}>
                  <Icon className="h-5 w-5" />
                </span>

                <span className={`mt-6 block text-[10px] font-extrabold uppercase tracking-[0.16em] ${category.accent}`}>
                  {category.label} · {docCount} tài liệu
                </span>
                <h3 className="mt-2 text-base font-extrabold leading-6 text-slate-950 dark:text-white">
                  {category.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {category.description}
                </p>

                <span className={`absolute bottom-5 right-5 flex h-8 w-8 items-center justify-center rounded-full border border-current/10 bg-white/70 transition group-hover:translate-x-0.5 dark:bg-slate-950/40 ${category.accent}`}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. DOCUMENTS CATALOG WITH SORTING TABS */}
      <section id="featured" className="scroll-mt-28 space-y-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            <span className="h-px w-7 bg-emerald-500" /> Thư viện học liệu
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-3xl">
            Tài liệu dành cho kỳ học này
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Mỗi nội dung công khai đều đã qua hàng đợi kiểm duyệt của StudyHub.
          </p>
        </div>

        <SubjectFilter
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
        />

        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              <strong className="font-extrabold text-slate-900 dark:text-white">{filteredAndSortedDocs.length}</strong>{" "}
              tài liệu phù hợp
              {selectedSubject && selectedSubject !== "Tất cả" ? ` với “${selectedSubject}”` : ""}
            </span>
          </div>

          {/* Sorting Tabs */}
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/80 sm:self-auto">
            <button
              type="button"
              onClick={() => setSortBy("latest")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === "latest"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
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
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
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
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
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

      {/* 5. HOW IT WORKS */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white px-6 py-10 shadow-[0_22px_60px_-45px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900 md:px-10 md:py-12">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Một hành trình liền mạch
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-3xl">
            Từ câu hỏi đến tài liệu chỉ trong vài bước
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Quy trình rõ ràng giúp sinh viên tìm, kiểm tra và chia sẻ học liệu thuận tiện hơn.
          </p>
        </div>

        <div className="relative mt-9 grid gap-4 md:grid-cols-3 md:gap-6">
          <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden border-t border-dashed border-slate-300 dark:border-slate-700 md:block" />
          {studyJourney.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.step} className="relative rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/45">
                <div className="flex items-center justify-between">
                  <span className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-black text-slate-200 dark:text-slate-700">{item.step}</span>
                </div>
                <h3 className="mt-5 text-base font-extrabold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
              </article>
            );
          })}
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
      <section className="studyhub-cta relative overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-[#071b1c] px-6 py-9 text-white shadow-[0_28px_70px_-38px_rgba(5,150,105,0.75)] sm:px-9 md:px-12 md:py-11">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> Cùng xây thư viện học liệu mở
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
              Một tài liệu của bạn có thể giúp cả lớp học tốt hơn.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Đăng đề thi, bài giảng hoặc giáo trình. StudyHub sẽ kiểm tra tệp và gửi đến quản trị viên trước khi công khai.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Miễn phí</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Có kiểm duyệt</span>
              <span className="inline-flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5 text-emerald-300" /> Vì cộng đồng</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadClick}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-extrabold text-emerald-950 shadow-[0_18px_38px_-18px_rgba(52,211,153,0.9)] transition hover:bg-emerald-300 active:scale-95 md:w-auto"
          >
            <UploadCloud className="h-4 w-4" />
            Đăng tài liệu ngay
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
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
