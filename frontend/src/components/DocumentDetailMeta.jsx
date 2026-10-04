import { Download, Eye, Star, Tag } from "lucide-react";
import FileTypeIcon from "@/components/FileTypeIcon";

export default function DocumentDetailMeta({ doc }) {
  if (!doc) return null;

  const tags = Array.isArray(doc.tags) ? doc.tags.filter((t) => t && t !== "Khác") : [];

  return (
    <div className="space-y-4">
      {/* 4 Bento Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Views */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 hover:border-border transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-muted-foreground " />
            Lượt xem
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-foreground ">
            {doc.viewCount || 0}
          </div>
          <span className="text-[11px] text-muted-foreground ">Sinh viên đã đọc</span>
        </div>

        {/* Downloads */}
        <div className="relative overflow-hidden rounded-2xl border border-destructive/80 bg-destructive/10 p-4 shadow-xs transition-all hover:border-destructive hover:shadow-sm ">
          <div className="pointer-events-none absolute -right-5 -top-6 h-16 w-16 rounded-full bg-destructive/10 hidden " />
          <div className="relative mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground ">
            <Download className="w-3.5 h-3.5 text-destructive " />
            Lượt tải
          </div>
          <div className="relative text-2xl font-black text-destructive md:text-3xl">
            {doc.downloadCount || 0}
          </div>
          <span className="relative text-[11px] font-medium text-destructive/80 ">Lần tải về máy</span>
        </div>

        {/* Rating - NO MOCK 4.8 */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 hover:border-warning transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
            Đánh giá
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-warning ">
            {doc.avgRating && doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "0.0"}
          </div>
          <span className="text-[11px] text-muted-foreground ">
            {doc.avgRating && doc.avgRating > 0 ? "Điểm trung bình" : "Chưa có đánh giá"}
          </span>
        </div>

        {/* File Format & Size */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 hover:border-primary transition-all shadow-xs">
          <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
            <FileTypeIcon format={doc.type || doc.fileType} className="document-format-meta-icon" />
            Định dạng
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-foreground uppercase">
            {doc.type || "FILE"}
          </div>
          <span className="text-[11px] text-muted-foreground ">{doc.size || "Tài liệu học tập"}</span>
        </div>
      </div>

      {/* Tags (Only show if real tags exist) */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-muted/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-muted-foreground " />
            Từ khóa học phần
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-lg bg-card px-2.5 py-1 text-xs font-medium text-foreground border border-border/80 shadow-2xs"
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
