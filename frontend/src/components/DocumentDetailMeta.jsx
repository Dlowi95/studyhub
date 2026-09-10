import React from "react";
import { Download, Eye, Star, Tag, FileText } from "lucide-react";

export default function DocumentDetailMeta({ doc }) {
  if (!doc) return null;

  const tags = Array.isArray(doc.tags) ? doc.tags.filter((t) => t && t !== "Khác") : [];

  return (
    <div className="space-y-4">
      {/* 4 Bento Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Views */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Lượt xem
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            {doc.viewCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Sinh viên đã đọc</span>
        </div>

        {/* Downloads */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-200 dark:hover:border-blue-800/60 transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Lượt tải
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            {doc.downloadCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Lần tải về máy</span>
        </div>

        {/* Rating - NO MOCK 4.8 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-amber-200 dark:hover:border-amber-800/60 transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Đánh giá
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {doc.avgRating && doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "0.0"}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {doc.avgRating && doc.avgRating > 0 ? "Điểm trung bình" : "Chưa có đánh giá"}
          </span>
        </div>

        {/* File Format & Size */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Định dạng
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white uppercase">
            {doc.type || "FILE"}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{doc.size || "Tài liệu học tập"}</span>
        </div>
      </div>

      {/* Tags (Only show if real tags exist) */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Từ khóa học phần
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
