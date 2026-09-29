import { SlidersHorizontal, X } from "lucide-react";

export default function SubjectFilter({ subjects = [], selectedSubject = "", onSelectSubject }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Lọc theo học phần</h2>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              {selectedSubject ? `Đang xem: ${selectedSubject}` : "Chọn nhóm nội dung bạn đang cần"}
            </p>
          </div>
        </div>

        {selectedSubject && (
          <button
            type="button"
            onClick={() => onSelectSubject("")}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Xóa lọc
          </button>
        )}
      </div>

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
        {subjects.map((subject) => {
          const isActive = (subject === "Tất cả" && !selectedSubject) || selectedSubject === subject;
          return (
            <button
              key={subject}
              type="button"
              onClick={() => onSelectSubject(subject === "Tất cả" || selectedSubject === subject ? "" : subject)}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                isActive
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.8)]"
                  : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
              }`}
            >
              {subject}
            </button>
          );
        })}
      </div>
    </div>
  );
}
