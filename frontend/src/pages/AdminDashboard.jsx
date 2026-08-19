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
  Filter,
  ArrowUpRight,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "reports" | "users"
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();

  // Search filter inside tables
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPendingDoc, setSelectedPendingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState("Tài liệu không rõ nguồn gốc hoặc chất lượng kém");

  // Mock pending documents queue (Tab 1)
  const [pendingDocs, setPendingDocs] = useState([
    {
      id: "pen-1",
      title: "Đề thi giữa kỳ môn Kinh tế vi mô có đáp án - ĐH Kinh tế Quốc Dân",
      subject: "Kinh tế vi mô",
      type: "PDF",
      size: "3.4 MB",
      uploader: "Trần Minh Quân",
      uploaderEmail: "quan.tm@example.com",
      createdAt: "18/02/2026",
      status: "pending",
    },
    {
      id: "pen-2",
      title: "Slide bài giảng Hệ điều hành chương 1 đến chương 5",
      subject: "Hệ điều hành",
      type: "PPTX",
      size: "8.2 MB",
      uploader: "Phạm Thúy Hằng",
      uploaderEmail: "hang.pt@example.com",
      createdAt: "17/02/2026",
      status: "pending",
    },
    {
      id: "pen-3",
      title: "Đề cương trắc nghiệm Pháp luật đại cương (300 câu hỏi)",
      subject: "Pháp luật đại cương",
      type: "DOCX",
      size: "1.5 MB",
      uploader: "Ngô Văn Hùng",
      uploaderEmail: "hung.nv@example.com",
      createdAt: "16/02/2026",
      status: "pending",
    },
  ]);

  // Mock reports management (Tab 2)
  const [reports, setReports] = useState([
    {
      id: "rep-1",
      docId: "doc-1",
      docTitle: "Tóm tắt công thức Vật lý đại cương 1",
      reporter: "Nguyễn Văn Tuấn",
      reason: "Nội dung sai lệch, đề thi lỗi đáp án",
      details: "Công thức phần Dao động điều hòa trang 3 bị sai dấu âm.",
      reportedAt: "17/02/2026",
      status: "pending",
    },
    {
      id: "rep-2",
      docId: "doc-3",
      docTitle: "Tài liệu ôn tập Cơ sở dữ liệu kỳ 2025.1",
      reporter: "Lê Hoàng Yến",
      reason: "Vi phạm bản quyền / Tài liệu cấm chia sẻ",
      details: "Tài liệu này là đề thi nội bộ chưa được giảng viên cho phép công bố.",
      reportedAt: "15/02/2026",
      status: "pending",
    },
  ]);

  // Fetch users from API (Tab 3)
  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingUsers(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
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
    fetchUsers();
  }, []);

  // Handlers for Tab 1: Pending Moderation
  const handleApproveDoc = (docId) => {
    setPendingDocs(pendingDocs.filter((d) => d.id !== docId));
    alert("Đã phê duyệt tài liệu thành công. Tài liệu hiện đã hiển thị công khai.");
  };

  const handleOpenRejectModal = (doc) => {
    setSelectedPendingDoc(doc);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedPendingDoc) return;
    setPendingDocs(pendingDocs.filter((d) => d.id !== selectedPendingDoc.id));
    setRejectModalOpen(false);
    alert(`Đã từ chối tài liệu: "${selectedPendingDoc.title}". Lý do: ${rejectReason}`);
  };

  // Handlers for Tab 2: Reports
  const handleDismissReport = (reportId) => {
    setReports(reports.filter((r) => r.id !== reportId));
    alert("Đã bỏ qua báo cáo.");
  };

  const handleRemoveReportedDoc = (reportId, docTitle) => {
    setReports(reports.filter((r) => r.id !== reportId));
    alert(`Đã gỡ bỏ tài liệu vi phạm: "${docTitle}".`);
  };

  // Handlers for Tab 3: Users
  const toggleUserStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "active" ? "blocked" : "active";

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Không thể cập nhật trạng thái");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleChangeRole = (userId, currentRole) => {
    const nextRole = currentRole === "student" ? "moderator" : currentRole === "moderator" ? "admin" : "student";
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: nextRole } : u))
    );
    alert(`Đã chuyển vai trò thành viên sang: ${nextRole}`);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Tài liệu đang chờ kiểm duyệt ({pendingDocs.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Xem xét chất lượng nội dung trước khi phê duyệt hiển thị công khai.
                </CardDescription>
              </div>
            </div>
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
                      <TableRow key={doc.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900 max-w-xs">
                          <div className="truncate" title={doc.title}>{doc.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                            {doc.subject}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-800">{doc.uploader}</div>
                            <div className="text-[10px] text-slate-400">{doc.uploaderEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-mono">
                          {doc.type} • {doc.size}
                        </TableCell>
                        <TableCell className="text-slate-500">{doc.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDoc(doc.id)}
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
                      <TableRow key={rep.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900 max-w-xs">
                          <div className="truncate" title={rep.docTitle}>{rep.docTitle}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{rep.reporter}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px]">
                            {rep.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate" title={rep.details}>
                          {rep.details}
                        </TableCell>
                        <TableCell className="text-slate-500">{rep.reportedAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismissReport(rep.id)}
                              className="h-8 px-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              Bỏ qua
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRemoveReportedDoc(rep.id, rep.docTitle)}
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
                  Phân quyền tài khoản (Admin, Moderator, Student) và khóa/mở khóa thành viên.
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
                        {loadingUsers ? "Đang tải danh sách..." : "Không có thành viên nào."}
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
                            <button
                              type="button"
                              onClick={() => handleChangeRole(u._id, u.role)}
                              title="Bấm để chuyển đổi vai trò"
                              className="focus:outline-none"
                            >
                              <Badge
                                variant="outline"
                                className={`text-[11px] cursor-pointer hover:opacity-80 ${
                                  u.role === "admin"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : u.role === "moderator"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {u.role}
                              </Badge>
                            </button>
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
                              disabled={u._id === currentAdmin?.id}
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
