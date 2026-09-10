import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Files,
  GraduationCap,
  FileCheck2,
  LogOut,
  ExternalLink,
  Search,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  MoreVertical,
  Eye,
  BookOpen,
  MessageSquareWarning,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "users" | "documents" | "subjects" | "pending" | "reports"
  const [users, setUsers] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documentStats, setDocumentStats] = useState(null);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [docFilterStatus, setDocFilterStatus] = useState("all");
  const [lastUpdated, setLastUpdated] = useState("");

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

  const updateTimestamp = () => {
    const now = new Date();
    setLastUpdated(
      now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const fetchData = async () => {
    setLoading(true);
    updateTimestamp();
    try {
      // 1. Fetch real documents from MongoDB
      const docsRes = await fetch(`${apiUrl}/admin/documents`, { headers: getAuthHeaders() });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        const docsList = Array.isArray(docsData) ? docsData : [];
        setAllDocs(docsList);
        setPendingDocs(docsList.filter((d) => d.status === "pending"));
      }

      // 2. Fetch real users from MongoDB
      const userRes = await fetch(`${apiUrl}/admin/users`, { headers: getAuthHeaders() });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);
      }

      // 3. Fetch real document statistics for the overview charts
      const statsRes = await fetch(`${apiUrl}/documents/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDocumentStats(statsData);
        const subjectStats = Array.isArray(statsData.bySubject) ? statsData.bySubject : [];
        const maxCount = Math.max(...subjectStats.map((subject) => subject.count || 0), 1);
        setSubjects(
          subjectStats.map((subject) => ({
            id: subject._id || subject.name,
            name: subject._id || "Khác",
            code: "",
            count: subject.count || 0,
            downloads: subject.downloads || 0,
            views: subject.views || 0,
            percentage: Math.round(((subject.count || 0) / maxCount) * 100),
          }))
        );
      }

      // 4. Fetch reports submitted by users
      const reportsRes = await fetch(`${apiUrl}/reports`, { headers: getAuthHeaders() });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(Array.isArray(reportsData.reports) ? reportsData.reports : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    fetchData();
  }, []);

  const handleApproveDoc = async (docId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi duyệt tài liệu");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleOpenRejectModal = (doc) => {
    setSelectedPendingDoc(doc);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPendingDoc) return;
    const docId = selectedPendingDoc._id || selectedPendingDoc.id;

    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi từ chối tài liệu");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này vĩnh viễn?")) return;
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAllDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        setPendingDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

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

  const handleReportAction = async (report, action) => {
    try {
      const documentId = report.documentId?._id;
      if (documentId) {
        const documentRes = await fetch(`${apiUrl}/admin/documents/${documentId}${action === "delete" ? "" : "/status"}`, {
          method: action === "delete" ? "DELETE" : "PATCH",
          headers: getAuthHeaders(),
          ...(action === "delete" ? {} : { body: JSON.stringify({ status: "rejected" }) }),
        });
        if (!documentRes.ok && documentRes.status !== 404) {
          const data = await documentRes.json();
          throw new Error(data.message || "Không thể cập nhật tài liệu");
        }
      }

      const reportRes = await fetch(`${apiUrl}/reports/${report._id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "resolved" }),
      });
      if (reportRes.ok) {
        fetchData();
      } else {
        const data = await reportRes.json();
        alert(data.message || "Không thể cập nhật báo cáo");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleReopenReport = async (report) => {
    try {
      if (report.documentId?._id) {
        const documentRes = await fetch(`${apiUrl}/admin/documents/${report.documentId._id}/status`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: "approved" }),
        });
        if (!documentRes.ok) {
          const data = await documentRes.json();
          throw new Error(data.message || "Không thể mở lại tài liệu");
        }
      }

      const reportRes = await fetch(`${apiUrl}/reports/${report._id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "pending" }),
      });
      if (!reportRes.ok) {
        const data = await reportRes.json();
        throw new Error(data.message || "Không thể mở lại báo cáo");
      }
      fetchData();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  const tabTitles = {
    overview: "Tổng quan",
    users: "Quản lý người dùng",
    documents: "Quản lý tài liệu",
    subjects: "Quản lý học phần",
    pending: "Kiểm duyệt tài liệu",
    reports: "Quản lý báo cáo",
  };

  const approvedDocsCount = documentStats?.summary?.approved ?? allDocs.filter((d) => d.status === "approved").length;
  const recentUsersCount = users.filter((user) => {
    const createdAt = new Date(user.createdAt).getTime();
    return createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).length;
  const activityChartData = (documentStats?.monthlyUploads || []).map((item) => ({
    month: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("vi-VN", {
      month: "short",
      year: "numeric",
    }),
    uploads: item.uploads,
  }));
  const fileFormatCounts = allDocs.reduce((counts, doc) => {
    const fileType = (doc.fileType || "OTHER").toString().split("/").pop().toUpperCase();
    const normalizedType = fileType === "MPEG" ? "MP4" : fileType;
    counts[normalizedType] = (counts[normalizedType] || 0) + 1;
    return counts;
  }, {});
  const fileFormatStats = Object.entries(fileFormatCounts)
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 3)
    .map(([type, count]) => ({
      type,
      percentage: allDocs.length ? Math.round((count / allDocs.length) * 100) : 0,
    }));
  const pendingReportsCount = reports.filter((report) => report.status === "pending").length;

  return (
    <div className="dark min-h-screen bg-[#090a0f] text-zinc-100 flex font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. LEFT SIDEBAR (Dark Theme Cố định) */}
      <aside className="w-64 bg-[#0f1015] border-r border-zinc-800/70 flex flex-col justify-between shrink-0 sticky top-0 h-screen select-none z-40">
        <div className="p-4 space-y-5">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-emerald-900/20 border border-emerald-500/30">
              S
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
                <span>Study</span>
                <span className="text-emerald-400">Hub</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-400/90 tracking-wider uppercase">
                HỆ THỐNG QUẢN TRỊ
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800/60" />

          {/* Navigation Items (Đúng 5 mục) */}
          <nav className="space-y-1 text-xs font-medium">
            {/* 1. Tổng quan */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === "overview" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Tổng quan</span>
              </div>
            </button>

            {/* 2. Quản lý người dùng */}
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "users"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeTab === "users" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Quản lý người dùng</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{users.length}</span>
            </button>

            {/* 3. Quản lý tài liệu */}
            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "documents"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Files className={`w-4 h-4 ${activeTab === "documents" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Quản lý tài liệu</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{allDocs.length}</span>
            </button>

            {/* 4. Quản lý học phần */}
            <button
              onClick={() => setActiveTab("subjects")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "subjects"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className={`w-4 h-4 ${activeTab === "subjects" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Quản lý học phần</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{subjects.length}</span>
            </button>

            {/* 5. Kiểm duyệt tài liệu */}
            <button
              onClick={() => setActiveTab("pending")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "pending"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className={`w-4 h-4 ${activeTab === "pending" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Kiểm duyệt tài liệu</span>
              </div>
              {pendingDocs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingDocs.length}
                </span>
              )}
            </button>

            {/* 6. Quản lý báo cáo */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "reports"
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquareWarning className={`w-4 h-4 ${activeTab === "reports" ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>Quản lý báo cáo</span>
              </div>
              {pendingReportsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Profile Box */}
        <div className="p-3 border-t border-zinc-800/70 bg-[#0c0d12]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-950 text-emerald-200">
                <AvatarFallback className="bg-emerald-900/60 text-emerald-200 font-bold text-xs rounded-lg">
                  {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate max-w-[85px]">
                  {currentAdmin?.name || "admin"}
                </div>
                <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                  SUPER ADMIN
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-[#14161f] border-zinc-800 text-zinc-200 text-xs shadow-xl">
                <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/">
                    <ExternalLink className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                    <span>Xem Website</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/40">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-14 px-6 bg-[#0f1015]/80 backdrop-blur-md border-b border-zinc-800/70 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-zinc-500">Admin</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-100 font-bold text-sm">{tabTitles[activeTab]}</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800/80">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cập nhật lúc {lastUpdated || "21:11"}</span>
              <button
                onClick={fetchData}
                disabled={loading}
                title="Làm mới dữ liệu"
                className="ml-1 text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>

            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Xem Website</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6 flex-1 text-left">
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Người dùng */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>NGƯỜI DÙNG</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{users.length}</div>
                    <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{recentUsersCount} người dùng trong 30 ngày qua</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 2: Tài liệu công khai */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>TÀI LIỆU CÔNG KHAI</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Files className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{approvedDocsCount}</div>
                    <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{documentStats?.summary?.totalDownloads || 0} lượt tải</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 3: Việc chờ xử lý */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>VIỆC CHỜ XỬ LÝ</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{pendingDocs.length}</div>
                    <div className="text-[11px] font-semibold text-amber-400">
                      <span>{pendingDocs.length > 0 ? "Cần duyệt nội dung mới" : "Không còn việc tồn đọng"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 4: Học phần / Môn học */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>HỌC PHẦN ĐÀO TẠO</span>
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{subjects.length}</div>
                    <div className="text-[11px] font-semibold text-teal-400">
                      <span>Đa dạng chuyên ngành</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Chart & Top Học phần quan tâm */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Box (2 cols) */}
                <Card className="lg:col-span-2 bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardHeader className="pb-2 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Tài liệu upload theo tháng</CardTitle>
                      <CardDescription className="text-xs text-zinc-400">Số tài liệu được đăng trong 8 tháng gần nhất</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Upload tài liệu
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[230px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              borderColor: "#3f3f46",
                              borderRadius: "0.75rem",
                              fontSize: "11px",
                              color: "#fff",
                            }}
                          />
                          <Area type="monotone" dataKey="uploads" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDownloads)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Học phần quan tâm & Tỷ lệ định dạng */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-2 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Học phần nổi bật</CardTitle>
                      <CardDescription className="text-xs text-zinc-400">Môn học có nhiều tài liệu & lượt tìm kiếm</CardDescription>
                    </div>
                    <button
                      onClick={() => setActiveTab("subjects")}
                      className="text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    {subjects.length === 0 ? (
                      <p className="py-4 text-xs text-zinc-500">Chưa có dữ liệu học phần.</p>
                    ) : subjects.slice(0, 4).map((sub) => (
                      <div key={sub.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-200 truncate max-w-[170px]">
                            {sub.name}
                          </span>
                          <span className="font-bold text-emerald-400 text-[11px]">
                            {sub.count} tài liệu
                          </span>
                        </div>
                        <Progress value={sub.percentage || 50} className="h-1.5 bg-zinc-800" />
                      </div>
                    ))}

                    <Separator className="bg-zinc-800/60 my-2" />

                    {/* Phân loại định dạng tài liệu */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 pb-1.5">
                        <span>Định dạng file lưu trữ</span>
                        <span className="text-emerald-400 font-bold">{allDocs.length} tài liệu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileFormatStats.length === 0 ? (
                          <p className="text-xs text-zinc-500">Chưa có dữ liệu định dạng.</p>
                        ) : fileFormatStats.map((format) => (
                          <div key={format.type} className="flex-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{format.type}</div>
                            <div className="font-bold text-xs text-zinc-200">{format.percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Quick Pending Queue */}
              <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Hàng chờ quản trị cần xử lý</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">Danh sách tài liệu mới gửi lên chờ xem xét</CardDescription>
                  </div>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Xem tất cả ({pendingDocs.length}) →
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingDocs.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs space-y-1">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                      <p className="font-semibold text-zinc-300">Không có tài liệu nào chờ duyệt.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-zinc-900/60 text-xs">
                          <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Tiêu đề tài liệu</TableHead>
                            <TableHead className="text-zinc-400">Học phần</TableHead>
                            <TableHead className="text-zinc-400">Người đăng</TableHead>
                            <TableHead className="text-right text-zinc-400">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {pendingDocs.slice(0, 3).map((doc) => (
                            <TableRow key={doc._id || doc.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                              <TableCell className="font-semibold text-zinc-100 max-w-xs truncate">
                                {doc.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px]">
                                  {doc.subjectName || doc.subjectId?.name || "Khác"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-zinc-300">
                                {doc.uploaderId?.name || "Thành viên"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveDoc(doc._id || doc.id)}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenRejectModal(doc)}
                                    className="h-7 px-2.5 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg text-xs"
                                  >
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
            </div>
          )}

          {/* ================= TAB 2: USERS MANAGEMENT ================= */}
          {activeTab === "users" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-white">Quản lý người dùng ({users.length})</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Dữ liệu tài khoản thành viên từ MongoDB</CardDescription>
                </div>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                  <Input
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-zinc-900 border-zinc-800 text-white rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-900/80 text-xs">
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Họ và tên</TableHead>
                        <TableHead className="text-zinc-400">Email</TableHead>
                        <TableHead className="text-zinc-400">Vai trò</TableHead>
                        <TableHead className="text-zinc-400">Trạng thái</TableHead>
                        <TableHead className="text-right text-zinc-400">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {users
                        .filter(
                          (u) =>
                            (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((u) => (
                          <TableRow key={u._id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                            <TableCell className="font-semibold text-white">{u.name}</TableCell>
                            <TableCell className="text-zinc-400">{u.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  u.role === "admin"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-zinc-900 text-zinc-300 border-zinc-800"
                                }`}
                              >
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  u.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
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
                                className={`h-7 px-2.5 text-xs font-semibold rounded-lg ${
                                  u.status === "active"
                                    ? "border-zinc-800 text-red-400 hover:bg-red-500/10"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                {u.status === "active" ? (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" /> Khóa
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 mr-1" /> Mở khóa
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================= TAB 3: ALL DOCUMENTS ================= */}
          {activeTab === "documents" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-white">Kho tài liệu ({allDocs.length})</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Dữ liệu tài liệu tải lên từ MongoDB</CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                    <Input
                      placeholder="Tìm theo tên tài liệu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs bg-zinc-900 border-zinc-800 text-white rounded-xl"
                    />
                  </div>

                  <Select value={docFilterStatus} onValueChange={setDocFilterStatus}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181924] border-zinc-800 text-zinc-200 text-xs">
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="rejected">Bị từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-900/80 text-xs">
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Tên tài liệu</TableHead>
                        <TableHead className="text-zinc-400">Học phần</TableHead>
                        <TableHead className="text-zinc-400">Trạng thái</TableHead>
                        <TableHead className="text-zinc-400">Lượt tải</TableHead>
                        <TableHead className="text-right text-zinc-400">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {allDocs
                        .filter((d) => {
                          const matchesSearch = (d.title || "").toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesStatus = docFilterStatus === "all" || d.status === docFilterStatus;
                          return matchesSearch && matchesStatus;
                        })
                        .map((doc) => (
                          <TableRow key={doc._id || doc.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                            <TableCell className="font-semibold text-white max-w-xs truncate" title={doc.title}>
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-800 text-[10px]">
                                {doc.subjectName || "Khác"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.status === "approved" && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                  Đã duyệt
                                </Badge>
                              )}
                              {doc.status === "pending" && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                                  Chờ duyệt
                                </Badge>
                              )}
                              {doc.status === "rejected" && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                                  Bị từ chối
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-400">{doc.downloadCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fileUrl && (
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="h-7 px-2 border-zinc-800 text-zinc-300 rounded-lg">
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDoc(doc._id || doc.id)}
                                  className="h-7 px-2 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================= TAB 4: SUBJECTS MANAGEMENT ================= */}
          {activeTab === "subjects" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Danh mục học phần ({subjects.length})</h3>
                  <p className="text-xs text-zinc-400">Học phần được tổng hợp từ dữ liệu tài liệu trong MongoDB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      {sub.code && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                          {sub.code}
                        </span>
                      )}
                      <h4 className="font-bold text-white text-sm pt-1">{sub.name}</h4>
                      <p className="text-[11px] text-zinc-400">{sub.count} tài liệu</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ================= TAB 5: REPORTS MANAGEMENT ================= */}
          {activeTab === "reports" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-white">Quản lý báo cáo ({reports.length})</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Báo cáo tài liệu do thành viên gửi lên</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                    {pendingReportsCount} chờ xử lý
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {reports.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-90" />
                    <p className="font-bold text-white text-sm">Chưa có báo cáo nào</p>
                    <p className="text-xs text-zinc-400">Các báo cáo từ thành viên sẽ hiển thị tại đây.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-zinc-900/80 text-xs">
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Tài liệu</TableHead>
                          <TableHead className="text-zinc-400">Người báo cáo</TableHead>
                          <TableHead className="text-zinc-400">Lý do</TableHead>
                          <TableHead className="text-zinc-400">Trạng thái</TableHead>
                          <TableHead className="text-zinc-400">Ngày gửi</TableHead>
                          <TableHead className="text-right text-zinc-400">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {reports.map((report) => (
                          <TableRow key={report._id} className="border-zinc-800/60 hover:bg-zinc-900/40 align-top">
                            <TableCell className="font-semibold text-white max-w-[220px]">
                              <div className="truncate" title={report.documentId?.title}>
                                {report.documentId?.title || "Tài liệu đã bị xóa"}
                              </div>
                              {report.documentId?.fileUrl && (
                                <a href={report.documentId.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline">
                                  Xem tài liệu
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-300">
                              <div>{report.reporterId?.name || "Thành viên"}</div>
                              <div className="text-[10px] text-zinc-500">{report.reporterId?.email || ""}</div>
                            </TableCell>
                            <TableCell className="text-zinc-400 max-w-[260px] whitespace-normal">
                              {report.reason}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  report.status === "pending"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                    : report.status === "resolved"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-zinc-900 text-zinc-400 border-zinc-700"
                                }`}
                              >
                                {report.status === "pending" ? "Chờ xử lý" : report.status === "resolved" ? "Đã xử lý" : "Đã bỏ qua"}
                              </Badge>
                              {report.handledBy?.name && (
                                <div className="mt-1 text-[10px] text-zinc-500">bởi {report.handledBy.name}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-400 whitespace-nowrap">
                              {report.createdAt ? new Date(report.createdAt).toLocaleDateString("vi-VN") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {report.status === "pending" ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleReportAction(report, "hide")}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Ẩn tài liệu
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReportAction(report, "delete")}
                                    className="h-7 px-2.5 border-red-900/60 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs"
                                  >
                                    Xóa tài liệu
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReopenReport(report)}
                                  disabled={!report.documentId?._id}
                                  title={!report.documentId?._id ? "Tài liệu đã bị xóa, không thể khôi phục" : "Mở lại báo cáo và tài liệu"}
                                  className="h-7 px-2.5 border-zinc-800 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded-lg text-xs disabled:opacity-50"
                                >
                                  Mở lại
                                </Button>
                              )}
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

          {/* ================= TAB 6: PENDING QUEUE ================= */}
          {activeTab === "pending" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4">
                <CardTitle className="text-base font-bold text-white">
                  Hàng đợi kiểm duyệt ({pendingDocs.length})
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Dữ liệu tài liệu đang chờ duyệt từ MongoDB
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingDocs.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-90" />
                    <p className="font-bold text-white text-sm">Hàng đợi kiểm duyệt đang trống</p>
                    <p className="text-xs text-zinc-400">Tất cả tài liệu mới đã được xử lý xong.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-zinc-900/80 text-xs">
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Tên tài liệu</TableHead>
                          <TableHead className="text-zinc-400">Học phần</TableHead>
                          <TableHead className="text-zinc-400">Người đăng</TableHead>
                          <TableHead className="text-zinc-400">Định dạng</TableHead>
                          <TableHead className="text-zinc-400">Ngày gửi</TableHead>
                          <TableHead className="text-right text-zinc-400">Thao tác duyệt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {pendingDocs.map((doc) => (
                          <TableRow key={doc._id || doc.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                            <TableCell className="font-semibold text-white max-w-xs truncate" title={doc.title}>
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                                {doc.subjectName || doc.subjectId?.name || "Khác"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-zinc-200 font-medium">{doc.uploaderId?.name || "Thành viên"}</div>
                              <div className="text-[10px] text-zinc-500">{doc.uploaderId?.email}</div>
                            </TableCell>
                            <TableCell className="text-zinc-400 font-mono">
                              {doc.fileType || "PDF"}
                            </TableCell>
                            <TableCell className="text-zinc-400">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fileUrl && (
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="h-8 px-2.5 border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-lg">
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveDoc(doc._id || doc.id)}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(doc)}
                                  className="h-8 px-3 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold"
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
        </main>
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-[#141620] border-zinc-800 text-zinc-100 text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-white">
              Từ chối phê duyệt tài liệu
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 line-clamp-1">
              Tài liệu: {selectedPendingDoc?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-zinc-300">Lý do từ chối</Label>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="w-full h-10 text-xs bg-zinc-900 border-zinc-800 text-white rounded-xl">
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent className="bg-[#181924] border-zinc-800 text-zinc-200 text-xs">
                <SelectItem value="Tài liệu không rõ nguồn gốc hoặc chất lượng kém">Tài liệu không rõ nguồn gốc / chất lượng kém</SelectItem>
                <SelectItem value="Tài liệu trùng lặp với tài liệu đã có trên hệ thống">Tài liệu trùng lặp đã có trên hệ thống</SelectItem>
                <SelectItem value="Phân loại sai môn học hoặc thiếu thông tin cần thiết">Phân loại sai môn học / thiếu thông tin</SelectItem>
                <SelectItem value="Tài liệu vi phạm bản quyền / chính sách chia sẻ">Vi phạm bản quyền / chính sách chia sẻ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Hủy
            </Button>
            <Button type="button" size="sm" onClick={handleConfirmReject} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
