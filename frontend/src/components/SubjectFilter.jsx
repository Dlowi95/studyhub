import React from "react";
import { Badge } from "@/components/ui/badge";

export default function SubjectFilter({ subjects = [], selectedSubject = "", onSelectSubject }) {
  return (
    <div className="space-y-3.5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Phân loại học phần
          </h2>
          {selectedSubject && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
              Đang lọc: {selectedSubject}
            </Badge>
          )}
        </div>
        {selectedSubject && (
          <button
            type="button"
            onClick={() => onSelectSubject("")}
            className="text-xs text-muted-foreground hover:text-primary font-medium"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((sub, idx) => {
          const isActive = (sub === "Tất cả" && !selectedSubject) || selectedSubject === sub;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSubject(sub === "Tất cả" || selectedSubject === sub ? "" : sub)}
              className={`px-3.5 py-1.5 text-xs md:text-sm rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {sub}
            </button>
          );
        })}
      </div>
    </div>
  );
}
