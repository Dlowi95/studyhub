import { useState, useEffect } from "react";
import { Download, FileText, MessageSquareWarning, Bookmark, Share2, Check, LoaderCircle } from "lucide-react";
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
  isDownloading = false,
}) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!doc?.id) return;
    let active = true;
    const syncBookmark = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        queueMicrotask(() => { if (active) setIsBookmarked(false); });
        return;
      }
      fetch(`${apiUrl}/bookmarks/${doc.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => {
          if (!response.ok) throw new Error("Không thể kiểm tra tài liệu đã lưu");
          return response.json();
        })
        .then((data) => { if (active) setIsBookmarked(Boolean(data.bookmarked)); })
        .catch(() => { if (active) setIsBookmarked(false); });
    };
    syncBookmark();
    window.addEventListener("authChange", syncBookmark);
    return () => { active = false; window.removeEventListener("authChange", syncBookmark); };
  }, [apiUrl, doc?.id]);

  const handleToggleBookmark = async () => {
    if (!doc) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Đăng nhập để lưu tài liệu", description: "Tài liệu đã lưu sẽ đồng bộ trên mọi thiết bị." });
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
      return;
    }
    if (bookmarkBusy) return;
    setBookmarkBusy(true);
    try {
      const response = await fetch(`${apiUrl}/bookmarks/${doc.id}`, {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể cập nhật tài liệu đã lưu");
      setIsBookmarked(Boolean(data.bookmarked));
      window.dispatchEvent(new Event("bookmarksChanged"));
      toast({
        title: data.bookmarked ? "Đã lưu tài liệu" : "Đã bỏ lưu tài liệu",
        description: data.bookmarked ? "Danh sách đã lưu được đồng bộ theo tài khoản của bạn." : "Tài liệu đã được xóa khỏi danh sách đã lưu.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Không thể cập nhật tài liệu đã lưu",
        description: error.message,
      });
    } finally {
      setBookmarkBusy(false);
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
          disabled={fileUnavailable || isDownloading}
          onClick={() => onDownload?.(doc)}
          className="group h-12 w-full justify-between rounded-full bg-primary px-4 text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:bg-muted disabled:text-muted-foreground"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-sm font-bold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-foreground transition-colors group-hover:bg-card">
              {isDownloading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </span>
            <span className="truncate">
              {fileUnavailable
                ? "Tệp không khả dụng"
                : isDownloading
                  ? "Đang tải tài liệu..."
                  : "Tải xuống tài liệu"}
            </span>
          </span>
          {!fileUnavailable && (
            <span
              className="ml-3 inline-flex shrink-0 items-baseline gap-1 rounded-full bg-card px-2.5 py-1 text-destructive shadow-sm ring-1 ring-black/5"
              aria-label={`${downloadCount} lượt tải`}
            >
              <span className="text-sm font-black leading-none">{downloadCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-destructive">lượt</span>
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
            className="h-11 w-full justify-start gap-2.5 rounded-2xl border-border bg-card px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary "
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ">
              <FileText className="h-4 w-4" />
            </span>
            <span>Mở xem trực tiếp</span>
          </Button>
        )}
      </div>

      {fileUnavailable && (
        <p className="rounded-xl border border-warning bg-warning/10 px-3 py-2 text-[11px] leading-5 text-warning ">
          {fileIssue || "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu."}
        </p>
      )}

      {/* Utility actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 ">
        {/* Bookmark Button */}
        <Button
          type="button"
          variant="outline"
          disabled={bookmarkBusy}
          size="sm"
          onClick={handleToggleBookmark}
          className={`h-10 w-full rounded-xl border-border text-xs font-semibold gap-1.5 transition-colors  ${
            isBookmarked
              ? "bg-warning/10 text-warning border-warning hover:bg-warning/10 "
              : "text-foreground hover:bg-muted "
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-warning text-warning" : ""}`} />
          <span>{isBookmarked ? "Đã lưu" : "Lưu tài liệu"}</span>
        </Button>

        {/* Share Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-10 w-full rounded-xl border-border text-xs font-semibold text-foreground gap-1.5 hover:bg-muted "
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary " />
              <span className="text-primary ">Đã sao chép</span>
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
            className="h-9 w-full rounded-xl border-warning bg-warning/10 text-xs font-semibold text-warning gap-1.5 shadow-2xs cursor-pointer "
          >
            <MessageSquareWarning className="w-3.5 h-3.5 text-warning " />
            <span>Đã báo cáo vi phạm</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReport?.(doc)}
            className="h-9 w-full rounded-xl border-border bg-card text-xs font-semibold text-muted-foreground gap-1.5 transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive "
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Báo cáo vi phạm</span>
          </Button>
        )}
      </div>
    </div>
  );
}
