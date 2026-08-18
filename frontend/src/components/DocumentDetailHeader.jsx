import { CalendarDays, UserRound, FileText, BadgeCheck } from "lucide-react";

export default function DocumentDetailHeader({ doc }) {
  if (!doc) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          {doc.subjectName || doc.subject || "Khác"}
        </span>
        {doc.status === "approved" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            <BadgeCheck className="w-3.5 h-3.5" />
            Đã duyệt
          </span>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            {doc.uploaderId?.name || "StudyHub"}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : "Mới"}
          </span>
          <span className="inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {doc.fileType || "FILE"}
          </span>
        </div>
      </div>
    </div>
  );
}
