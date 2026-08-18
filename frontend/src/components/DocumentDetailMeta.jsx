import { Download, Eye, Star, Tag } from "lucide-react";

export default function DocumentDetailMeta({ doc }) {
  if (!doc) return null;

  const tags = Array.isArray(doc.tags) ? doc.tags : [];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
          <Eye className="w-4 h-4" />
          Lượt xem
        </div>
        <div className="text-2xl font-bold text-slate-900">{doc.viewCount || 0}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
          <Download className="w-4 h-4" />
          Lượt tải
        </div>
        <div className="text-2xl font-bold text-slate-900">{doc.downloadCount || 0}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
          <Star className="w-4 h-4" />
          Đánh giá
        </div>
        <div className="text-2xl font-bold text-slate-900">{doc.avgRating || 4.8}</div>
      </div>

      {tags.length > 0 && (
        <div className="sm:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <Tag className="w-4 h-4" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
