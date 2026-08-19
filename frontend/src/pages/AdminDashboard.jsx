import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Search,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "reports" | "users"
  const [users, setUsers] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPendingDoc, setSelectedPendingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState("Tài liệu không rõ nguồn gốc hoặc chất lượng kém");

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch Pending Documents
  const fetchPendingDocuments = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/documents?status=pending`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingDocs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Reports
  const fetchReports = async () => {
    try {
      const res = await fetch(`${apiUrl}/reports`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setReports(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/users`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const adminStr = localStorage.getItem("user");
    if (adminStr) {
      try {
        setCurrentAdmin(JSON.parse(adminStr));
      } catch (e) {
        console.error(e);
      }
    }
    fetchPendingDocuments();
    fetchReports();
    fetchUsers();
  }, []);

  // Approve Document
  const handleApproveDoc = async (docId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        setPendingDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        alert("Đã phê duyệt tài liệu thành công.");
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi duyệt tài liệu");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Reject Document
  const handleOpenRejectModal = (doc) => {
    setSelectedPendingDoc(doc);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPendingDoc) return;
    const docId = selectedPendingDoc._id || selectedPendingDoc.id;

    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        setPendingDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        setRejectModalOpen(false);
        alert(`Đã từ chối tài liệu. Lý do: ${rejectReason}`);
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi từ chối tài liệu");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Reports
  const handleDismissReport = async (reportId) => {
    try {
      await fetch(`${apiUrl}/reports/${reportId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "dismissed" }),
      });
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== reportId));
    } catch (err) {
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== reportId));
    }
  };

  const handleRemoveReportedDoc = async (reportId, docId) => {
    try {
      if (docId) {
        await fetch(`${apiUrl}/admin/documents/${docId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== reportId));
      alert("Đã gỡ bỏ tài liệu vi phạm.");
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Toggle User Active / Blocked
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
        );
      } else {
        alert(data.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Bảng quản trị kiểm duyệt
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Quản trị viên: <strong className="text-slate-800">{currentAdmin?.name}</strong> ({currentAdmin?.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
              Về trang chủ
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
              Hồ sơ cá nhân
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => { setActiveTab("pending"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
            activeTab === "pending"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Hàng đợi kiểm duyệt</span>
          {pendingDocs.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
              {pendingDocs.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("reports"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
            activeTab === "reports"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Xử lý báo cáo vi phạm</span>
          {reports.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === "reports" ? "bg-white/20 text-white" : "bg-red-100 text-red-800"}`}>
              {reports.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
            activeTab === "users"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý thành viên</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
            {users.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING DOCUMENTS */}
      {activeTab === "pending" && (
        <Card className="shadow-xs border-slate-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">
              Tài liệu đang chờ kiểm duyệt ({pendingDocs.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Xem xét chất lượng nội dung trước khi phê duyệt hiển thị công khai.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDocs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-semibold text-slate-800 text-sm">Hàng đợi kiểm duyệt đang trống</p>
                <p className="text-xs text-slate-500">Tất cả tài liệu mới đã được xử lý xong.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 text-xs">
                    <TableRow>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead>Học phần</TableHead>
                      <TableHead>Người đăng</TableHead>
                      <TableHead>Định dạng</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Hành động duyệt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {pendingDocs.map((doc) => (
                      <TableRow key={doc._id || doc.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900 max-w-xs">
                          <div className="truncate" title={doc.title}>{doc.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                            {doc.subjectName || doc.subjectId?.name || "Khác"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-800">{doc.uploaderId?.name || "Thành viên"}</div>
                            <div className="text-[10px] text-slate-400">{doc.uploaderId?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-mono">
                          {doc.fileType || "PDF"}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {doc.fileUrl && (
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" className="h-8 px-2 text-xs rounded-lg border-slate-200">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleApproveDoc(doc._id || doc.id)}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRejectModal(doc)}
                              className="h-8 px-3 text-destructive hover:bg-destructive/10 border-slate-200 rounded-lg text-xs font-semibold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Từ chối
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: REPORTS MANAGEMENT */}
      {activeTab === "reports" && (
        <Card className="shadow-xs border-slate-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">
              Danh sách báo cáo vi phạm ({reports.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Xử lý các khiếu nại về bản quyền, nội dung sai lệch hoặc sai học phần.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {reports.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-semibold text-slate-800 text-sm">Không có báo cáo vi phạm nào</p>
                <p className="text-xs text-slate-500">Hệ thống hoạt động ổn định và an toàn.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 text-xs">
                    <TableRow>
                      <TableHead>Tài liệu bị báo cáo</TableHead>
                      <TableHead>Người báo cáo</TableHead>
                      <TableHead>Lý do vi phạm</TableHead>
                      <TableHead>Mô tả chi tiết</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Hành động xử lý</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {reports.map((rep) => (
                      <TableRow key={rep._id || rep.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900 max-w-xs">
                          <div className="truncate">{rep.documentId?.title || rep.docTitle || "Tài liệu"}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {rep.reporterId?.name || rep.reporter || "Thành viên"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px]">
                            {rep.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate" title={rep.details}>
                          {rep.details || "Không có mô tả"}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismissReport(rep._id || rep.id)}
                              className="h-8 px-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              Bỏ qua
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRemoveReportedDoc(rep._id || rep.id, rep.documentId?._id || rep.docId)}
                              className="h-8 px-2.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Gỡ tài liệu
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === "users" && (
        <Card className="shadow-xs border-slate-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Quản lý thành viên ({users.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Xem danh sách và khóa/mở khóa tài khoản thành viên.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm theo tên, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white rounded-xl"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 text-xs">
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        {loading ? "Đang tải danh sách..." : "Không có thành viên nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users
                      .filter(
                        (u) =>
                          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((u) => (
                        <TableRow key={u._id} className="hover:bg-slate-50/60">
                          <TableCell>
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase">
                              {u.name?.charAt(0) || "U"}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                          <TableCell className="text-slate-600">{u.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                u.role === "admin"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : u.role === "moderator"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                u.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                            >
                              {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={u.status === "active" ? "outline" : "default"}
                              disabled={u._id === currentAdmin?.id || u._id === currentAdmin?._id}
                              onClick={() => toggleUserStatus(u._id, u.status)}
                              className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                                u.status === "active"
                                  ? "text-destructive hover:bg-destructive/10 border-slate-200"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {u.status === "active" ? (
                                <>
                                  <Lock className="w-3.5 h-3.5 mr-1" />
                                  Khóa
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5 mr-1" />
                                  Mở khóa
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border-slate-200 shadow-xl text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Từ chối phê duyệt tài liệu
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 line-clamp-1">
              Tài liệu: {selectedPendingDoc?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-slate-700">Chọn hoặc nhập lý do từ chối</Label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="Tài liệu không rõ nguồn gốc hoặc chất lượng kém">Tài liệu không rõ nguồn gốc / chất lượng kém</option>
              <option value="Tài liệu trùng lặp với tài liệu đã có trên hệ thống">Tài liệu trùng lặp đã có trên hệ thống</option>
              <option value="Phân loại sai môn học hoặc thiếu thông tin cần thiết">Phân loại sai môn học / thiếu thông tin</option>
              <option value="Tài liệu vi phạm bản quyền / chính sách chia sẻ">Vi phạm bản quyền / chính sách chia sẻ</option>
            </select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" size="sm" onClick={handleConfirmReject} className="bg-destructive hover:bg-destructive/90 text-white">
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
