import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeFileUrl } from "@/lib/file-url";

const OFFICE_FORMATS = new Set(["doc", "ppt", "pptx", "xls", "xlsx"]);

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

function DownloadFallback({ document, message, onDownload }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-8 md:p-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
        <FileText className="w-8 h-8" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
          {document.fileName || document.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Định dạng file: <span className="font-semibold uppercase">{getDocumentFormat(document) || "FILE"}</span>
          {document.size ? ` • Dung lượng: ${document.size}` : ""}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">{message}</p>
      </div>
      <div className="pt-2">
        <Button
          onClick={() => onDownload(document)}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-4 h-9 gap-1.5 shadow-xs"
        >
          <Download className="w-4 h-4" />
          Tải về để xem toàn bộ nội dung
        </Button>
      </div>
    </div>
  );
}

export default function DocumentPreview({ document, onDownload }) {
  const previewContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const fileUrl = document?.fileUrl || "";
  const safeFileUrl = normalizeFileUrl(fileUrl);
  const format = getDocumentFormat(document);
  const isDocx = format === "docx";
  const isPdf = format === "pdf";
  const isText = format === "txt";
  const officeViewerUrl = OFFICE_FORMATS.has(format) && canUseOfficeViewer(safeFileUrl)
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(safeFileUrl)}`
    : "";

  useEffect(() => {
    if (!isDocx || !safeFileUrl || !previewContainerRef.current) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const container = previewContainerRef.current;

    const renderDocument = async () => {
      setLoading(true);
      setPreviewError("");
      container.replaceChildren();

      try {
        const response = await fetch(safeFileUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Không tải được file (${response.status})`);
        }

        const documentData = await response.arrayBuffer();
        if (cancelled) return;

        const { renderAsync } = await import("docx-preview");
        if (cancelled || !previewContainerRef.current) return;

        await renderAsync(documentData, previewContainerRef.current, undefined, {
          className: "studyhub-docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          useBase64URL: true,
        });
      } catch (error) {
        if (error.name !== "AbortError" && !cancelled) {
          setPreviewError(error.message || "Không thể tạo bản xem trước DOCX.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void renderDocument();

    return () => {
      cancelled = true;
      controller.abort();
      container.replaceChildren();
    };
  }, [safeFileUrl, isDocx, retryKey]);

  if (!fileUrl) {
    return (
      <DownloadFallback
        document={document}
        onDownload={onDownload}
        message="Tài liệu chưa có đường dẫn file hợp lệ."
      />
    );
  }

  if (isPdf || isText) {
    return (
      <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
        <iframe
          src={isPdf ? `${safeFileUrl}#toolbar=0` : safeFileUrl}
          title={document.title}
          className="w-full h-full"
        />
      </div>
    );
  }

  if (isDocx) {
    return (
      <div className="relative min-h-[420px] max-h-[720px] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-slate-950/90 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span className="text-xs font-semibold">Đang dựng bản xem trước DOCX...</span>
          </div>
        )}

        {previewError ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center gap-4 p-8 text-center">
            <AlertCircle className="w-9 h-9 text-amber-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Không thể hiển thị bản xem trước</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{previewError}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewError("");
                  setRetryKey((value) => value + 1);
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
              <Button size="sm" onClick={() => onDownload(document)}>
                <Download className="w-4 h-4" />
                Tải tài liệu
              </Button>
            </div>
          </div>
        ) : (
          <div ref={previewContainerRef} className="studyhub-docx-preview min-h-[420px]" aria-busy={loading} />
        )}
      </div>
    );
  }

  if (officeViewerUrl) {
    return (
      <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
        <iframe
          src={officeViewerUrl}
          title={`Xem trước ${document.title}`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <DownloadFallback
      document={document}
      onDownload={onDownload}
      message="Định dạng này chưa thể xem trực tiếp vì file không có URL công khai."
    />
  );
}
