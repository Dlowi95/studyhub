import { useCallback, useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, BookOpen, UploadCloud, ChevronDown, HelpCircle, ShieldCheck, Users2, ArrowUpRight, Monitor, FileText } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import SubjectFilter from "@/components/SubjectFilter";
import ReportModal from "@/components/ReportModal";
import UploadModal from "@/components/UploadModal";
import StudyArtwork from "@/components/StudyArtwork";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import AdvancedSearch from "@/components/AdvancedSearch";
import { readSearchParams, updateSearchParams, searchRequestParams, SEARCH_DEFAULTS } from "@/lib/library-search";
import { interactionHeaders } from "@/lib/interaction";

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
  fileAvailable: doc.fileAvailable,
  fileIssue: doc.fileIssue || "",
});

export default function Home({ onOpenAuth, user }) {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const location = useLocation();
  const filters = useMemo(() => readSearchParams(urlParams), [urlParams]);
  const searchQuery = filters.q;
  const selectedSubject = filters.subject;
  const sortBy = filters.sort;
  const updateSearch = useCallback((updates) => {
    const next = updateSearchParams(location.search, updates);
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true, preventScrollReset: true });
  }, [navigate, location]);
  const setSearchQuery = value => updateSearch({ q: value });
  const setSelectedSubject = value => updateSearch({ subject: value });
  const clearFilters = () => updateSearch(SEARCH_DEFAULTS);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDocForReport, setActiveDocForReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [documentError, setDocumentError] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState('');
  const queryKey = JSON.stringify(filters);
  const page = Math.min(100000, Math.max(1, parseInt(urlParams.get('page'), 10) || 1));
  const requestKey = JSON.stringify([queryKey, page, reloadKey]);
  const isSearching = loadingDocs || loadedRequestKey !== requestKey;

  const fetchApprovedDocuments = useCallback(async (signal) => {
    setLoadingDocs(true);
    setDocumentError("");
    try {
      const params = searchRequestParams(JSON.parse(queryKey), page);
      const response = await fetch(`${API_URL}/documents?${params}`, { signal });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải tài liệu");
      }

      if (signal.aborted) return;
      setDocuments(
        Array.isArray(data.items)
          ? data.items.map(normalizeDocument)
          : []
      );
      setPagination({ total: data.total || 0, totalPages: data.totalPages || 0 });
    } catch (error) {
      if (!signal.aborted) {
        setDocumentError(error.message || "Không thể kết nối đến thư viện");
        setDocuments([]);
      }
    } finally {
      if (!signal.aborted) { setLoadingDocs(false); setLoadedRequestKey(requestKey); }
    }
  }, [queryKey, page, requestKey]);

  useEffect(() => {
    const controller = new AbortController();
    const timerId = window.setTimeout(() => {
      void fetchApprovedDocuments(controller.signal);
    }, 300);
    return () => { window.clearTimeout(timerId); controller.abort(); };
  }, [fetchApprovedDocuments, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOverview = async () => {
      const results = await Promise.allSettled([
        fetch(`${API_URL}/subjects`, { signal: controller.signal }).then(async (res) => {
          if (!res.ok) throw new Error("Không thể tải học phần");
          return res.json();
        }),
        fetch(`${API_URL}/documents/stats`, { signal: controller.signal }).then(async (res) => {
          if (!res.ok) throw new Error("Không thể tải thống kê");
          return res.json();
        }),
      ]);
      if (controller.signal.aborted) return;
      if (results[0].status === "fulfilled") setCatalog(results[0].value.subjects || []);
      if (results[1].status === "fulfilled") setSummary(results[1].value.summary);
    };
    void fetchOverview();
    return () => controller.abort();
  }, [reloadKey]);

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

  const handleViewDoc = (doc) => {
    if (!doc?.id) return;

    void fetch(`${API_URL}/documents/${doc.id}/view`, { method: "POST", headers: interactionHeaders() }).catch(() => {});
    navigate(`/documents/${doc.id}`);
  };

  const handleNewUploadSuccess = (newDoc) => {
    if (newDoc?.status === "approved") {
      setReloadKey((key) => key + 1);
    }
  };

  const handleSelectSubjectShowcase = (filterKey) => {
    updateSearch({ q: "", subject: filterKey });
    const el = document.getElementById("featured");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // The catalog includes subjects outside the current results page.
  const subjects = useMemo(() => {
    return ["Tất cả", ...catalog.map((item) => item.name)];
  }, [catalog]);

  // Quick Search suggestions dynamically derived from actual subjects
  const searchSuggestions = useMemo(() => {
    const extracted = Array.from(
      new Set(catalog.filter((item) => item.count > 0).map((item) => item.name).filter((s) => s && s !== "Khác"))
    );
    return extracted.length > 0
      ? extracted.slice(0, 4)
      : ["Giải tích", "Đại số tuyến tính", "Lập trình C/C++", "Triết học Mác-Lênin"];
  }, [catalog]);

  const totalDownloadsCount = summary ? (summary.totalDownloads || 0).toLocaleString("vi-VN") : "—";
  const totalDocumentsCount = summary ? (summary.approved || 0).toLocaleString("vi-VN") : "—";
  const totalSubjectsCount = summary ? (summary.totalSubjects || 0).toLocaleString("vi-VN") : "—";

  const platformStats = [
    { value: totalDocumentsCount, label: "Tài liệu đã duyệt" },
    { value: totalDownloadsCount, label: "Lượt tải học tập" },
    { value: totalSubjectsCount, label: "Học phần đang có" },
    { value: "100%", label: "Miễn phí cho sinh viên" },
  ];

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
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="hero-stickers"><span className="sticker sticker-mint">Từ sinh viên, cho sinh viên</span><span className="sticker sticker-lavender">Miễn phí 100%</span></div>
          <h1 id="home-title" className="hero-title">Học đúng tài liệu.<br /><span>Ôn đúng trọng tâm.</span></h1>
          <p className="hero-description">Đề thi, giáo trình và bài giảng cho kỳ học của bạn. Cùng tìm, cùng chia sẻ — mọi tài liệu công khai đều đã qua kiểm duyệt.</p>
          <SearchAutocomplete variant="hero" label="Tìm kiếm tài liệu" value={searchQuery} onChange={setSearchQuery} filters={filters} popularSubjects={searchSuggestions} onSelectSubject={handleSelectSubjectShowcase} onSelectDocument={id => handleViewDoc({ id })} onSubmit={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })} />
          <div className="hero-quick-search"><span>TÌM NHANH</span><div>{searchSuggestions.map((subject, index) => <button type="button" className={`sticker ${index % 3 === 0 ? "sticker-lavender" : "sticker-mint"}`} key={subject} onClick={() => { updateSearch({ q: subject, subject: "" }); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }}>{subject}</button>)}</div></div>
        </div>
        <StudyArtwork />
      </section>

      <section className="home-promises" id="how-it-works" aria-label="Cách StudyHub hoạt động">
        {[
          { icon: ShieldCheck, title: "Có người kiểm duyệt", text: "Nội dung được xem xét trước khi xuất hiện trong thư viện.", tone: "lavender" },
          { icon: Monitor, title: "Xem trước, rồi tải", text: "Đọc thử nội dung ngay trên trình duyệt để chọn đúng tài liệu.", tone: "cream" },
          { icon: Users2, title: "Chia sẻ cùng nhau", text: "Một tài liệu của bạn có thể giúp cả lớp học tốt hơn.", tone: "mint" },
        ].map(({ icon: Icon, title, text, tone }) => <article className={`promise-card promise-${tone}`} key={title}><span className="promise-icon"><Icon size={27} strokeWidth={1.7} /></span><div><h2>{title}</h2><p>{text}</p></div></article>)}
      </section>

      <section className="home-stats" aria-label="StudyHub qua các con số">
        {platformStats.map((stat, index) => <div className="home-stat" key={stat.label}><strong className={`stat-color-${index}`}>{stat.value}</strong><span>{stat.label}</span></div>)}
      </section>

      <section className="home-subjects" id="subjects">
        <div className="section-heading"><div><p className="section-eyebrow">BẮT ĐẦU TỪ MÔN HỌC CỦA BẠN</p><h2>Hôm nay bạn học gì?</h2></div><a href="#featured" className="text-link">Tất cả học phần<ArrowUpRight size={18} /></a></div>
        <div className="subject-grid">{catalog.filter((subject) => subject.name !== "Khác").sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 6).map((subject, index) => <button key={subject.id || subject.name} type="button" className={`subject-tile subject-tone-${index % 3}`} onClick={() => { handleSelectSubjectShowcase(subject.name); }}><span className="subject-tile-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{subject.name}</h3><span>{subject.count || 0} tài liệu đã duyệt</span></div><ArrowUpRight size={20} /></button>)}</div>
      </section>

      <section className="home-library" id="featured" aria-labelledby="library-title">
        <div className="section-heading"><div><p className="section-eyebrow">THƯ VIỆN HỌC LIỆU</p><h2 id="library-title">Tài liệu cho kỳ học này<span className="heading-dot">.</span></h2></div><span className="library-result-count" role="status" aria-live="polite">{isSearching ? "Đang tìm…" : documentError ? "Chưa tải được kết quả" : `${pagination.total} tài liệu phù hợp`}</span></div>
        <div className="library-tools">
          <SubjectFilter subjects={subjects} selectedSubject={selectedSubject} onSelectSubject={setSelectedSubject} />
          <div className="library-search-sort">
            <SearchAutocomplete label="Tìm trong thư viện" value={searchQuery} onChange={setSearchQuery} filters={filters} popularSubjects={searchSuggestions} onSelectSubject={handleSelectSubjectShowcase} onSelectDocument={id => handleViewDoc({ id })} onSubmit={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })} />
            <label className="library-sort"><span>SẮP XẾP</span><select aria-label="Sắp xếp tài liệu" value={sortBy} onChange={event => updateSearch({ sort: event.target.value })}><option value="latest">Mới nhất</option><option value="popular">Tải nhiều nhất</option><option value="rating">Đánh giá cao</option></select></label>
          </div>
          <AdvancedSearch key={JSON.stringify({ ...filters, q: '', sort: '' })} filters={filters} subjects={catalog.map(subject => subject.name)} onApply={updateSearch} />
        </div>
        {isSearching ? <div className="document-grid">{[1, 2, 3, 4].map((item) => <div className="document-skeleton" key={item}><div /><span /><span /></div>)}</div> : documentError ? <div className="paper-empty" role="alert"><FileText size={35} /><h3>Thư viện chưa tải được</h3><p>{documentError}</p><button type="button" className="paper-button" onClick={() => setReloadKey((key) => key + 1)}>Thử lại</button></div> : documents.length > 0 ? <div className="document-grid">{documents.map((doc) => <DocumentCard key={doc.id} doc={doc} onReport={handleReportClick} onView={handleViewDoc} />)}</div> : <div className="paper-empty"><Search size={35} /><h3>Chưa tìm thấy tài liệu phù hợp</h3><p>Thử một từ khóa khác hoặc chọn học phần khác nhé.</p><div><button type="button" className="paper-button" onClick={clearFilters}>Xóa bộ lọc</button><button type="button" className="paper-button paper-button-primary" onClick={handleUploadClick}>Đóng góp tài liệu</button></div></div>}
        {!isSearching && !documentError && pagination.totalPages > 1 && <nav aria-label="Phân trang tài liệu" className="paper-pagination"><button type="button" className="paper-button" disabled={page <= 1} onClick={() => { updateSearch({ page: page - 1 }); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }}>Trang trước</button><span>Trang {page} / {pagination.totalPages}</span><button type="button" className="paper-button" disabled={page >= pagination.totalPages} onClick={() => { updateSearch({ page: page + 1 }); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }}>Trang sau</button></nav>}
      </section>

      <section className="home-contribute"><div><span className="sticker sticker-cream">KIẾN THỨC LỚN LÊN KHI ĐƯỢC CHIA SẺ</span><h2>Bạn có tài liệu hay?<br />Đừng giữ cho riêng mình.</h2><p>Đề cương, ghi chú hay bài giảng — đóng góp nhỏ, giúp ích nhiều.</p><button type="button" className="paper-button paper-button-primary" onClick={handleUploadClick}><UploadCloud size={19} /> Chia sẻ tài liệu<ArrowUpRight size={18} /></button></div><div className="contribute-doodle" aria-hidden="true"><BookOpen size={115} strokeWidth={1.1} /><span>cùng học tốt hơn!</span><span className="contribute-star">✳</span></div></section>

      <section className="home-faq" id="faq"><div><p className="section-eyebrow">CÓ THỂ BẠN ĐANG THẮC MẮC</p><h2>Hỏi một chút,<br />hiểu rõ hơn.</h2><HelpCircle size={48} strokeWidth={1.3} /></div><div className="faq-list">{faqs.map((faq, index) => <article className={openFaqIndex === index ? "faq-item is-open" : "faq-item"} key={faq.q}><button type="button" aria-expanded={openFaqIndex === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}><span>{faq.q}</span><ChevronDown size={19} /></button>{openFaqIndex === index && <p id={`faq-answer-${index}`}>{faq.a}</p>}</article>)}</div></section>

      <ReportModal isOpen={reportModalOpen} onClose={() => { setReportModalOpen(false); setActiveDocForReport(null); }} document={activeDocForReport} />
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploadSuccess={handleNewUploadSuccess} />
    </div>
  );
}
