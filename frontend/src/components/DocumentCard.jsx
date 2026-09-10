import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Download, Star, Flag, CheckCircle2 } from "lucide-react";

export default function DocumentCard({ doc, onReport, onView }) {
  if (!doc) return null;

  const isVerified = Boolean(doc.isVerified ?? doc.status === "approved");
  const subjectLabel = doc.subject || doc.subjectName || "Khác";
  const fileType = doc.type || doc.fileType || "FILE";

  return (
    <Card className="group bg-white dark:bg-slate-900 hover:border-primary/50 hover:shadow-md transition-all duration-200 border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden text-left flex flex-col justify-between">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5 flex-grow">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold">
              {subjectLabel}
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                Chờ duyệt
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {fileType}{doc.size ? ` • ${doc.size}` : ""}
            </span>
          </div>

          <CardTitle
            onClick={() => {
              if (isVerified) onView?.(doc);
            }}
            className={`text-base md:text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors pt-1 line-clamp-2 ${
              isVerified ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {doc.title}
          </CardTitle>
        </div>

        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform border border-emerald-100 dark:border-emerald-800/40">
          <FileText className="w-5 h-5" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.rating ?? 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>{doc.downloads ?? 0}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{doc.uploader}</span>
            <button
              onClick={() => onReport?.(doc)}
              title="Báo cáo vi phạm"
              className="text-slate-400 dark:text-slate-500 hover:text-destructive transition-colors p-1 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
