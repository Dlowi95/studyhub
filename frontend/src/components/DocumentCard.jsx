import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Download, Star, Flag, CheckCircle2 } from "lucide-react";

export default function DocumentCard({ doc, onReport, onView }) {
  if (!doc) return null;

  return (
    <Card className="group bg-white hover:border-primary/50 hover:shadow-md transition-all duration-200 border-slate-200/80 rounded-2xl overflow-hidden text-left flex flex-col justify-between">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5 flex-grow">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              {doc.subject}
            </span>
            {doc.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-md border border-emerald-200/80">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã kiểm duyệt
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {doc.type} • {doc.size}
            </span>
          </div>

          <CardTitle
            onClick={() => onView?.(doc)}
            className="text-base md:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors cursor-pointer pt-1 line-clamp-2"
          >
            {doc.title}
          </CardTitle>
        </div>

        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="w-5 h-5" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-800">{doc.rating}</span>
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{doc.downloads}</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              Đăng bởi: <strong className="text-slate-700 font-medium">{doc.uploader}</strong>
            </span>
          </div>

          {/* Report Violation Action */}
          <button
            type="button"
            onClick={() => onReport?.(doc)}
            title="Báo cáo tài liệu vi phạm hoặc sai nội dung"
            className="text-slate-400 hover:text-destructive flex items-center gap-1 text-xs hover:underline"
          >
            <Flag className="w-3 h-3" />
            <span>Báo cáo</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
