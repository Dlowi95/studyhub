import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Fragment } from "react";
import FollowButton from "@/components/FollowButton";
import FileTypeIcon from "@/components/FileTypeIcon";

export default function DocumentDetailHeader({ doc }) {
  if (!doc) return null;

  const uploaderName = doc.uploaderId?.name || doc.uploader || "Thành viên StudyHub";
  const uploaderInitial = uploaderName.charAt(0).toUpperCase();
  const titleParts = String(doc.title || "Tài liệu").split("_");

  return (
    <div className="min-w-0 space-y-4 text-left">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Subject Pill */}
        <span className="max-w-full [overflow-wrap:anywhere] rounded-xl bg-primary/10 text-primary border border-primary/80 px-3 py-1 text-xs font-bold">
          {doc.subjectName || doc.subject || "Học phần chung"}
        </span>

        {/* File Format Pill */}
        <span className="document-format-badge rounded-xl bg-muted text-foreground border border-border px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
          <FileTypeIcon format={doc.type || doc.fileType} />
          {doc.type || "FILE"}
        </span>

        {/* Moderation Status */}
        {doc.status === "approved" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/80 px-3 py-1 text-xs font-semibold text-primary shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary " />
            Đã kiểm duyệt chính thức
          </span>
        )}
        {doc.status === "pending" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning/10 border border-warning/80 px-3 py-1 text-xs font-semibold text-warning shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-warning " />
            Đang chờ duyệt nội dung
          </span>
        )}
        {doc.status === "rejected" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 border border-destructive/80 px-3 py-1 text-xs font-semibold text-destructive">
            <XCircle className="w-3.5 h-3.5" />
            Bị từ chối
          </span>
        )}
      </div>

      {/* Document Title */}
      <h1 className="document-title text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground">
        {titleParts.map((part, index) => <Fragment key={index}>{part}{index < titleParts.length - 1 && <>_<wbr /></>}</Fragment>)}
      </h1>

      {/* Uploader Bento Info Strip */}
      <div className="document-uploader-strip flex flex-wrap items-center gap-3 py-2 text-xs md:text-sm text-muted-foreground border-y border-border">
        <div className="flex min-w-0 max-w-full items-center gap-2">
          <div className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
            {uploaderInitial}
          </div>
          <span className="[overflow-wrap:anywhere] font-semibold text-foreground">{uploaderName}</span>
          <FollowButton uploaderId={doc.uploaderId?._id || doc.uploaderId} uploaderName={uploaderName} />
        </div>

        <span className="document-published-date inline-flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          Ngày đăng:{" "}
          {doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "Gần đây"}
        </span>

      </div>
    </div>
  );
}
