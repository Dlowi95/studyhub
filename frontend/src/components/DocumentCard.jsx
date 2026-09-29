import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Flag,
  Star,
} from "lucide-react";

const getFilePalette = (fileType = "") => {
  const normalizedType = fileType.toUpperCase();

  if (normalizedType.includes("PDF")) {
    return {
      badge: "bg-rose-500/15 text-rose-100 border-rose-300/20",
      icon: "bg-rose-500 text-white",
      gradient: "from-rose-950 via-slate-900 to-slate-950",
    };
  }

  if (normalizedType.includes("DOC")) {
    return {
      badge: "bg-blue-500/15 text-blue-100 border-blue-300/20",
      icon: "bg-blue-500 text-white",
      gradient: "from-blue-950 via-slate-900 to-slate-950",
    };
  }

  if (normalizedType.includes("PPT")) {
    return {
      badge: "bg-orange-500/15 text-orange-100 border-orange-300/20",
      icon: "bg-orange-500 text-white",
      gradient: "from-orange-950 via-slate-900 to-slate-950",
    };
  }

  if (normalizedType.includes("XLS")) {
    return {
      badge: "bg-emerald-500/15 text-emerald-100 border-emerald-300/20",
      icon: "bg-emerald-500 text-white",
      gradient: "from-emerald-950 via-slate-900 to-slate-950",
    };
  }

  return {
    badge: "bg-violet-500/15 text-violet-100 border-violet-300/20",
    icon: "bg-violet-500 text-white",
    gradient: "from-violet-950 via-slate-900 to-slate-950",
  };
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Mới cập nhật";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "Mới cập nhật";
  return parsedDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function DocumentCard({ doc, onReport, onView }) {
  if (!doc) return null;

  const isVerified = Boolean(doc.isVerified ?? doc.status === "approved");
  const subjectLabel = doc.subject || doc.subjectName || "Khác";
  const fileType = (doc.type || doc.fileType || "FILE").toString().toUpperCase();
  const palette = getFilePalette(fileType);
  const openDocument = () => {
    if (isVerified) onView?.(doc);
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border-slate-200/80 bg-white text-left shadow-[0_14px_40px_-30px_rgba(15,23,42,0.6)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-[0_24px_55px_-28px_rgba(5,150,105,0.45)] dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={openDocument}
        disabled={!isVerified}
        aria-label={isVerified ? `Xem tài liệu ${doc.title}` : `${doc.title} đang chờ duyệt`}
        className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${palette.gradient} text-left disabled:cursor-default`}
      >
        <div className="absolute -right-9 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="absolute -bottom-16 left-2 h-32 w-40 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="document-cover-grid absolute inset-0 opacity-25" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] ${palette.badge}`}>
            {fileType}
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-100 backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" /> Đã duyệt
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <div className="relative h-[4.5rem] w-14 rounded-lg border border-white/20 bg-white/95 p-2 shadow-xl transition duration-300 group-hover:-rotate-2 group-hover:scale-105">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${palette.icon}`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="mt-2 h-1 w-8 rounded-full bg-slate-200" />
            <div className="mt-1 h-1 w-6 rounded-full bg-slate-200" />
          </div>
          <div className="pb-1 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Học phần</p>
            <p className="mt-0.5 max-w-[12rem] truncate text-xs font-bold">{subjectLabel}</p>
          </div>
        </div>

        {isVerified && (
          <span className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition group-hover:bg-emerald-500">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </button>

      <CardHeader className="space-y-3 p-5 pb-3">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(doc.createdAt)}
          </span>
          {doc.size && <span>{doc.size}</span>}
        </div>

        <CardTitle className="min-h-12 text-base font-extrabold leading-6 tracking-[-0.01em] text-slate-900 dark:text-white">
          <button
            type="button"
            onClick={openDocument}
            disabled={!isVerified}
            className="line-clamp-2 text-left transition-colors group-hover:text-emerald-700 disabled:cursor-default dark:group-hover:text-emerald-300"
          >
            {doc.title}
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="mt-auto p-5 pt-0">
        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5" title="Điểm đánh giá">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{doc.rating ?? 0}</span>
            </span>
            <span className="flex items-center gap-1.5" title="Lượt tải">
              <Download className="h-3.5 w-3.5" />
              <span>{doc.downloads ?? 0}</span>
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <span className="max-w-28 truncate text-[11px] text-slate-400 dark:text-slate-500">{doc.uploader}</span>
            <button
              type="button"
              onClick={() => onReport?.(doc)}
              aria-label={`Báo cáo tài liệu ${doc.title}`}
              title="Báo cáo vi phạm"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
