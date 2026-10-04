import { API_URL } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DocumentDetailActions from "@/components/DocumentDetailActions";
import DocumentDetailHeader from "@/components/DocumentDetailHeader";
import DocumentDetailMeta from "@/components/DocumentDetailMeta";
import DocumentDetailReviews from "@/components/DocumentDetailReviews";
import DocumentVariantSelector from "@/components/DocumentVariantSelector";
import DocumentPreview from "@/components/DocumentPreview";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { normalizeFileUrl } from "@/lib/file-url";
import { interactionHeaders } from "@/lib/interaction";
import {
  ChevronRight,
  FileText,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

const apiUrl = API_URL;

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
  fileSize: doc.fileSize || 0,
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
  variantGroupId: doc.variantGroupId,
  resourceGroupId: doc.resourceGroupId || doc.variantGroupId || doc._id || doc.id,
  variantCount: doc.variantCount || 1,
  availableFormats: doc.availableFormats || [doc.fileType || "FILE"],
});

const normalizeLessonTitle = (title = "") => String(title)
  .normalize("NFC")
  .trim()
  .replace(/[_\s]+/g, " ")
  .toLocaleLowerCase("vi-VN");

export default function DocumentDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();

  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avgRating, setAvgRating] = useState(null);
  const [fileAvailability, setFileAvailability] = useState({ state: "checking", message: "" });
  const [isDownloading, setIsDownloading] = useState(false);

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
        setSelectedVariantId(String(normalizedDoc.id));
        setVariants([]);
        try {
          const variantsResponse = await fetch(`${apiUrl}/documents/${id}/variants`);
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            const normalizedVariants = Array.isArray(variantsData.variants)
              ? variantsData.variants.map(normalizeDocument)
              : [normalizedDoc];
            setVariants(normalizedVariants);
            setSelectedVariantId(String(normalizedDoc.id));
          } else setVariants([normalizedDoc]);
        } catch {
          setVariants([normalizedDoc]);
        }
        setAvgRating(normalizedDoc.avgRating);
        void fetch(`${apiUrl}/documents/${id}/view`, { method: "POST", headers: interactionHeaders() }).catch(() => {});
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
                .filter((item) => (
                  item.resourceGroupId !== normalizedDoc.resourceGroupId
                  && normalizeLessonTitle(item.title) !== normalizeLessonTitle(normalizedDoc.title)
                  && item.fileAvailable !== false
                ))
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
    const message = nextStatus.message || "";
    setFileAvailability((previous) => (
      previous.state === nextStatus.state && previous.message === message
        ? previous
        : { state: nextStatus.state, message }
    ));

    // "checking" is only a preview UI state. Writing it back to the document
    // creates a new `document` prop, which restarts DocumentPreview's effect
    // and can trigger an endless stream of preview requests.
    if (nextStatus.state === "checking") return;

    const available = nextStatus.state !== "missing";
    setDoc((previous) => {
      if (String(previous?.id) !== String(selectedVariantId)) return previous;
      if (previous.fileAvailable === available && previous.fileIssue === message) return previous;
      return { ...previous, fileAvailable: available, fileIssue: message };
    });
    setVariants((previous) => {
      let changed = false;
      const updated = previous.map((variant) => {
        if (String(variant.id) !== String(selectedVariantId)) return variant;
        if (variant.fileAvailable === available && variant.fileIssue === message) return variant;
        changed = true;
        return { ...variant, fileAvailable: available, fileIssue: message };
      });
      return changed ? updated : previous;
    });
  }, [selectedVariantId]);

  const selectedVariant = variants.find((variant) => String(variant.id) === String(selectedVariantId));
  const activeDoc = selectedVariant || doc;
  const handleSelectVariant = (variant) => {
    setSelectedVariantId(String(variant.id));
    setAvgRating(variant.avgRating || 0);
    setFileAvailability({
      state: variant.fileAvailable === false ? "missing" : "checking",
      message: variant.fileIssue || "",
    });
    setHasReported(false);
    setReportStatus(null);
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${apiUrl}/reports/check/${variant.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (data) {
            setHasReported(Boolean(data.hasReported));
            setReportStatus(data.status || null);
          }
        })
        .catch(() => {});
    }
  };

  const handleDownload = async (docItem) => {
    if (!docItem?.fileUrl || isDownloading) return;

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
    const supportedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"]);
    const documentType = String(docItem.type || "").toLowerCase();
    let downloadName = (docItem.fileName || docItem.title || "tai-lieu").trim();

    if (!/\.[a-z0-9]{1,8}$/i.test(downloadName) && supportedExtensions.has(documentType)) {
      downloadName = `${downloadName}.${documentType}`;
    }

    downloadName = downloadName.replace(/[\\/:*?"<>|]/g, "-");
    setIsDownloading(true);

    try {
      const fileResponse = await fetch(safeUrl);
      if (!fileResponse.ok) {
        throw new Error(`Máy chủ trả về lỗi ${fileResponse.status}`);
      }

      const fileBlob = await fileResponse.blob();
      if (!fileBlob.size) {
        throw new Error("File tải về không có dữ liệu");
      }

      const objectUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = downloadName;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (downloadError) {
      toast({
        variant: "destructive",
        title: "Không thể tải tài liệu",
        description: downloadError.message || "Vui lòng thử lại sau.",
      });
      setIsDownloading(false);
      return;
    }

    // Local history is optional and must not turn a successful download into an error.
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
      // Ignore unavailable or invalid browser storage.
    }

    try {
      const counterResponse = await fetch(`${apiUrl}/documents/${docItem.id}/download`, { method: "POST", headers: interactionHeaders() });
      if (counterResponse.ok) {
        const counterData = await counterResponse.json();
        setDoc((prev) =>
          prev && prev.id === docItem.id
            ? {
                ...prev,
                downloadCount: counterData.document?.downloadCount ?? (prev.downloadCount || 0) + 1,
              }
            : prev
        );
        setVariants((previous) => previous.map((variant) => variant.id === docItem.id
          ? { ...variant, downloadCount: counterData.document?.downloadCount ?? (variant.downloadCount || 0) + 1 }
          : variant));
      }
    } catch {
      // A counter failure must not block a completed file download.
    }

    toast({
      title: "Đã tải tài liệu",
      description: downloadName,
    });
    setIsDownloading(false);
  };

  const fileUnavailable = activeDoc?.fileAvailable === false || fileAvailability.state === "missing";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-16 px-4">
        <div className="rounded-3xl border border-border/80 bg-card p-12 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground ">Đang tải thông tin tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-4xl py-16 px-4">
        <div className="rounded-3xl border border-destructive bg-destructive/10 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-destructive ">Không thể tải tài liệu</h2>
            <p className="mt-1 text-xs text-destructive ">
              {error || "Tài liệu này không tồn tại hoặc đã bị gỡ bỏ."}
            </p>
          </div>
          <Link to="/" className="inline-block pt-2">
            <Button variant="outline" className="rounded-xl border-border text-xs font-semibold">
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
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto pb-1">
        <Link to="/" className="hover:text-primary transition-colors whitespace-nowrap">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground whitespace-nowrap">Học phần</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Link to={`/subjects/${encodeURIComponent(doc.subjectName || "Khác")}`} className="font-semibold text-foreground whitespace-nowrap hover:text-primary">
          {doc.subjectName || "Khác"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground truncate max-w-[200px]">{doc.title}</span>
      </nav>

      {/* 2. DOCUMENT STATUS BANNER */}
      {fileUnavailable && <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning/90 bg-warning/10 p-3.5 px-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-warning bg-warning/10 text-warning"><AlertTriangle className="h-4 w-4" /></span>
          <p className="text-xs font-medium text-warning">Nội dung đã từng được duyệt, nhưng tệp nguồn hiện không còn khả dụng.</p>
        </div>
        <span className="hidden whitespace-nowrap rounded-lg border border-warning/80 bg-card px-2.5 py-1 text-[11px] font-semibold text-warning shadow-2xs sm:inline-block">Cần tải lại tệp</span>
      </div>}

      {/* 3. MAIN 2-COLUMN BENTO GRID */}
      <div className="detail-grid">
        {/* LEFT COLUMN: DOCUMENT MAIN BODY (2 COLS) */}
        <div className="detail-main">
          {/* Header Card */}
          <div className="detail-info paper-panel p-5 md:p-8 space-y-6">
            <DocumentDetailHeader doc={activeDoc} />

            <DocumentVariantSelector variants={variants} selectedId={activeDoc.id} onSelect={handleSelectVariant} />

            {/* Document Description */}
            <div className="rounded-2xl border border-border bg-muted/70 p-5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
                Thông tin & Giới thiệu tài liệu
              </span>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line [overflow-wrap:anywhere]">
                {doc.description ? doc.description : "Tài liệu này chưa có phần mô tả chi tiết."}
              </p>
            </div>

            {/* Document Meta KPI Cards */}
              <DocumentDetailMeta doc={activeDoc} />
          </div>

          {/* Interactive Document Preview Box */}
          <div className="detail-preview paper-panel p-5 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary " />
                <h3 className="font-bold text-foreground text-sm md:text-base">
                  Xem trước tài liệu
                </h3>
              </div>

              {activeDoc.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={fileUnavailable}
                  onClick={() => {
                    if (!fileUnavailable) {
                      window.open(normalizeFileUrl(activeDoc.fileUrl), "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="rounded-xl border-border text-xs font-semibold gap-1.5 h-8 hover:bg-muted "
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở tab mới
                </Button>
              )}
            </div>

            <DocumentPreview
              key={activeDoc.id}
              document={activeDoc}
              onDownload={handleDownload}
              onAvailabilityChange={handleAvailabilityChange}
            />
          </div>

          {/* Reviews & Ratings Section (Real Data) */}
          {activeDoc.status === "approved" && (
            <div className="detail-reviews">
            <DocumentDetailReviews
              documentId={activeDoc.id}
              avgRating={avgRating}
              key={activeDoc.id}
              onAvgRatingChange={(newAvg) => {
                setAvgRating(newAvg);
                setDoc((previous) => previous?.id === activeDoc.id ? { ...previous, avgRating: newAvg } : previous);
                setVariants((previous) => previous.map((variant) => variant.id === activeDoc.id ? { ...variant, avgRating: newAvg } : variant));
              }}
            />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY SIDEBAR (1 COL) */}
        <div className="detail-sidebar space-y-6">
          {/* Quick Actions Card */}
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-none ">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 ">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/80 ">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground ">Tác vụ tài liệu</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground ">
                  Xem, tải về hoặc lưu lại để ôn tập.
                </p>
              </div>
            </div>

            <div className="p-5">
              <DocumentDetailActions
                doc={activeDoc}
                onDownload={handleDownload}
                isDownloading={isDownloading}
                onReport={openReportModal}
                hasReported={hasReported}
                reportStatus={reportStatus}
                fileUnavailable={fileUnavailable}
                fileIssue={fileAvailability.message || activeDoc.fileIssue}
              />
            </div>
          </div>

          {/* Related Documents in Subject */}
          <div className="related-lessons-card rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Bài giảng cùng học phần</h3>
              <Link to={`/subjects/${encodeURIComponent(activeDoc.subjectName || "Khác")}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">Xem tất cả <span aria-hidden="true">→</span></Link>
            </div>

            {relatedDocs.length ? <div className="related-lessons-list space-y-3">
              {relatedDocs.map((item) => <Link key={item.id} to={`/document/${item.id}`} className="block space-y-1.5 rounded-2xl border border-border/60 bg-muted/50 p-3 transition-all hover:border-primary/40 hover:bg-card hover:shadow-xs">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.subjectName || "Học phần"}</span>
                <h4 className="line-clamp-2 text-xs font-bold text-foreground transition-colors hover:text-primary">{item.title}</h4>
                <p className="text-[10px] text-muted-foreground">{item.downloadCount || 0} lượt tải · {item.type}</p>
              </Link>)}
            </div> : <p className="text-xs text-muted-foreground">Chưa có bài giảng liên quan khác. Anh có thể xem danh sách đầy đủ của học phần.</p>}
          </div>
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
