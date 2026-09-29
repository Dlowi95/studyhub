import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending: {
    label: "Đang chờ xử lý",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    icon: Clock,
    color: "text-amber-500",
  },
  resolved: {
    label: "Đã xử lý",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  dismissed: {
    label: "Đã bỏ qua",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    icon: XCircle,
    color: "text-slate-400",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bạn cần đăng nhập để xem danh sách báo cáo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/reports/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách báo cáo");
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(err.message || "Không tải được danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 text-left">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-primary dark:hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <Link to="/profile" className="hover:text-primary dark:hover:text-primary transition-colors">
          Hồ sơ cá nhân
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">Báo cáo của tôi</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Báo cáo vi phạm của tôi
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi tiến độ, tình trạng xử lý và phản hồi từ ban quản trị StudyHub cho các tài liệu bạn đã báo cáo.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReports}
          disabled={loading}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "all"
              ? "bg-primary/5 dark:bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tổng báo cáo
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {counts.all}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 shadow-xs ring-1 ring-amber-500"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/80"
          }`}
        >
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ xử lý</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {counts.pending}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("resolved")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "resolved"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/80"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã xử lý</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {counts.resolved}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("dismissed")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "dismissed"
              ? "bg-slate-100 dark:bg-slate-800/80 border-slate-500 shadow-xs ring-1 ring-slate-500"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã bỏ qua</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">
            {counts.dismissed}
          </div>
        </button>
      </div>

      {/* Main Reports List */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-4">
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đang tải danh sách báo cáo...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto" />
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <div className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {filterStatus === "all"
                  ? "Bạn chưa gửi báo cáo vi phạm nào"
                  : `Không có báo cáo nào ở trạng thái này`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Khi bạn phát hiện tài liệu có nội dung sai lệch, vi phạm bản quyền hoặc spam, hãy dùng tính năng "Báo cáo vi phạm" trên trang tài liệu.
              </p>
            </div>
            <Link to="/" className="inline-block pt-2">
              <Button size="sm" className="rounded-xl text-xs font-semibold">
                Khám phá tài liệu
              </Button>
            </Link>
          </div>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const docId = report.documentId?._id || report.documentId?.id || report.documentId;
              const docTitle = report.documentId?.title || "Tài liệu học tập";

              return (
                <div
                  key={report._id}
                  className="p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ${statusCfg.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-3">
                      <span>Gửi ngày: {formatDate(report.createdAt)}</span>
                      {report.resolvedAt && (
                        <span>• Đã xử lý: {formatDate(report.resolvedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      {report.documentId ? (
                        <Link
                          to={`/document/${docId}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span className="line-clamp-1">{docTitle}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">
                          Tài liệu đã bị xóa khỏi hệ thống
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 pl-6 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Lý do báo cáo: </span>
                        <span>{report.reason}</span>
                      </p>

                      {report.adminFeedback && (
                        <div className="mt-2 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-primary">Phản hồi từ Quản trị viên: </span>
                            <span>{report.adminFeedback}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
