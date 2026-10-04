import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import FileTypeIcon from "@/components/FileTypeIcon";

const formatSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) return "Kích thước chưa rõ";
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function DocumentVariantSelector({ variants = [], selectedId, onSelect }) {
  if (variants.length < 2) return null;

  return (
    <section className="document-variants" aria-label="Các định dạng của bài giảng">
      <div className="document-variants-heading">
        <span className="document-variants-icon"><FileText size={16} /></span>
        <div>
          <h3>Chọn định dạng tải xuống</h3>
          <p>Chọn một bản để cập nhật xem trước và nút tải tài liệu.</p>
        </div>
        <span className="document-variants-count">{variants.length} bản</span>
      </div>
      <div className="document-variants-list">
        {variants.map((variant) => {
          const id = String(variant._id || variant.id);
          const active = id === String(selectedId);
          const format = String(variant.type || variant.fileType || "Tệp").toUpperCase();
          return (
            <button
              key={id}
              type="button"
              className={`document-variant-option${active ? " is-active" : ""}${variant.fileAvailable === false ? " is-unavailable" : ""}`}
              onClick={() => onSelect?.(variant)}
              aria-pressed={active}
            >
              <FileTypeIcon format={format} className="document-variant-format-icon" />
              <span className="document-variant-detail">
                <strong>{format}</strong>
                <span>{formatSize(variant.fileSize)} · {variant.downloadCount || variant.downloads || 0} lượt tải</span>
                {variant.fileAvailable === false && <span className="document-variant-warning"><AlertCircle size={12} /> Tệp đang lỗi</span>}
              </span>
              <span className="document-variant-download" aria-hidden="true">
                {active ? <CheckCircle2 size={16} /> : <FileText size={15} />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
