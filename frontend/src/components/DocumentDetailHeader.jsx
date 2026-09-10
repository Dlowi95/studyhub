import React from "react";
import { CalendarDays, UserRound, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DocumentDetailHeader({ doc }) {
  if (!doc) return null;

  const uploaderName = doc.uploaderId?.name || doc.uploader || "Thành viên StudyHub";
  const uploaderInitial = uploaderName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 text-left">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Subject Pill */}
        <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold">
          {doc.subjectName || doc.subject || "Học phần chung"}
        </span>

        {/* File Format Pill */}
        <span className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
          {doc.type || "FILE"}
        </span>

        {/* Moderation Status */}
        {doc.status === "approved" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Đã kiểm duyệt chính thức
          </span>
        )}
        {doc.status === "pending" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Đang chờ duyệt nội dung
          </span>
        )}
        {doc.status === "rejected" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Tài liệu StudyHub
          </span>
        )}
      </div>

      {/* Document Title */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
        {doc.title}
      </h1>

      {/* Uploader Bento Info Strip */}
      <div className="flex flex-wrap items-center gap-4 py-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
            {uploaderInitial}
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{uploaderName}</span>
        </div>

        <span>•</span>

        <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
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
            <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 max-w-[200px] truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              {doc.fileName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
