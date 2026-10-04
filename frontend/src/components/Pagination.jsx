import { ChevronLeft, ChevronRight } from "lucide-react";

/** Shared by client-side lists and server-side search results. */
export default function Pagination({ page, total, pageSize, onPageChange, totalPages: suppliedPages,
  itemLabel = "kết quả", label = "Phân trang", disabled = false }) {
  const pages = Math.max(1, suppliedPages ?? Math.ceil(total / pageSize));
  const current = Math.max(1, Math.min(page, pages));
  const start = total ? (current - 1) * pageSize + 1 : 0;
  const end = Math.min(current * pageSize, total);

  return (
    <nav className="list-pagination" aria-label={label}>
      <div className="pagination-summary">
        <span role="status">{start}–{end} / {total} {itemLabel}</span>
      </div>
      {pages > 1 && <div className="pagination-controls">
        <button type="button" className="pagination-direction" aria-label="Trang trước" disabled={disabled || current === 1}
          onClick={() => onPageChange(current - 1)}><ChevronLeft size={18} /><span>Trước</span></button>
        <button type="button" className="pagination-direction" aria-label="Trang sau" disabled={disabled || current === pages}
          onClick={() => onPageChange(current + 1)}><span>Sau</span><ChevronRight size={18} /></button>
      </div>}
    </nav>
  );
}
