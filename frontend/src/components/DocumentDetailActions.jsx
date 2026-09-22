import React, { useState, useEffect } from "react";
import { Download, FileText, MessageSquareWarning, Bookmark, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DocumentDetailActions({ doc, onDownload, onReport, hasReported = false, reportStatus = null }) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!doc?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem("studyhub_bookmarks") || "[]");
      setIsBookmarked(saved.some((item) => item.id === doc.id || item._id === doc.id));
    } catch (e) {}
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
    } catch (e) {
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
    } catch (err) {
      toast({
        title: "Chia sẻ liên kết",
        description: url,
      });
    }
  };

  if (!doc) return null;

  return (
    <div className="space-y-3">
      {/* Primary & Secondary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Main Download CTA */}
        <Button
          type="button"
          onClick={() => onDownload?.(doc)}
          className="w-full sm:flex-1 min-w-0 bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-4 font-bold shadow-xs active:scale-[0.98] transition-all gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Tải xuống tài liệu</span>
          {doc.downloadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
              {doc.downloadCount}
            </span>
          )}
        </Button>

        {/* View in new tab */}
        {doc.fileUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(encodeURI(doc.fileUrl), "_blank", "noopener,noreferrer")}
            className="w-full sm:flex-1 min-w-0 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-11 px-4 text-slate-700 dark:text-slate-200 font-semibold text-sm gap-2"
          >
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Mở xem trực tiếp</span>
          </Button>
        )}
      </div>

      {/* Utility Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Bookmark Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleBookmark}
          className={`rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1.5 h-9 transition-colors ${
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
          className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold gap-1.5 h-9"
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

        {/* Report Button (Yêu cầu 1 & 5) */}
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
            className="rounded-xl border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold gap-1.5 h-9 ml-0 sm:ml-auto shadow-2xs cursor-pointer"
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
            className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:border-red-300 dark:hover:border-red-900/60 hover:bg-red-50/80 dark:hover:bg-red-950/30 text-xs font-semibold gap-1.5 h-9 ml-0 sm:ml-auto transition-colors"
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Báo cáo vi phạm</span>
          </Button>
        )}
      </div>
    </div>
  );
}
