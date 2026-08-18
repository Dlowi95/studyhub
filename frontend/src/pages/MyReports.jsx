import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_MAP = {
  pending: { label: "Đang chờ xử lý", variant: "secondary" },
  resolved: { label: "Đã xử lý", variant: "default" },
  dismissed: { label: "Đã bỏ qua", variant: "outline" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Trang "Báo cáo của tôi" — danh sách các báo cáo vi phạm mà người dùng
 * hiện tại đã gửi, kèm trạng thái xử lý.
 *
 * Cần được thêm vào App.jsx, vd:
 *   <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
 */
export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Không tải được danh sách báo cáo");
        setReports(data.reports || []);
      } catch (err) {
        setError(err.message || "Không tải được danh sách báo cáo");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Báo cáo của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi các báo cáo vi phạm bạn đã gửi và trạng thái xử lý.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      )}

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && reports.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Bạn chưa gửi báo cáo vi phạm nào.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tài liệu</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Ngày xử lý</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const status = STATUS_MAP[report.status] || STATUS_MAP.pending;
                return (
                  <TableRow key={report._id}>
                    <TableCell className="font-medium">
                      {report.documentId ? (
                        <Link
                          to={`/documents/${report.documentId._id}`}
                          className="hover:underline"
                        >
                          {report.documentId.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Tài liệu đã bị xoá</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={report.reason}>
                      {report.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>{formatDate(report.resolvedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}