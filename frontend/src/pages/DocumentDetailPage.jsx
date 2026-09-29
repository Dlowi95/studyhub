import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DocumentDetailActions from "@/components/DocumentDetailActions";
import DocumentDetailHeader from "@/components/DocumentDetailHeader";
import DocumentDetailMeta from "@/components/DocumentDetailMeta";
import DocumentDetailReviews from "@/components/DocumentDetailReviews";
import DocumentPreview from "@/components/DocumentPreview";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { normalizeFileUrl } from "@/lib/file-url";
import {
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const repairFileNameEncoding = (fileName) => {
  if (typeof fileName !== "string" || !/[ÃÂâ]/.test(fileName)) return fileName;

  try {
    const bytes = Uint8Array.from(fileName, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fileName;
  }
};

const normalizeDocument = (doc) => ({
  id: doc._id || doc.id,
  title: doc.title || "Tài liệu chưa có tiêu đề",
  subject: doc.subjectName || doc.subjectId?.name || "Khác",
  subjectName: doc.subjectName || doc.subjectId?.name || "Khác",
  downloads: doc.downloadCount || 0,
  rating: doc.avgRating || 0,
  type: (doc.fileType || "PDF").toString().toUpperCase(),
  uploader: doc.uploaderId?.name || doc.uploader || "Thành viên StudyHub",
  isVerified: doc.status === "approved",
  size: doc.fileName ? `${Math.max(1, Math.round((doc.fileSize || 2) / 1024 / 1024))} MB` : "2 MB",
  fileUrl: doc.fileUrl,
  fileName: repairFileNameEncoding(doc.fileName),
  description: doc.description || "",
  status: doc.status || "pending",
  tags: doc.tags || [],
  createdAt: doc.createdAt,
  viewCount: doc.viewCount || 0,
  downloadCount: doc.downloadCount || 0,
  avgRating: doc.avgRating || 0,
  uploaderId: doc.uploaderId,
  fileAvailable: doc.fileAvailable,
  fileIssue: doc.fileIssue || "",
  storageProvider: doc.storageProvider || "",
});

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avgRating, setAvgRating] = useState(null);
  const [fileAvailability, setFileAvailability] = useState({ state: "checking", message: "" });

  // Report modal & status state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetDoc, setReportTargetDoc] = useState(null);
  const [hasReported, setHasReported] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);

  const openReportModal = (targetDoc) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập tài khoản StudyHub để gửi báo cáo vi phạm.",
        variant: "destructive",
      });
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
      return;
    }
    setReportTargetDoc(targetDoc);
    setReportModalOpen(true);
  };
  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTargetDoc(null);
  };

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const detailRes = await fetch(`${apiUrl}/documents/${id}`);
        const detailData = await detailRes.json();

        if (!detailRes.ok) {
          throw new Error(detailData.message || "Không tìm thấy tài liệu");
        }

        const normalizedDoc = normalizeDocument(detailData);
        setDoc(normalizedDoc);
        setAvgRating(normalizedDoc.avgRating);
        setFileAvailability({
          state: normalizedDoc.fileAvailable === false ? "missing" : "checking",
          message: normalizedDoc.fileIssue || "",
        });

        // Check if current logged-in user already reported this document (Yêu cầu 5)
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const checkRes = await fetch(`${apiUrl}/reports/check/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              setHasReported(checkData.hasReported);
              setReportStatus(checkData.status);
            }
          } catch {
            // non-blocking check
          }
        }

        // Fetch related documents in the same subject
        if (normalizedDoc.subjectName) {
          const relatedRes = await fetch(
            `${apiUrl}/documents?status=approved&subject=${encodeURIComponent(normalizedDoc.subjectName)}`
          );

          const relatedData = await relatedRes.json();
          if (relatedRes.ok && Array.isArray(relatedData.items)) {
            setRelatedDocs(
              relatedData.items
                .map(normalizeDocument)
                .filter((item) => item.id !== normalizedDoc.id && item.fileAvailable !== false)
                .slice(0, 3)
            );
          }
        }
      } catch (err) {
        setError(err.message || "Không thể tải tài liệu");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  const handleAvailabilityChange = useCallback((nextStatus) => {
    setFileAvailability(nextStatus);
  }, []);

  const handleDownload = async (docItem) => {
    if (!docItem?.fileUrl) return;

    if (docItem.fileAvailable === false || fileAvailability.state === "missing") {
      toast({
        variant: "destructive",
        title: "Tệp nguồn không còn khả dụng",
        description:
          fileAvailability.message ||
          docItem.fileIssue ||
          "Người đăng cần tải lại tài liệu trước khi bạn có thể xem hoặc tải xuống.",
      });
      return;
    }

    const safeUrl = normalizeFileUrl(docItem.fileUrl);
    window.open(safeUrl, "_blank", "noopener,noreferrer");

    // Record to local download history
    try {
      const history = JSON.parse(localStorage.getItem("studyhub_downloads") || "[]");
      if (!history.some((h) => h.id === docItem.id)) {
        history.unshift({
          id: docItem.id,
          title: docItem.title,
          subject: docItem.subjectName || docItem.subject,
          downloadedAt: new Date().toLocaleDateString("vi-VN"),
          size: docItem.size,
          fileUrl: docItem.fileUrl,
        });
        localStorage.setItem("studyhub_downloads", JSON.stringify(history.slice(0, 50)));
      }
    } catch {
      // Local download history is optional and must not block the download.
    }

    try {
      await fetch(`${apiUrl}/documents/${docItem.id}/download`, { method: "POST" });
      setDoc((prev) =>
        prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : prev
      );
      toast({
        title: "Bắt đầu tải xuống",
        description: `Đang tải file ${docItem.fileName || docItem.title}`,
      });
    } catch {
      // ignore network failure for counter update
    }
  };

  const fileUnavailable = doc?.fileAvailable === false || fileAvailability.state === "missing";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-16 px-4">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải thông tin tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-4xl py-16 px-4">
        <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900 dark:text-red-300">Không thể tải tài liệu</h2>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error || "Tài liệu này không tồn tại hoặc đã bị gỡ bỏ."}
            </p>
          </div>
          <Link to="/" className="inline-block pt-2">
            <Button variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold">
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-left pb-16">
      {/* 1. BREADCRUMBS NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">Học phần</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
          {doc.subjectName || "Khác"}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{doc.title}</span>
      </nav>

      {/* 2. DOCUMENT STATUS BANNER */}
      <div
        className={`rounded-2xl border p-3.5 px-4 flex items-center justify-between gap-3 shadow-xs ${
          fileUnavailable
            ? "border-amber-300/90 bg-amber-50/90 dark:border-amber-800/70 dark:bg-amber-950/30"
            : "border-emerald-200/90 bg-emerald-50/80 dark:border-emerald-800/60 dark:bg-emerald-950/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              fileUnavailable
                ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                : "border-emerald-200/80 bg-emerald-100 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-900/60 dark:text-emerald-300"
            }`}
          >
            {fileUnavailable ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <p
            className={`text-xs font-medium ${
              fileUnavailable
                ? "text-amber-900 dark:text-amber-200"
                : "text-emerald-900 dark:text-emerald-200"
            }`}
          >
            {fileUnavailable
              ? "Nội dung đã từng được duyệt, nhưng tệp nguồn hiện không còn khả dụng."
              : "Tài liệu học tập đã được kiểm duyệt an toàn — Sẵn sàng tải về và học tập."}
          </p>
        </div>
        <span
          className={`hidden sm:inline-block text-[11px] font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border shadow-2xs whitespace-nowrap ${
            fileUnavailable
              ? "border-amber-300/80 text-amber-700 dark:border-amber-800/80 dark:text-amber-300"
              : "border-emerald-200/80 text-emerald-700 dark:border-emerald-800/80 dark:text-emerald-300"
          }`}
        >
          {fileUnavailable ? "Cần tải lại tệp" : "Đã xác thực"}
        </span>
      </div>

      {/* 3. MAIN 2-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: DOCUMENT MAIN BODY (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
            <DocumentDetailHeader doc={doc} />

            {/* Document Description */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Thông tin & Giới thiệu tài liệu
              </span>
              <p className="text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {doc.description ? doc.description : "Tài liệu này chưa có phần mô tả chi tiết."}
              </p>
            </div>

            {/* Document Meta KPI Cards */}
            <DocumentDetailMeta doc={doc} />
          </div>

          {/* Interactive Document Preview Box */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                  Xem trước tài liệu
                </h3>
              </div>

              {doc.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={fileUnavailable}
                  onClick={() => {
                    if (!fileUnavailable) {
                      window.open(normalizeFileUrl(doc.fileUrl), "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1.5 h-8 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở tab mới
                </Button>
              )}
            </div>

            <DocumentPreview
              document={doc}
              onDownload={handleDownload}
              onAvailabilityChange={handleAvailabilityChange}
            />
          </div>

          {/* Reviews & Ratings Section (Real Data) */}
          {doc.status === "approved" && (
            <DocumentDetailReviews
              documentId={doc.id}
              avgRating={avgRating}
              onAvgRatingChange={(newAvg) => setAvgRating(newAvg)}
            />
          )}
        </div>

        {/* RIGHT COLUMN: STICKY SIDEBAR (1 COL) */}
        <div className="space-y-6 lg:sticky lg:top-20">
          {/* Quick Actions Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/50 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-emerald-950/20">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tác vụ tài liệu</h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Xem, tải về hoặc lưu lại để ôn tập.
                </p>
              </div>
            </div>

            <div className="p-5">
              <DocumentDetailActions
                doc={doc}
                onDownload={handleDownload}
                onReport={openReportModal}
                hasReported={hasReported}
                reportStatus={reportStatus}
                fileUnavailable={fileUnavailable}
                fileIssue={fileAvailability.message || doc.fileIssue}
              />
            </div>
          </div>

          {/* Related Documents in Subject */}
          {relatedDocs.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tài liệu cùng học phần</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {relatedDocs.length} tài liệu
                </span>
              </div>

              <div className="space-y-3">
                {relatedDocs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/document/${item.id}`)}
                    className="p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                  >
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                      {item.subjectName || "Học phần"}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-primary dark:hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {item.downloadCount || 0} lượt tải • {item.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        document={reportTargetDoc}
        onSuccess={(docId, report) => {
          setHasReported(true);
          setReportStatus(report?.status || "pending");
          toast({
            title: "Báo cáo đã được ghi nhận",
            description: "Cảm ơn bạn đã đóng góp xây dựng thư viện học tập an toàn.",
          });
        }}
      />
    </div>
  );
}
