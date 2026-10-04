import { API_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, FileText, Search, UploadCloud } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import Pagination from "@/components/Pagination";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { interactionHeaders } from "@/lib/interaction";

const PAGE_SIZE = 12;
const normalizeName = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").trim().toLocaleLowerCase("vi-VN");

const normalizeDocument = (doc) => ({
  id: doc._id || doc.id,
  title: doc.title || "Tài liệu chưa có tiêu đề",
  subject: doc.subjectName || "Khác",
  subjectName: doc.subjectName || "Khác",
  views: doc.viewCount || 0,
  downloads: doc.downloadCount || 0,
  rating: doc.avgRating || 0,
  type: String(doc.fileType || "PDF").toUpperCase(),
  uploader: doc.uploaderId?.name || "Sinh viên StudyHub",
  isVerified: doc.status === "approved",
  size: doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : null,
  fileUrl: doc.fileUrl,
  createdAt: doc.createdAt,
  fileAvailable: doc.fileAvailable,
  fileIssue: doc.fileIssue || "",
  variantCount: doc.variantCount || 1,
  availableFormats: doc.availableFormats || [doc.fileType || "FILE"],
});

export default function SubjectDetailPage({ user, onOpenAuth }) {
  const { subjectName: routeSubjectName } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [course, setCourse] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [reportDocument, setReportDocument] = useState(null);

  const decodedSubjectName = useMemo(() => {
    if (!routeSubjectName) return "";
    try { return decodeURIComponent(routeSubjectName); } catch { return routeSubjectName; }
  }, [routeSubjectName]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setPage(1);
      setQuery("");
      setSort("latest");
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [decodedSubjectName]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/subjects`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể tải học phần.");
        return data.subjects || [];
      })
      .then((items) => {
        if (controller.signal.aborted) return;
        setSubjects(items);
        setCourse(items.find((item) => normalizeName(item.name) === normalizeName(decodedSubjectName)) || null);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message || "Không thể tải học phần.");
      });
    return () => controller.abort();
  }, [decodedSubjectName]);

  useEffect(() => {
    if (!decodedSubjectName) {
      const resetTimer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ subject: decodedSubjectName, page: String(page), limit: String(PAGE_SIZE), sort });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`${API_URL}/documents?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể tải tài liệu của học phần.");
        if (controller.signal.aborted) return;
        setDocuments(Array.isArray(data.items) ? data.items.map(normalizeDocument) : []);
        setPagination({ total: data.total || 0, totalPages: data.totalPages || 0 });
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || "Không thể tải tài liệu của học phần.");
          setDocuments([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [decodedSubjectName, page, query, sort, reloadKey]);

  const openDocument = (doc) => {
    if (!doc?.id) return;
    void fetch(`${API_URL}/documents/${doc.id}/view`, { method: "POST", headers: interactionHeaders() }).catch(() => {});
    navigate(`/documents/${doc.id}`);
  };

  const renderSubjectDirectory = () => (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 md:px-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Trang chủ</Link>
      <header className="paper-panel space-y-3 p-6 md:p-9">
        <p className="section-eyebrow">DANH MỤC HỌC PHẦN</p>
        <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">Bắt đầu từ môn học của bạn</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Mỗi học phần tập hợp các bài giảng, đề cương và tài liệu ôn tập đã được cộng đồng chia sẻ.</p>
      </header>
      <label className="relative block w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm học phần..." aria-label="Tìm học phần" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
      {subjects.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.filter((item) => item.name !== "Khác" && normalizeName(item.name).includes(normalizeName(query))).map((item, index) => <Link key={item.id || item.name} to={`/subjects/${encodeURIComponent(item.name)}`} className={`subject-tile subject-tone-${index % 3} text-foreground no-underline transition hover:-translate-y-0.5 hover:shadow-xs`}>
          <span className="subject-tile-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.name}</h3><span>{item.count || 0} bài giảng và tài liệu</span></div><ArrowUpRight size={20} />
        </Link>)}
      </div> : <p className="paper-empty">{error || "Đang tải danh sách học phần..."}</p>}
      {subjects.length > 0 && !subjects.some((item) => item.name !== "Khác" && normalizeName(item.name).includes(normalizeName(query))) && <p className="text-sm text-muted-foreground">Không tìm thấy học phần phù hợp.</p>}
    </section>
  );

  if (!decodedSubjectName) return renderSubjectDirectory();

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link><span aria-hidden="true">/</span><Link to="/subjects" className="hover:text-primary">Học phần</Link><span aria-hidden="true">/</span><span className="font-semibold text-foreground">{decodedSubjectName}</span>
      </nav>

      <header className="paper-panel flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-9">
        <div className="space-y-3">
          <p className="section-eyebrow">THƯ VIỆN HỌC PHẦN{course?.code ? ` · ${course.code}` : ""}</p>
          <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">{decodedSubjectName}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Mỗi thẻ là một bài giảng hoặc tài liệu riêng. Nếu cùng một bài có nhiều định dạng, hãy mở thẻ đó để chọn bản cần xem và tải.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"><BookOpen size={18} />{pagination.total} tài liệu</div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm bài giảng trong học phần..." aria-label="Tìm bài giảng trong học phần" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span>Sắp xếp</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground"><option value="latest">Mới nhất</option><option value="popular">Tải nhiều nhất</option><option value="rating">Đánh giá cao</option></select></label>
      </div>

      {loading ? <div className="document-grid">{Array.from({ length: 4 }, (_, index) => <div className="document-skeleton" key={index}><div /><span /><span /></div>)}</div>
        : error ? <div className="paper-empty" role="alert"><FileText size={34} /><h3>Không tải được tài liệu</h3><p>{error}</p><Button type="button" variant="outline" onClick={() => setReloadKey((current) => current + 1)}>Thử lại</Button></div>
          : documents.length ? <div className="document-grid">{documents.map((doc) => <DocumentCard key={doc.id} doc={doc} onView={openDocument} onReport={(item) => { if (!user) onOpenAuth?.("login"); else setReportDocument(item); }} />)}</div>
            : <div className="paper-empty"><Search size={34} /><h3>Chưa có tài liệu phù hợp</h3><p>Thử từ khóa khác hoặc đóng góp bài giảng đầu tiên cho học phần này.</p><Link to="/documents/upload" className="paper-button paper-button-primary"><UploadCloud size={16} /> Đăng tài liệu</Link></div>}

      {!loading && !error && pagination.total > 0 && <Pagination label={`Phân trang học phần ${decodedSubjectName}`} itemLabel="tài liệu" page={page} total={pagination.total} totalPages={pagination.totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />}

      <ReportModal isOpen={Boolean(reportDocument)} onClose={() => setReportDocument(null)} document={reportDocument} />
    </section>
  );
}
