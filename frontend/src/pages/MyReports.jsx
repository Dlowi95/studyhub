import PageHeading from "@/components/PageHeading";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending: {
    label: "Đang chờ xử lý",
    badgeClass: "bg-warning/10 text-warning border-warning ",
    icon: Clock,
    color: "text-warning",
  },
  resolved: {
    label: "Đã xử lý",
    badgeClass: "bg-primary/10 text-primary border-primary ",
    icon: CheckCircle2,
    color: "text-primary",
  },
  dismissed: {
    label: "Đã bỏ qua",
    badgeClass: "bg-muted text-foreground border-border ",
    icon: XCircle,
    color: "text-muted-foreground",
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
    queueMicrotask(() => void fetchReports());
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
    <div className="reports-page page-shell max-w-5xl space-y-6 text-left pb-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground ">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Link to="/profile" className="hover:text-primary transition-colors">
          Hồ sơ cá nhân
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-semibold text-foreground ">Báo cáo của tôi</span>
      </nav>

      <PageHeading eyebrow="PHẢN HỒI CỦA BẠN" title="Báo cáo của tôi." description="Theo dõi tiến độ xử lý và phản hồi từ ban quản trị cho những tài liệu bạn đã báo cáo.">
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading} className="rounded-full gap-2"><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button>
      </PageHeading>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "all"
              ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary"
              : "bg-card border-border/80 hover:border-border "
          }`}
        >
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Tổng báo cáo
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {counts.all}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-warning/10 border-warning shadow-xs ring-1 ring-warning"
              : "bg-card border-border/80 hover:border-warning "
          }`}
        >
          <div className="text-[11px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ xử lý</span>
          </div>
          <div className="text-2xl font-extrabold text-warning mt-1">
            {counts.pending}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("resolved")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "resolved"
              ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
              : "bg-card border-border/80 hover:border-primary "
          }`}
        >
          <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã xử lý</span>
          </div>
          <div className="text-2xl font-extrabold text-primary mt-1">
            {counts.resolved}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("dismissed")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "dismissed"
              ? "bg-muted border-border shadow-xs ring-1 ring-primary"
              : "bg-card border-border/80 hover:border-border "
          }`}
        >
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã bỏ qua</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {counts.dismissed}
          </div>
        </button>
      </div>

      {/* Main Reports List */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs space-y-4">
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-muted-foreground ">Đang tải danh sách báo cáo...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
            <p className="text-xs font-semibold text-destructive ">{error}</p>
          </div>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <div className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground ">
                {filterStatus === "all"
                  ? "Bạn chưa gửi báo cáo vi phạm nào"
                  : `Không có báo cáo nào ở trạng thái này`}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
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
              const docTitle = report.documentId?.title || report.documentTitle || "Tài liệu học tập";

              return (
                <div
                  key={report._id}
                  className="p-5 rounded-2xl border border-border/70 bg-muted/50 hover:bg-card transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-card border border-border ${statusCfg.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-3">
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
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span className="line-clamp-1">{docTitle}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground italic">
                          Tài liệu đã bị xóa khỏi hệ thống
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-foreground pl-6 space-y-1">
                      <p>
                        <span className="font-semibold text-muted-foreground ">Lý do báo cáo: </span>
                        <span>{report.reason}</span>
                      </p>

                      {report.adminFeedback && (
                        <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-start gap-2">
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
