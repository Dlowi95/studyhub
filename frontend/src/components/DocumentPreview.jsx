import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeFileUrl } from "@/lib/file-url";
import { interactionHeaders } from "@/lib/interaction";

const SAFE_PREVIEW_FORMATS = new Set(["pdf", "txt", "docx", "pptx", "xlsx"]);
const LEGACY_OFFICE_FORMATS = new Set(["doc", "ppt", "xls"]);

const MIME_FORMATS = [
  ["wordprocessingml", "docx"],
  ["msword", "doc"],
  ["presentationml", "pptx"],
  ["ms-powerpoint", "ppt"],
  ["spreadsheetml", "xlsx"],
  ["ms-excel", "xls"],
  ["pdf", "pdf"],
  ["text/plain", "txt"],
];

function getDocumentFormat(document) {
  const fileName = document?.fileName || "";
  const extension = fileName.split("?")[0].split(".").pop()?.toLowerCase();

  if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(extension)) {
    return extension;
  }

  const rawType = String(document?.type || document?.fileType || "").toLowerCase();
  const mimeMatch = MIME_FORMATS.find(([token]) => rawType.includes(token));
  return mimeMatch?.[1] || rawType.replace(/[^a-z0-9]/g, "");
}

function canUseOfficeViewer(fileUrl) {
  if (!fileUrl) return false;
  try {
    const parsedUrl = new URL(fileUrl, window.location.origin);
    return parsedUrl.protocol === "https:" && !["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function DownloadFallback({ document, message, onDownload, allowDownload = true }) {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xs ">
        <FileText className="h-8 w-8" />
      </div>
      <div className="mx-auto max-w-md space-y-1">
        <h4 className="text-sm font-bold text-foreground ">
          {document.fileName || document.title}
        </h4>
        <p className="text-xs text-muted-foreground ">
          Định dạng: <span className="font-semibold uppercase">{getDocumentFormat(document) || "FILE"}</span>
          {document.size ? ` • Dung lượng: ${document.size}` : ""}
        </p>
        <p className="pt-1 text-[11px] leading-5 text-muted-foreground ">{message}</p>
      </div>
      {allowDownload && (
        <div className="pt-2">
          <Button
            onClick={() => onDownload?.(document)}
            className="h-9 gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Tải về để xem toàn bộ nội dung
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DocumentPreview({ document, onDownload, onAvailabilityChange }) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [extractedPreview, setExtractedPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [fileMissing, setFileMissing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const fileUrl = document?.fileUrl || "";
  const format = getDocumentFormat(document);
  const documentId = document?.id || document?._id;
  const legacyOfficeUrl = LEGACY_OFFICE_FORMATS.has(format) && canUseOfficeViewer(fileUrl)
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(normalizeFileUrl(fileUrl))}`
    : "";

  useEffect(() => {
    if (!documentId || !SAFE_PREVIEW_FORMATS.has(format)) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    let objectUrl = "";

    const loadPreview = async () => {
      setLoading(true);
      setPreviewMode("");
      setPreviewUrl("");
      setPreviewText("");
      setExtractedPreview(null);
      setPreviewError("");
      setFileMissing(false);
      onAvailabilityChange?.({ state: "checking", message: "" });

      if (document.fileAvailable === false) {
        const message = document.fileIssue || "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu.";
        setPreviewError(message);
        setFileMissing(true);
        setLoading(false);
        onAvailabilityChange?.({ state: "missing", message });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/documents/${documentId}/preview`, {
          signal: controller.signal,
          headers: interactionHeaders(),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const error = new Error(data.message || `Không thể tạo bản xem trước (${response.status})`);
          error.fileMissing = response.status === 404 || response.status === 410 || data.fileAvailable === false;
          throw error;
        }

        if (["docx", "pptx", "xlsx"].includes(format)) {
          const data = await response.json();
          if (cancelled) return;
          setExtractedPreview(data);
          setPreviewMode("extracted");
        } else if (format === "txt") {
          const text = await response.text();
          if (cancelled) return;
          setPreviewText(text);
          setPreviewMode("text");
        } else {
          const blob = await response.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
          setPreviewUrl(objectUrl);
          setPreviewMode("pdf");
        }

        onAvailabilityChange?.({ state: "available", message: "" });
      } catch (error) {
        if (error.name === "AbortError" || cancelled) return;
        const missing = Boolean(error.fileMissing);
        const message = error.message || "Không thể tạo bản xem trước tài liệu.";
        setFileMissing(missing);
        setPreviewError(message);
        onAvailabilityChange?.({ state: missing ? "missing" : "error", message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document, documentId, format, onAvailabilityChange, retryKey]);

  if (!fileUrl) {
    return (
      <DownloadFallback
        document={document}
        onDownload={onDownload}
        allowDownload={false}
        message="Tài liệu chưa có đường dẫn tệp hợp lệ."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted text-muted-foreground ">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold">Đang chuẩn bị bản xem trước an toàn...</span>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-warning bg-warning/10 p-8 text-center ">
        <AlertCircle className="h-10 w-10 text-warning" />
        <div className="max-w-md space-y-1">
          <p className="text-sm font-bold text-foreground ">
            {fileMissing ? "Tệp nguồn không còn khả dụng" : "Không thể hiển thị bản xem trước"}
          </p>
          <p className="text-xs leading-5 text-foreground ">{previewError}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Kiểm tra lại
          </Button>
          {!fileMissing && (
            <Button size="sm" onClick={() => onDownload?.(document)}>
              <Download className="h-4 w-4" />
              Tải tài liệu
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (previewMode === "pdf" && previewUrl) {
    return (
      <div className="h-[650px] w-full overflow-hidden rounded-2xl border border-border bg-muted ">
        <iframe src={`${previewUrl}#toolbar=0`} title={document.title} className="h-full w-full" />
      </div>
    );
  }

  if (previewMode === "text") {
    return (
      <pre className="max-h-[650px] min-h-[420px] w-full overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-foreground ">
        {previewText}
      </pre>
    );
  }

  if (previewMode === "extracted" && extractedPreview) {
    return (
      <div className="max-h-[720px] min-h-[420px] w-full overflow-auto rounded-2xl border border-border bg-muted p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-primary bg-primary/10 px-4 py-3 text-primary ">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-5">{extractedPreview.notice}</p>
          </div>

          {(extractedPreview.sections || []).map((section, index) => (
            <section key={`${section.title}-${index}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ">
              <h3 className="border-b border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground ">
                {section.title}
              </h3>
              <pre className="whitespace-pre-wrap break-words p-4 font-sans text-sm leading-6 text-foreground ">
                {section.content}
              </pre>
            </section>
          ))}

          {(extractedPreview.images || []).length > 0 && (
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ">
              <h3 className="border-b border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground ">
                Hình ảnh trong tài liệu
              </h3>
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                {extractedPreview.images.map((image, index) => (
                  <figure key={`${image.name}-${index}`} className="rounded-lg border border-border bg-muted p-2 ">
                    <img
                      src={image.dataUrl}
                      alt={`Ảnh ${index + 1} trong tài liệu`}
                      loading="lazy"
                      className="max-h-[520px] w-full rounded-md bg-card object-contain"
                    />
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (legacyOfficeUrl) {
    return (
      <div className="h-[650px] w-full overflow-hidden rounded-2xl border border-border bg-muted ">
        <iframe
          src={legacyOfficeUrl}
          title={`Xem trước ${document.title}`}
          className="h-full w-full"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <DownloadFallback
      document={document}
      onDownload={onDownload}
      message="Định dạng cũ này chưa thể xem trực tiếp trong trình duyệt."
    />
  );
}
