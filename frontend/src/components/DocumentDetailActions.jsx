import { useState, useEffect } from "react";
import { Download, FileText, MessageSquareWarning, Bookmark, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { normalizeFileUrl } from "@/lib/file-url";

export default function DocumentDetailActions({
  doc,
  onDownload,
  onReport,
  hasReported = false,
  reportStatus = null,
  fileUnavailable = false,
  fileIssue = "",
}) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!doc?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem("studyhub_bookmarks") || "[]");
      queueMicrotask(() =>
        setIsBookmarked(saved.some((item) => item.id === doc.id || item._id === doc.id))
      );
    } catch {
      queueMicrotask(() => setIsBookmarked(false));
    }
  }, [doc?.id]);

  const handleToggleBookmark = () => {
    if (!doc) return;
    try {
      const saved = JSON.parse(localStorage.getItem("studyhub_bookmarks") || "[]");
      const exists = saved.some((item) => item.id === doc.id || item._id === doc.id);

      let updated = [];
      if (exists) {
        updated = saved.filter((item) => item.id !== doc.id && item._id !== doc.id);
        setIsBookmarked(false);
        toast({
          title: "Đã bỏ lưu tài liệu",
          description: "Tài liệu đã được xóa khỏi danh sách đã lưu của bạn.",
        });
      } else {
        updated = [
          ...saved,
          {
            id: doc.id,
            title: doc.title,
            subject: doc.subjectName || doc.subject,
            uploader: doc.uploader || doc.uploaderId?.name || "StudyHub",
            size: doc.size,
            fileUrl: doc.fileUrl,
            savedAt: new Date().toISOString(),
          },
        ];
        setIsBookmarked(true);
        toast({
          title: "Đã lưu tài liệu",
          description: "Bạn có thể xem lại tài liệu này trong trang Hồ sơ cá nhân.",
        });
      }
      localStorage.setItem("studyhub_bookmarks", JSON.stringify(updated));
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu tài liệu vào trình duyệt.",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({
        title: "Đã sao chép liên kết",
        description: "Liên kết tài liệu đã được lưu vào bộ nhớ tạm để bạn chia sẻ!",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast({
        title: "Chia sẻ liên kết",
        description: url,
      });
    }
  };

  if (!doc) return null;

  const downloadCount = Number(doc.downloadCount) || 0;

  return (
    <div className="space-y-4">
      {/* Primary actions */}
      <div className="grid gap-2.5">
        {/* Main Download CTA */}
        <Button
          type="button"
          disabled={fileUnavailable}
          onClick={() => onDownload?.(doc)}
          className="group h-12 w-full justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 text-white shadow-[0_12px_28px_-14px_rgba(5,150,105,0.85)] transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_16px_32px_-14px_rgba(5,150,105,0.95)] active:scale-[0.99] disabled:bg-none disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-sm font-bold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/20">
              <Download className="h-4 w-4" />
            </span>
            <span className="truncate">
              {fileUnavailable ? "Tệp không khả dụng" : "Tải xuống tài liệu"}
            </span>
          </span>
          {!fileUnavailable && (
            <span
              className="ml-3 inline-flex shrink-0 items-baseline gap-1 rounded-full bg-white px-2.5 py-1 text-red-600 shadow-sm ring-1 ring-black/5"
              aria-label={`${downloadCount} lượt tải`}
            >
              <span className="text-sm font-black leading-none">{downloadCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-red-500">lượt</span>
            </span>
          )}
        </Button>

        {/* View in new tab */}
        {doc.fileUrl && (
          <Button
            type="button"
            variant="outline"
            disabled={fileUnavailable}
            onClick={() => {
              if (!fileUnavailable) {
                window.open(normalizeFileUrl(doc.fileUrl), "_blank", "noopener,noreferrer");
              }
            }}
            className="h-11 w-full justify-start gap-2.5 rounded-2xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <FileText className="h-4 w-4" />
            </span>
            <span>Mở xem trực tiếp</span>
          </Button>
        )}
      </div>

      {fileUnavailable && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          {fileIssue || "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu."}
        </p>
      )}

      {/* Utility actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        {/* Bookmark Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleBookmark}
          className={`h-10 w-full rounded-xl border-slate-200 text-xs font-semibold gap-1.5 transition-colors dark:border-slate-700 ${
            isBookmarked
              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
          <span>{isBookmarked ? "Đã lưu" : "Lưu tài liệu"}</span>
        </Button>

        {/* Share Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-10 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-600 gap-1.5 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">Đã sao chép</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ</span>
            </>
          )}
        </Button>

      </div>

      {/* Report action */}
      <div>
        {hasReported ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Tài liệu đã được báo cáo",
                description:
                  reportStatus === "resolved"
                    ? "Báo cáo của bạn về tài liệu này đã được quản trị viên xử lý."
                    : "Bạn đã gửi báo cáo vi phạm cho tài liệu này và đang chờ ban quản trị xem xét.",
              });
            }}
            className="h-9 w-full rounded-xl border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700 gap-1.5 shadow-2xs cursor-pointer dark:border-amber-700/80 dark:bg-amber-950/40 dark:text-amber-400"
          >
            <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Đã báo cáo vi phạm</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReport?.(doc)}
            className="h-9 w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-500 gap-1.5 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Báo cáo vi phạm</span>
          </Button>
        )}
      </div>
    </div>
  );
}
