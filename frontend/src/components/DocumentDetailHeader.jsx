import { CalendarDays, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function DocumentDetailHeader({ doc }) {
  if (!doc) return null;

  const uploaderName = doc.uploaderId?.name || doc.uploader || "Thành viên StudyHub";
  const uploaderInitial = uploaderName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 text-left">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Subject Pill */}
        <span className="rounded-xl bg-primary/10 text-primary border border-primary/80 px-3 py-1 text-xs font-bold">
          {doc.subjectName || doc.subject || "Học phần chung"}
        </span>

        {/* File Format Pill */}
        <span className="rounded-xl bg-muted text-foreground border border-border px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
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
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
        {doc.title}
      </h1>

      {/* Uploader Bento Info Strip */}
      <div className="flex flex-wrap items-center gap-4 py-2 text-xs md:text-sm text-muted-foreground border-y border-border ">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
            {uploaderInitial}
          </div>
          <span className="font-semibold text-foreground ">{uploaderName}</span>
        </div>

        <span>•</span>

        <span className="inline-flex items-center gap-1.5 text-muted-foreground ">
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

        {doc.fileName && (
          <>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground max-w-[200px] truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              {doc.fileName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
