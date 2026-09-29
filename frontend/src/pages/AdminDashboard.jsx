import { useCallback, useEffect, useRef, useState } from "react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Cell,
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
  MessageSquareWarning,
  Menu,
  X,
  UserCog,
  Shield,
  ShieldAlert,
  Check,
  BarChart3,
  RotateCcw,
  Plus,
  Loader2,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Reusable Sidebar Content Component for Desktop and Mobile Drawer
function SidebarNav({
  activeTab,
  setActiveTab,
  usersCount,
  docsCount,
  subjectsCount,
  pendingDocsCount,
  pendingReportsCount,
  currentAdmin,
  isModerator,
  handleLogout,
  onItemClick,
}) {
  const navItems = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "users",
      label: "Quản lý người dùng",
      icon: Users,
      badge: usersCount,
      badgeType: "neutral",
    },
    {
      id: "documents",
      label: "Quản lý tài liệu",
      icon: Files,
      badge: docsCount,
      badgeType: "neutral",
    },
    {
      id: "subjects",
      label: "Quản lý học phần",
      icon: GraduationCap,
      badge: subjectsCount,
      badgeType: "neutral",
    },
    {
      id: "pending",
      label: "Kiểm duyệt tài liệu",
      icon: FileCheck2,
      badge: pendingDocsCount > 0 ? pendingDocsCount : null,
      badgeType: "warning",
    },
    {
      id: "reports",
      label: "Quản lý báo cáo",
      icon: MessageSquareWarning,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null,
      badgeType: "danger",
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="p-4 space-y-5">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-emerald-900/20 border border-emerald-500/30">
              S
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
                <span>Study</span>
                <span className="text-emerald-400">Hub</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-400/90 tracking-wider uppercase">
                {isModerator ? "MODERATOR PORTAL" : "HỆ THỐNG QUẢN TRỊ"}
              </div>
            </div>
          </div>
          {onItemClick && (
            <button
              onClick={onItemClick}
              className="lg:hidden p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <Separator className="bg-zinc-800/60" />

        {/* Navigation Items */}
        <nav className="space-y-1 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onItemClick) onItemClick();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeType === "warning"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : item.badgeType === "danger"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "text-zinc-500 font-normal"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="p-3 border-t border-zinc-800/70 bg-[#0c0d12]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-950 text-emerald-200">
              <AvatarFallback className="bg-emerald-900/60 text-emerald-200 font-bold text-xs rounded-lg">
                {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-100 truncate max-w-[90px]">
                {currentAdmin?.name || "admin"}
              </div>
              <div
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isModerator ? "text-indigo-400" : "text-emerald-400"
                }`}
              >
                {isModerator ? "MODERATOR" : "SUPER ADMIN"}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
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
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/profile">
                  <Shield className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                  <span>Hồ sơ cá nhân</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/40">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

const officeFileExtensions = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const getDocumentExtension = (doc = {}) => {
  const fileNameMatch = String(doc.fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  if (fileNameMatch) return fileNameMatch[1];

  const urlMatch = String(doc.fileUrl || "").toLowerCase().split("?")[0].match(/\.([a-z0-9]+)$/);
  if (urlMatch) return urlMatch[1];

  const fileType = String(doc.fileType || "").toLowerCase();
  if (fileType.includes("pdf")) return "pdf";
  if (fileType.includes("text") || fileType === "txt") return "txt";
  if (fileType.includes("wordprocessing") || fileType === "docx") return "docx";
  if (fileType.includes("msword") || fileType === "doc") return "doc";
  if (fileType.includes("presentation") || fileType === "pptx") return "pptx";
  if (fileType.includes("powerpoint") || fileType === "ppt") return "ppt";
  if (fileType.includes("spreadsheet") || fileType === "xlsx") return "xlsx";
  if (fileType.includes("excel") || fileType === "xls") return "xls";
  return "";
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return ["overview", "users", "documents", "subjects", "pending", "reports"].includes(requestedTab)
      ? requestedTab
      : "overview";
  });
  const [users, setUsers] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documentStats, setDocumentStats] = useState(null);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(false);
  const [currentAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error(error);
      return null;
    }
  });
  const [dashboardLoadedAt] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [docFilterStatus, setDocFilterStatus] = useState("all");
  const [lastUpdated, setLastUpdated] = useState("");

  // Responsive Drawer state (Yêu cầu 4)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // User Management filtering state (Yêu cầu 2)
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // "all" | "student" | "moderator" | "admin"
  const [userStatusFilter, setUserStatusFilter] = useState("all"); // "all" | "active" | "blocked"

  // Role Change Modal state (Yêu cầu 3)
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState("student");
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Reject Document Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPendingDoc, setSelectedPendingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState("Tài liệu không rõ nguồn gốc hoặc chất lượng kém");

  // Report Management State
  const [reportFilter, setReportFilter] = useState("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [reportActionType, setReportActionType] = useState("resolve_reject"); // "resolve_reject" | "resolve_delete" | "dismiss"
  const [reportFeedbackText, setReportFeedbackText] = useState("");

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewMode, setPreviewMode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [extractedPreview, setExtractedPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewAbortRef = useRef(null);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectError, setSubjectError] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const isModerator = currentAdmin?.role === "moderator";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    setLastUpdated(
      now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
    try {
      // 1. Fetch real documents from MongoDB
      const docsRes = await fetch(`${apiUrl}/admin/documents`, { headers: getAuthHeaders() });
      if (docsRes.status === 401 || docsRes.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền Quản trị viên. Vui lòng đăng nhập lại!");
        window.location.href = "/";
        return;
      }
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        const docsList = Array.isArray(docsData) ? docsData : [];
        setAllDocs(docsList);
        setPendingDocs(docsList.filter((d) => d.status === "pending"));
      }

      // 2. Fetch real users from MongoDB (Admins and Moderators can view, though Moderator cannot edit)
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

      // 4. Fetch managed subjects, including subjects that do not have documents yet
      const subjectsRes = await fetch(`${apiUrl}/admin/subjects`, { headers: getAuthHeaders() });
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        const subjectList = Array.isArray(subjectsData.subjects) ? subjectsData.subjects : [];
        const maxCount = Math.max(...subjectList.map((subject) => subject.count || 0), 1);
        setSubjects(
          subjectList.map((subject) => ({
            ...subject,
            id: subject.id || subject._id || subject.name,
            percentage: Math.round(((subject.count || 0) / maxCount) * 100),
          }))
        );
      }

      // 5. Fetch reports submitted by users
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
  }, [apiUrl]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => () => previewAbortRef.current?.abort(), []);

  // --- Document Approvals & Rejections ---
  const handleApproveDoc = async (docId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        fetchData();
        toast({
          title: "Đã duyệt tài liệu",
          description: "Tài liệu đã được phê duyệt và hiển thị công khai.",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Lỗi duyệt tài liệu",
          description: data.message || "Không thể duyệt tài liệu",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
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
        toast({
          title: "Đã từ chối tài liệu",
          description: "Tài liệu đã chuyển sang trạng thái bị từ chối.",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: data.message || "Không thể từ chối tài liệu",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền xóa tài liệu vĩnh viễn.",
      });
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này vĩnh viễn khỏi hệ thống?")) return;
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAllDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        setPendingDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        toast({
          title: "Đã xóa tài liệu",
          description: "Tài liệu đã bị gỡ vĩnh viễn khỏi máy chủ.",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Lỗi xóa tài liệu",
          description: data.message || "Không thể xóa tài liệu",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
    }
  };

  const closeDocumentPreview = () => {
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;
    setPreviewModalOpen(false);
    setPreviewDocument(null);
    setPreviewMode("");
    setPreviewUrl("");
    setPreviewText("");
    setExtractedPreview(null);
    setPreviewLoading(false);
    setPreviewError("");
  };

  const handleOpenPreview = async (doc) => {
    if (!doc?.fileUrl) return;

    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    setPreviewDocument(doc);
    setPreviewModalOpen(true);
    setPreviewMode("");
    setPreviewUrl("");
    setPreviewText("");
    setExtractedPreview(null);
    setPreviewError("");

    const extension = getDocumentExtension(doc);
    const extractableOfficeExtensions = ["docx", "pptx", "xlsx"];
    if (officeFileExtensions.has(extension) && !extractableOfficeExtensions.includes(extension)) {
      try {
        const sourceUrl = new URL(doc.fileUrl, window.location.href);
        const isLocalSource = ["localhost", "127.0.0.1", "::1"].includes(sourceUrl.hostname);
        if (sourceUrl.protocol !== "https:" || isLocalSource) {
          throw new Error(
            "Tệp Office đang lưu trên máy chủ nội bộ nên dịch vụ xem trực tuyến chưa thể truy cập. Hãy cấu hình Cloudinary cho môi trường này."
          );
        }
        setPreviewMode("office");
        setPreviewUrl(
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sourceUrl.href)}`
        );
      } catch (error) {
        setPreviewError(error.message || "Không thể tạo bản xem trước Office");
      }
      return;
    }

    if (!["pdf", "txt", ...extractableOfficeExtensions].includes(extension)) {
      setPreviewError("Định dạng tệp này chưa hỗ trợ xem trước an toàn trong trình duyệt.");
      return;
    }

    setPreviewLoading(true);
    try {
      const documentId = doc._id || doc.id;
      const response = await fetch(`${apiUrl}/admin/documents/${documentId}/preview`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Không thể tạo bản xem trước");
      }

      if (extractableOfficeExtensions.includes(extension)) {
        setExtractedPreview(await response.json());
        setPreviewMode("extracted");
      } else if (extension === "txt") {
        setPreviewText(await response.text());
        setPreviewMode("text");
      } else {
        const sourceBlob = await response.blob();
        const objectUrl = URL.createObjectURL(
          new Blob([sourceBlob], { type: "application/pdf" })
        );
        setPreviewUrl(objectUrl);
        setPreviewMode("pdf");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setPreviewError(error.message || "Không thể tạo bản xem trước");
      }
    } finally {
      if (!controller.signal.aborted) setPreviewLoading(false);
    }
  };

  const handleOpenSubjectModal = () => {
    setNewSubjectName("");
    setNewSubjectCode("");
    setSubjectError("");
    setSubjectModalOpen(true);
  };

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    const name = newSubjectName.trim();
    if (name.length < 2) {
      setSubjectError("Tên học phần phải có ít nhất 2 ký tự.");
      return;
    }

    setSubjectSaving(true);
    setSubjectError("");
    try {
      const response = await fetch(`${apiUrl}/admin/subjects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, code: newSubjectCode.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Không thể thêm học phần");
      }

      setSubjectModalOpen(false);
      setNewSubjectName("");
      setNewSubjectCode("");
      await fetchData();
    } catch (error) {
      setSubjectError(error.message || "Không thể thêm học phần");
    } finally {
      setSubjectSaving(false);
    }
  };

  // --- User Management: Toggle Status (Yêu cầu 2) ---
  const toggleUserStatus = async (userId, currentStatus) => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản.",
      });
      return;
    }

    const currentId = currentAdmin?._id || currentAdmin?.id;
    if (userId === currentId) {
      toast({
        variant: "destructive",
        title: "Hạn chế bảo mật",
        description: "Bạn không thể tự khóa tài khoản của chính mình.",
      });
      return;
    }

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
        toast({
          title: newStatus === "blocked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
          description: `Tài khoản đã được chuyển sang trạng thái "${newStatus === "blocked" ? "Bị khóa" : "Hoạt động"}".`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Không thể cập nhật",
          description: data.message || "Không thể cập nhật trạng thái người dùng",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
    }
  };

  // --- User Management: Role Change (Yêu cầu 3) ---
  const handleOpenRoleModal = (user) => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền thay đổi vai trò người dùng.",
      });
      return;
    }
    setSelectedUserForRole(user);
    setSelectedNewRole(user.role || "student");
    setRoleModalOpen(true);
  };

  const handleSaveUserRole = async () => {
    if (!selectedUserForRole) return;
    const targetId = selectedUserForRole._id || selectedUserForRole.id;
    const currentId = currentAdmin?._id || currentAdmin?.id;

    if (targetId === currentId) {
      toast({
        variant: "destructive",
        title: "Hạn chế bảo mật",
        description: "Bạn không thể tự thay đổi vai trò của tài khoản đang đăng nhập.",
      });
      return;
    }

    setRoleUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${targetId}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: selectedNewRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === targetId ? { ...u, role: selectedNewRole } : u))
        );
        setRoleModalOpen(false);
        const roleLabels = {
          admin: "Quản trị viên (Admin)",
          moderator: "Kiểm duyệt viên (Moderator)",
          student: "Sinh viên (Student)",
        };
        toast({
          title: "Cập nhật vai trò thành công",
          description: `Người dùng "${selectedUserForRole.name || ""}" đã được phân quyền "${roleLabels[selectedNewRole]}".`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Không thể đổi vai trò",
          description: data.message || "Lỗi cập nhật vai trò",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi kết nối",
        description: err.message,
      });
    } finally {
      setRoleUpdating(false);
    }
  };

  // --- Report Management Handlers ---
  const handleOpenReportModal = (report, actionType) => {
    setSelectedReportForAction(report);
    setReportActionType(actionType);
    if (actionType === "resolve_reject") {
      setReportFeedbackText("Tài liệu đã bị từ chối phê duyệt do vi phạm quy định cộng đồng StudyHub.");
    } else if (actionType === "resolve_delete") {
      setReportFeedbackText("Tài liệu vi phạm nghiêm trọng và đã bị xóa hoàn toàn khỏi hệ thống.");
    } else if (actionType === "dismiss") {
      setReportFeedbackText("Tài liệu đã được kiểm duyệt lại và không vi phạm chính sách của StudyHub.");
    }
    setReportModalOpen(true);
  };

  const handleConfirmReportModal = async () => {
    if (!selectedReportForAction) return;
    const report = selectedReportForAction;
    const action = reportActionType;

    try {
      const documentId = report.documentId?._id || report.documentId;
      if (documentId && (action === "resolve_reject" || action === "resolve_delete")) {
        const documentRes = await fetch(
          `${apiUrl}/admin/documents/${documentId}${action === "resolve_delete" ? "" : "/status"}`,
          {
            method: action === "resolve_delete" ? "DELETE" : "PATCH",
            headers: getAuthHeaders(),
            ...(action === "resolve_delete" ? {} : { body: JSON.stringify({ status: "rejected" }) }),
          }
        );
        if (!documentRes.ok && documentRes.status !== 404) {
          const data = await documentRes.json();
          throw new Error(data.message || "Không thể cập nhật tài liệu");
        }
      }

      const reportStatus = action === "dismiss" ? "dismissed" : "resolved";
      const reportRes = await fetch(`${apiUrl}/reports/${report._id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: reportStatus,
          adminFeedback: reportFeedbackText.trim(),
        }),
      });

      if (reportRes.ok) {
        setReportModalOpen(false);
        setSelectedReportForAction(null);
        fetchData();
        toast({
          title: "Xử lý báo cáo thành công",
          description: "Đã cập nhật trạng thái báo cáo và gửi thông báo phản hồi tới sinh viên.",
        });
      } else {
        const data = await reportRes.json();
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: data.message || "Không thể cập nhật báo cáo",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền xóa dữ liệu nhật ký báo cáo.",
      });
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi báo cáo này?")) return;
    try {
      const res = await fetch(`${apiUrl}/reports/${reportId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        toast({
          title: "Đã xóa báo cáo",
          description: "Bản ghi báo cáo đã được gỡ bỏ khỏi hệ thống.",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: data.message || "Không thể xóa báo cáo",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
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
      toast({
        title: "Đã mở lại báo cáo",
        description: "Báo cáo và tài liệu đã được chuyển lại về trạng thái chờ xử lý.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err.message,
      });
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
    reports: "Quản lý báo cáo vi phạm",
  };

  // --- Statistics & Chart Computations (Yêu cầu 1) ---
  const approvedDocsCount = documentStats?.summary?.approved ?? allDocs.filter((d) => d.status === "approved").length;
  const rejectedDocsCount = allDocs.filter((d) => d.status === "rejected").length;
  const recentUsersCount = users.filter((user) => {
    const createdAt = new Date(user.createdAt).getTime();
    return createdAt >= dashboardLoadedAt - 30 * 24 * 60 * 60 * 1000;
  }).length;

  const activityChartData = (documentStats?.monthlyUploads || []).map((item) => ({
    month: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("vi-VN", {
      month: "short",
      year: "numeric",
    }),
    uploads: item.uploads,
  }));

  // Document Status Distribution for BarChart
  const docStatusChartData = [
    { name: "Đã duyệt", count: approvedDocsCount, fill: "#10b981" },
    { name: "Chờ duyệt", count: pendingDocs.length, fill: "#f59e0b" },
    { name: "Bị từ chối", count: rejectedDocsCount, fill: "#ef4444" },
    { name: "Báo cáo", count: reports.filter((r) => r.status === "pending").length, fill: "#ec4899" },
  ];

  // User Role Breakdown
  const studentUsersCount = users.filter((u) => !u.role || u.role === "student").length;
  const moderatorUsersCount = users.filter((u) => u.role === "moderator").length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;
  const blockedUsersCount = users.filter((u) => u.status === "blocked").length;

  // Reports KPIs
  const pendingReportsCount = reports.filter((report) => report.status === "pending").length;
  const resolvedReportsCount = reports.filter((report) => report.status === "resolved").length;
  const reportResolutionRate = reports.length > 0 ? Math.round((resolvedReportsCount / reports.length) * 100) : 100;

  // File format breakdown
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

  return (
    <div className="dark min-h-screen bg-[#090a0f] text-zinc-100 flex font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. LEFT SIDEBAR (Desktop Fixed) */}
      <aside className="hidden lg:flex w-64 bg-[#0f1015] border-r border-zinc-800/70 flex-col shrink-0 sticky top-0 h-screen z-40">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          usersCount={users.length}
          docsCount={allDocs.length}
          subjectsCount={subjects.length}
          pendingDocsCount={pendingDocs.length}
          pendingReportsCount={pendingReportsCount}
          currentAdmin={currentAdmin}
          isModerator={isModerator}
          handleLogout={handleLogout}
        />
      </aside>

      {/* 1.1 MOBILE DRAWER SIDEBAR (Yêu cầu 4) */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0f1015] border-r border-zinc-800/70 flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              usersCount={users.length}
              docsCount={allDocs.length}
              subjectsCount={subjects.length}
              pendingDocsCount={pendingDocs.length}
              pendingReportsCount={pendingReportsCount}
              currentAdmin={currentAdmin}
              isModerator={isModerator}
              handleLogout={handleLogout}
              onItemClick={() => setMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:px-6 bg-[#0f1015]/80 backdrop-blur-md border-b border-zinc-800/70 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 text-xs font-medium min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="text-zinc-500 hidden sm:inline">Admin</span>
              <span className="text-zinc-700 hidden sm:inline">/</span>
              <span className="text-zinc-100 font-bold text-sm truncate">{tabTitles[activeTab]}</span>
            </div>

            {/* Role indicator pill badge */}
            <Badge
              variant="outline"
              className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isModerator
                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              }`}
            >
              <ShieldCheck className="w-3 h-3 mr-1" />
              {isModerator ? "Moderator" : "Super Admin"}
            </Badge>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800/80">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cập nhật {lastUpdated || "gần đây"}</span>
              <button
                onClick={fetchData}
                disabled={loading}
                title="Làm mới dữ liệu"
                className="ml-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Làm mới"
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-400" />
                <span className="hidden sm:inline">Xem Website</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 text-left">
          {/* ================= TAB 1: OVERVIEW (Yêu cầu 1: Biểu đồ & Thống kê) ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Primary Stat Cards Row */}
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
                      <span>+{recentUsersCount} thành viên trong 30 ngày</span>
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
                      <span>{documentStats?.summary?.totalDownloads || 0} lượt tải tổng cộng</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 3: Việc chờ xử lý */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>HÀNG ĐỢI KIỂM DUYỆT</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{pendingDocs.length}</div>
                    <div className="text-[11px] font-semibold text-amber-400">
                      <span>{pendingDocs.length > 0 ? "Cần xét duyệt nội dung mới" : "Không có tồn đọng"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 4: Báo cáo vi phạm */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <span>BÁO CÁO CHỜ XỬ LÝ</span>
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <MessageSquareWarning className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{pendingReportsCount}</div>
                    <div className="text-[11px] font-semibold text-rose-400">
                      <span>{pendingReportsCount > 0 ? "Phản ánh từ sinh viên" : "Cộng đồng an toàn"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 1: AreaChart (Uploads theo tháng) & BarChart (Phân bố trạng thái tài liệu) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AreaChart: 2 cols */}
                <Card className="lg:col-span-2 bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardHeader className="pb-2 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Tài liệu upload theo thời gian</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Biểu đồ xu hướng tài liệu được chia sẻ trong các tháng gần nhất
                      </CardDescription>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {allDocs.length} tài liệu
                    </span>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUploadsEmerald" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                          <Area
                            type="monotone"
                            dataKey="uploads"
                            name="Số tài liệu"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorUploadsEmerald)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* BarChart: 1 col - Phân bố trạng thái tài liệu */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-2 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span>Trạng thái kiểm duyệt</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Phân bố tài liệu & phản ánh
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={docStatusChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              borderColor: "#3f3f46",
                              borderRadius: "0.75rem",
                              fontSize: "11px",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]}>
                            {docStatusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đã duyệt
                        </span>
                        <span className="font-bold text-zinc-200">{approvedDocsCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                        <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Chờ duyệt
                        </span>
                        <span className="font-bold text-zinc-200">{pendingDocs.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Thống kê cơ cấu người dùng & Báo cáo cộng đồng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Cơ cấu người dùng theo vai trò */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardHeader className="pb-3 border-b border-zinc-800/60">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Cơ cấu người dùng</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Tổng {users.length} tài khoản trong cơ sở dữ liệu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          Sinh viên
                        </span>
                        <span className="font-bold text-white font-mono">{studentUsersCount} ({users.length ? Math.round((studentUsersCount / users.length) * 100) : 0}%)</span>
                      </div>
                      <Progress value={users.length ? (studentUsersCount / users.length) * 100 : 0} className="h-1.5 bg-zinc-800 [&>div]:bg-blue-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                          Kiểm duyệt viên (Moderator)
                        </span>
                        <span className="font-bold text-white font-mono">{moderatorUsersCount}</span>
                      </div>
                      <Progress value={users.length ? (moderatorUsersCount / users.length) * 100 : 0} className="h-1.5 bg-zinc-800 [&>div]:bg-indigo-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Quản trị viên (Admin)
                        </span>
                        <span className="font-bold text-white font-mono">{adminUsersCount}</span>
                      </div>
                      <Progress value={users.length ? (adminUsersCount / users.length) * 100 : 0} className="h-1.5 bg-zinc-800 [&>div]:bg-emerald-500" />
                    </div>

                    {blockedUsersCount > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-red-400">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Tài khoản bị khóa
                        </span>
                        <span className="font-bold font-mono">{blockedUsersCount}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Hiệu suất xử lý báo cáo vi phạm */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                  <CardHeader className="pb-3 border-b border-zinc-800/60">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquareWarning className="w-4 h-4 text-rose-400" />
                      <span>An toàn nội dung & Báo cáo</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Tỷ lệ xử lý các phản ánh vi phạm
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div>
                        <div className="text-2xl font-extrabold text-white">{reportResolutionRate}%</div>
                        <div className="text-[11px] text-zinc-400">Tỷ lệ giải quyết vi phạm</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-400">Tổng nhận</div>
                        <div className="text-sm font-bold text-white">{reports.length}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <div className="text-[10px] text-emerald-400">Đã xử lý</div>
                        <div className="text-sm font-bold text-emerald-300">{resolvedReportsCount}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <div className="text-[10px] text-amber-400">Chờ duyệt</div>
                        <div className="text-sm font-bold text-amber-300">{pendingReportsCount}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className="w-full py-2 text-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Mở bảng quản lý báo cáo chi tiết →
                    </button>
                  </CardContent>
                </Card>

                {/* 3. Top Học phần quan tâm & Định dạng file */}
                <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Học phần nổi bật</CardTitle>
                      <CardDescription className="text-xs text-zinc-400">Môn học có nhiều tài liệu nhất</CardDescription>
                    </div>
                    <button
                      onClick={() => setActiveTab("subjects")}
                      className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                    >
                      Xem tất cả
                    </button>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2.5">
                    {subjects.slice(0, 3).map((sub) => (
                      <div key={sub.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-200 truncate max-w-[160px]">{sub.name}</span>
                          <span className="font-bold text-emerald-400 text-[11px]">{sub.count} tài liệu</span>
                        </div>
                        <Progress value={sub.percentage || 50} className="h-1 bg-zinc-800 [&>div]:bg-emerald-500" />
                      </div>
                    ))}

                    <Separator className="bg-zinc-800/60 my-2" />

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 pb-1.5">
                        <span>Định dạng file lưu trữ</span>
                        <span className="text-emerald-400 font-bold">{allDocs.length} file</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileFormatStats.map((format) => (
                          <div key={format.type} className="flex-1 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase">{format.type}</div>
                            <div className="font-bold text-xs text-zinc-200">{format.percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Quick Pending Queue Table */}
              <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
                <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-amber-400" />
                      <span>Hàng chờ kiểm duyệt cần xử lý ({pendingDocs.length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Tài liệu mới gửi lên chờ phê duyệt để hiển thị cho cộng đồng
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Xem tất cả ({pendingDocs.length}) →
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingDocs.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs space-y-1">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                      <p className="font-semibold text-zinc-300">Không có tài liệu nào chờ duyệt.</p>
                      <p className="text-[11px] text-zinc-500">Tất cả tài liệu gửi lên đã được xem xét xong.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto min-w-full">
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
                          {pendingDocs.slice(0, 4).map((doc) => (
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
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenRejectModal(doc)}
                                    className="h-7 px-2.5 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg text-xs cursor-pointer"
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

          {/* ================= TAB 2: USERS MANAGEMENT (Yêu cầu 2 & 3 & 5) ================= */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Informative notice banner for Moderator */}
              {isModerator && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs flex items-start gap-3 shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white text-xs">Chế độ Kiểm duyệt viên (Moderator)</p>
                    <p className="text-indigo-300/90 text-[11px] leading-relaxed mt-0.5">
                      Bạn có quyền xem danh sách thành viên. Để đảm bảo an toàn hệ thống, chức năng đổi vai trò và khóa/mở khóa tài khoản chỉ dành riêng cho Quản trị viên (Super Admin).
                    </p>
                  </div>
                </div>
              )}

              {/* User KPI summary chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-[#12131a] border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">TỔNG THÀNH VIÊN</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">{users.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#12131a] border border-zinc-800 text-center">
                  <div className="text-[10px] text-blue-400 font-bold uppercase">SINH VIÊN</div>
                  <div className="text-lg font-extrabold text-blue-300 mt-0.5">{studentUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#12131a] border border-zinc-800 text-center">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">KIỂM DUYỆT VIÊN</div>
                  <div className="text-lg font-extrabold text-indigo-300 mt-0.5">{moderatorUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#12131a] border border-zinc-800 text-center">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">QUẢN TRỊ VIÊN</div>
                  <div className="text-lg font-extrabold text-emerald-300 mt-0.5">{adminUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#12131a] border border-zinc-800 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">TÀI KHOẢN KHÓA</div>
                  <div className="text-lg font-extrabold text-rose-300 mt-0.5">{blockedUsersCount}</div>
                </div>
              </div>

              {/* Users Table Card */}
              <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="border-b border-zinc-800/60 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Danh sách tài khoản ({users.length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Tìm kiếm, lọc thành viên theo vai trò và trạng thái
                    </CardDescription>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                      <Input
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs bg-zinc-900 border-zinc-800 text-white rounded-xl focus:border-emerald-500"
                      />
                    </div>

                    {/* Role Filter */}
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-[140px] h-9 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl">
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181924] border-zinc-800 text-zinc-200 text-xs">
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        <SelectItem value="student">Sinh viên</SelectItem>
                        <SelectItem value="moderator">Kiểm duyệt viên</SelectItem>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-[130px] h-9 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181924] border-zinc-800 text-zinc-200 text-xs">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="blocked">Bị khóa</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Reset Filters */}
                    {(searchQuery || userRoleFilter !== "all" || userStatusFilter !== "all") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSearchQuery("");
                          setUserRoleFilter("all");
                          setUserStatusFilter("all");
                        }}
                        className="h-9 px-2.5 text-xs text-zinc-400 hover:text-white"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto min-w-full">
                    <Table>
                      <TableHeader className="bg-zinc-900/80 text-xs">
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Thành viên</TableHead>
                          <TableHead className="text-zinc-400">Email</TableHead>
                          <TableHead className="text-zinc-400">Vai trò</TableHead>
                          <TableHead className="text-zinc-400">Trạng thái</TableHead>
                          <TableHead className="text-zinc-400">Ngày tham gia</TableHead>
                          <TableHead className="text-right text-zinc-400">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {users
                          .filter((u) => {
                            const nameMatch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase());
                            const emailMatch = (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
                            const matchesSearch = nameMatch || emailMatch;

                            const userRole = u.role || "student";
                            const matchesRole = userRoleFilter === "all" || userRole === userRoleFilter;

                            const userStatus = u.status || "active";
                            const matchesStatus = userStatusFilter === "all" || userStatus === userStatusFilter;

                            return matchesSearch && matchesRole && matchesStatus;
                          })
                          .map((u) => {
                            const isSelf = u._id === currentAdmin?._id || u._id === currentAdmin?.id;
                            const role = u.role || "student";
                            const status = u.status || "active";

                            return (
                              <TableRow key={u._id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200">
                                      <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold text-xs rounded-lg">
                                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-semibold text-white flex items-center gap-1.5">
                                        <span>{u.name}</span>
                                        {isSelf && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                                            (Bạn)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-zinc-400 font-mono text-[11px]">{u.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold ${
                                      role === "admin"
                                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                        : role === "moderator"
                                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                        : "bg-zinc-900 text-zinc-300 border-zinc-800"
                                    }`}
                                  >
                                    {role === "admin"
                                      ? "Quản trị viên"
                                      : role === "moderator"
                                      ? "Kiểm duyệt viên"
                                      : "Sinh viên"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] flex items-center w-fit gap-1 ${
                                      status === "active"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        status === "active" ? "bg-emerald-500" : "bg-red-500"
                                      }`}
                                    />
                                    {status === "active" ? "Hoạt động" : "Bị khóa"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400 whitespace-nowrap text-[11px]">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Nút Đổi vai trò (Yêu cầu 3) */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isModerator || isSelf}
                                      onClick={() => handleOpenRoleModal(u)}
                                      title={
                                        isModerator
                                          ? "Chỉ Quản trị viên mới có quyền đổi vai trò"
                                          : isSelf
                                          ? "Không thể tự đổi vai trò của chính mình"
                                          : "Thay đổi vai trò người dùng"
                                      }
                                      className="h-7 px-2.5 text-xs font-semibold rounded-lg border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-40"
                                    >
                                      <UserCog className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                                      <span>Đổi vai trò</span>
                                    </Button>

                                    {/* Nút Khóa / Mở khóa tài khoản */}
                                    <Button
                                      size="sm"
                                      variant={status === "active" ? "outline" : "default"}
                                      disabled={isModerator || isSelf}
                                      onClick={() => toggleUserStatus(u._id, status)}
                                      title={
                                        isModerator
                                          ? "Chỉ Quản trị viên mới có quyền khóa/mở khóa"
                                          : isSelf
                                          ? "Không thể tự khóa tài khoản của mình"
                                          : status === "active"
                                          ? "Khóa tài khoản"
                                          : "Mở khóa tài khoản"
                                      }
                                      className={`h-7 px-2.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40 ${
                                        status === "active"
                                          ? "border-zinc-800 text-red-400 hover:bg-red-500/10"
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      }`}
                                    >
                                      {status === "active" ? (
                                        <>
                                          <Lock className="w-3 h-3 mr-1" /> Khóa
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="w-3 h-3 mr-1" /> Mở khóa
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ================= TAB 3: ALL DOCUMENTS ================= */}
          {activeTab === "documents" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Files className="w-4 h-4 text-emerald-400" />
                    <span>Kho tài liệu ({allDocs.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Toàn bộ tài liệu được đóng góp trên hệ thống
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-64">
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
                <div className="overflow-x-auto min-w-full">
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
                            <TableCell className="font-semibold text-white max-w-xs" title={doc.title}>
                              <div className="truncate">{doc.title}</div>
                              {doc.fileAvailable === false && (
                                <span className="mt-1 inline-flex text-[10px] font-medium text-red-400">
                                  Thiếu tệp nguồn
                                </span>
                              )}
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
                            <TableCell className="text-zinc-400 font-mono">{doc.downloadCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fileUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={doc.fileAvailable === false}
                                    onClick={() => handleOpenPreview(doc)}
                                    title={doc.fileAvailable === false ? doc.fileIssue : "Xem trước an toàn"}
                                    className="h-7 px-2 border-zinc-800 text-zinc-300 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {!isModerator && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDoc(doc._id || doc.id)}
                                    className="h-7 px-2 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                    title="Xóa vĩnh viễn (Chỉ Admin)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
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
                  <p className="text-xs text-zinc-400">Học phần dùng khi thành viên phân loại tài liệu tải lên</p>
                </div>
                {!isModerator && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenSubjectModal}
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Thêm học phần
                  </Button>
                )}
              </div>

              {subjects.length === 0 ? (
                <div className="py-14 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
                  <GraduationCap className="w-9 h-9 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">Chưa có học phần</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isModerator
                      ? "Quản trị viên chưa tạo học phần nào."
                      : "Nhấn “Thêm học phần” để tạo danh mục đầu tiên."}
                  </p>
                </div>
              ) : (
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
                      <p className="text-[11px] text-zinc-400">{sub.count} tài liệu học tập</p>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ================= TAB 5: PENDING QUEUE (Kiểm duyệt tài liệu) ================= */}
          {activeTab === "pending" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-800/60 pb-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-400" />
                    <span>Hàng đợi kiểm duyệt tài liệu ({pendingDocs.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Phê duyệt hoặc từ chối các tài liệu mới do cộng đồng gửi lên
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingDocs.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-90" />
                    <p className="font-bold text-white text-sm">Hàng đợi kiểm duyệt đang trống</p>
                    <p className="text-xs text-zinc-400">Tất cả tài liệu mới đã được xử lý xong.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto min-w-full">
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
                            <TableCell className="font-semibold text-white max-w-xs" title={doc.title}>
                              <div className="truncate">{doc.title}</div>
                              {doc.fileAvailable === false && (
                                <span className="mt-1 inline-flex text-[10px] font-medium text-red-400">
                                  Thiếu tệp nguồn
                                </span>
                              )}
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
                            <TableCell className="text-zinc-400 font-mono text-[11px]">
                              {doc.fileType || "PDF"}
                            </TableCell>
                            <TableCell className="text-zinc-400 text-[11px]">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fileUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={doc.fileAvailable === false}
                                    onClick={() => handleOpenPreview(doc)}
                                    title={doc.fileAvailable === false ? doc.fileIssue : "Xem trước an toàn"}
                                    className="h-8 px-2.5 border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  disabled={doc.fileAvailable === false}
                                  onClick={() => handleApproveDoc(doc._id || doc.id)}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(doc)}
                                  className="h-8 px-3 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold cursor-pointer"
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

          {/* ================= TAB 6: REPORTS MANAGEMENT ================= */}
          {activeTab === "reports" && (
            <Card className="bg-[#12131a] border-zinc-800/80 text-zinc-100 rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquareWarning className="w-4 h-4 text-emerald-400" />
                    <span>Quản lý báo cáo vi phạm ({reports.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Xử lý các phản ánh vi phạm từ thành viên và tự động gửi thông báo kết quả.
                  </CardDescription>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
                    {[
                      { id: "all", label: "Tất cả", count: reports.length },
                      { id: "pending", label: "Chờ xử lý", count: pendingReportsCount },
                      {
                        id: "resolved",
                        label: "Đã xử lý",
                        count: reports.filter((r) => r.status === "resolved").length,
                      },
                      {
                        id: "dismissed",
                        label: "Đã bỏ qua",
                        count: reports.filter((r) => r.status === "dismissed").length,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setReportFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          reportFilter === tab.id
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {reports.filter((r) => reportFilter === "all" || r.status === reportFilter).length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 text-xs">
                    Không có báo cáo nào ở danh mục này.
                  </div>
                ) : (
                  <div className="overflow-x-auto min-w-full">
                    <Table>
                      <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800/80 hover:bg-transparent">
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase">Tài liệu</TableHead>
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase">Người báo cáo</TableHead>
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase">Lý do vi phạm</TableHead>
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase">Ngày gửi</TableHead>
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase">Trạng thái</TableHead>
                          <TableHead className="text-[11px] font-bold text-zinc-400 uppercase text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-zinc-800/60">
                        {reports
                          .filter((r) => reportFilter === "all" || r.status === reportFilter)
                          .map((report) => {
                            const isPending = report.status === "pending";
                            const isResolved = report.status === "resolved";
                            const docId = report.documentId?._id || report.documentId;
                            const docTitle = report.documentId?.title || "Tài liệu bị xóa";

                            return (
                              <TableRow key={report._id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                                <TableCell className="font-semibold text-xs text-zinc-200 max-w-[200px]">
                                  {report.documentId ? (
                                    <a
                                      href={`/document/${docId}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-emerald-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                                    >
                                      <span>{docTitle}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                                    </a>
                                  ) : (
                                    <span className="text-zinc-500 italic">Đã xóa khỏi hệ thống</span>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs text-zinc-400">
                                  <div>
                                    <div className="font-medium text-zinc-200">
                                      {report.reporterId?.name || "Người dùng StudyHub"}
                                    </div>
                                    <div className="text-[10px] text-zinc-500">{report.reporterId?.email}</div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-xs text-zinc-300 max-w-[240px]">
                                  <div className="line-clamp-2" title={report.reason}>
                                    {report.reason}
                                  </div>
                                  {report.adminFeedback && (
                                    <div className="text-[10px] text-emerald-400/90 mt-1 italic line-clamp-1">
                                      Phản hồi: {report.adminFeedback}
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs text-zinc-400 whitespace-nowrap text-[11px]">
                                  {new Date(report.createdAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </TableCell>

                                <TableCell>
                                  {isPending && (
                                    <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                                      Chờ xử lý
                                    </Badge>
                                  )}
                                  {isResolved && (
                                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                                      Đã xử lý
                                    </Badge>
                                  )}
                                  {report.status === "dismissed" && (
                                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] font-bold">
                                      Đã bỏ qua
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell className="text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isPending ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleOpenReportModal(report, "resolve_reject")}
                                          className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                          title="Gỡ tài liệu và chấp thuận báo cáo"
                                        >
                                          Xử lý vi phạm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenReportModal(report, "dismiss")}
                                          className="h-7 px-2.5 border-zinc-800 text-zinc-400 hover:bg-zinc-800 rounded-lg text-xs font-semibold cursor-pointer"
                                          title="Bỏ qua báo cáo này"
                                        >
                                          Bỏ qua
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleReopenReport(report)}
                                          className="h-7 px-2 border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs cursor-pointer"
                                        >
                                          Mở lại
                                        </Button>
                                        {!isModerator && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteReport(report._id)}
                                            className="h-7 px-2 border-zinc-800 text-red-400 hover:bg-red-500/10 rounded-lg text-xs cursor-pointer"
                                            title="Xóa nhật ký báo cáo (Chỉ Admin)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Safe document preview */}
      <Dialog
        open={previewModalOpen}
        onOpenChange={(open) => {
          if (!open) closeDocumentPreview();
        }}
      >
        <DialogContent className="w-[96vw] max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl bg-[#101116] border-zinc-800 text-zinc-100 shadow-2xl flex flex-col">
          <DialogHeader className="px-6 py-4 pr-12 border-b border-zinc-800 bg-[#14151c] shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-white truncate">
                  {previewDocument?.title || "Xem trước tài liệu"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>{previewDocument?.fileName || "Tệp tài liệu"}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{previewDocument?.subjectName || "Chưa phân loại"}</span>
                </DialogDescription>
              </div>
              <Badge variant="outline" className="shrink-0 bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Xem trước, không tự tải xuống
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 bg-zinc-950/70 p-3">
            {previewLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs">Đang chuẩn bị bản xem trước an toàn...</p>
              </div>
            )}

            {!previewLoading && previewError && (
              <div className="h-full flex items-center justify-center px-6">
                <div className="max-w-lg text-center p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <FileText className="w-10 h-10 mx-auto text-amber-400 mb-3" />
                  <p className="text-sm font-bold text-white">Chưa thể hiển thị bản xem trước</p>
                  <p className="text-xs leading-relaxed text-zinc-400 mt-2">{previewError}</p>
                </div>
              </div>
            )}

            {!previewLoading && !previewError && previewMode === "pdf" && previewUrl && (
              <iframe
                src={previewUrl}
                title={`Bản xem trước ${previewDocument?.title || "tài liệu PDF"}`}
                className="w-full h-full rounded-xl border border-zinc-800 bg-white"
              />
            )}

            {!previewLoading && !previewError && previewMode === "office" && previewUrl && (
              <iframe
                src={previewUrl}
                title={`Bản xem trước ${previewDocument?.title || "tài liệu Office"}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-xl border border-zinc-800 bg-white"
              />
            )}

            {!previewLoading && !previewError && previewMode === "extracted" && extractedPreview && (
              <div className="w-full h-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-100 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                      <p className="text-xs leading-relaxed">{extractedPreview.notice}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {extractedPreview.imageCount > 0 && (
                        <Badge variant="outline" className="bg-white text-amber-700 border-amber-200 text-[10px]">
                          {(extractedPreview.images || []).length}/{extractedPreview.imageCount} ảnh hiển thị
                        </Badge>
                      )}
                      {extractedPreview.truncated && (
                        <Badge variant="outline" className="bg-white text-zinc-600 border-zinc-300 text-[10px]">
                          Nội dung đã rút gọn
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(extractedPreview.sections || []).map((section, index) => (
                    <section key={`${section.title}-${index}`} className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                      <h3 className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-700">
                        {section.title}
                      </h3>
                      <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-6 text-zinc-900 font-sans">
                        {section.content}
                      </pre>
                    </section>
                  ))}

                  {(extractedPreview.images || []).length > 0 && (
                    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                      <h3 className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-700">
                        Hình ảnh trong tài liệu
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {extractedPreview.images.map((image, index) => (
                          <figure key={`${image.name}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                            <img
                              src={image.dataUrl}
                              alt={`Ảnh ${index + 1} trong tài liệu`}
                              loading="lazy"
                              className="w-full max-h-[520px] object-contain rounded-md bg-white"
                            />
                            <figcaption className="px-1 pt-2 text-[10px] text-zinc-500 truncate" title={image.name}>
                              {image.name}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {!previewLoading && !previewError && previewMode === "text" && (
              <pre className="w-full h-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-800 bg-white p-5 text-sm leading-6 text-zinc-900">
                {previewText}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create subject modal */}
      <Dialog
        open={subjectModalOpen}
        onOpenChange={(open) => {
          if (!open && !subjectSaving) setSubjectModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-[#141620] border-zinc-800 text-zinc-100 shadow-2xl">
          <form onSubmit={handleCreateSubject} className="space-y-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-white">Thêm học phần mới</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Học phần mới sẽ xuất hiện trong danh sách phân loại khi tải tài liệu lên.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject-name" className="text-xs font-semibold text-zinc-300">
                  Tên học phần <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="subject-name"
                  autoFocus
                  maxLength={120}
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  placeholder="Ví dụ: Kiến trúc máy tính"
                  className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject-code" className="text-xs font-semibold text-zinc-300">
                  Mã học phần <span className="font-normal text-zinc-500">(tùy chọn)</span>
                </Label>
                <Input
                  id="subject-code"
                  maxLength={20}
                  value={newSubjectCode}
                  onChange={(event) => setNewSubjectCode(event.target.value.toUpperCase())}
                  placeholder="Ví dụ: IT3020"
                  className="h-10 text-xs font-mono uppercase bg-zinc-900 border-zinc-800 text-white rounded-xl"
                />
              </div>

              {subjectError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{subjectError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={subjectSaving}
                onClick={() => setSubjectModalOpen(false)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={subjectSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {subjectSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm học phần
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* ================= DIALOG 2: REPORT ACTION & FEEDBACK MODAL ================= */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-[#141620] border-zinc-800 text-zinc-100 text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-emerald-400" />
              <span>
                {reportActionType === "dismiss" ? "Bỏ qua báo cáo vi phạm" : "Xử lý vi phạm tài liệu"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 line-clamp-1">
              Tài liệu: {selectedReportForAction?.documentId?.title || "Tài liệu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs space-y-1">
              <span className="font-semibold text-zinc-300">Lý do thành viên báo cáo:</span>
              <p className="text-zinc-400">{selectedReportForAction?.reason}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">
                Ghi chú phản hồi cho người báo cáo (Notification)
              </Label>
              <textarea
                rows={3}
                value={reportFeedbackText}
                onChange={(e) => setReportFeedbackText(e.target.value)}
                placeholder="Nhập lý do xử lý hoặc lời nhắn gửi đến thành viên..."
                className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">
                Lời nhắn này sẽ hiển thị trực tiếp trong hòm thư Thông báo của thành viên đã gửi báo cáo.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(false)}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReportModal}
              className={
                reportActionType === "dismiss"
                  ? "bg-zinc-700 hover:bg-zinc-600 text-white font-semibold"
                  : "bg-red-600 hover:bg-red-700 text-white font-semibold"
              }
            >
              Xác nhận & Gửi thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 3: ROLE CHANGE MODAL (Yêu cầu 3) ================= */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-[#141620] border-zinc-800 text-zinc-100 text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-400" />
              <span>Thay đổi vai trò người dùng</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Phân quyền tài khoản trong hệ thống StudyHub
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* User Target Info Card */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200">
                <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold text-sm">
                  {selectedUserForRole?.name ? selectedUserForRole.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm truncate">{selectedUserForRole?.name}</div>
                <div className="text-xs text-zinc-400 truncate">{selectedUserForRole?.email}</div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 border-zinc-700 uppercase shrink-0"
              >
                Hiện tại: {selectedUserForRole?.role || "student"}
              </Badge>
            </div>

            {/* Role Options Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-300">Chọn vai trò mới</Label>

              {/* Option 1: Student */}
              <div
                onClick={() => setSelectedNewRole("student")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "student"
                    ? "bg-blue-500/10 border-blue-500/50 shadow-xs"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "student" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Sinh viên (Student)</span>
                    {selectedNewRole === "student" && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Quyền cơ bản: xem tài liệu, tải xuống, đăng tài liệu và gửi báo cáo vi phạm.
                  </p>
                </div>
              </div>

              {/* Option 2: Moderator */}
              <div
                onClick={() => setSelectedNewRole("moderator")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "moderator"
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-xs"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "moderator" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Kiểm duyệt viên (Moderator)</span>
                    {selectedNewRole === "moderator" && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Quyền kiểm duyệt: duyệt/từ chối tài liệu mới, tiếp nhận và xử lý các báo cáo vi phạm cộng đồng.
                  </p>
                </div>
              </div>

              {/* Option 3: Admin */}
              <div
                onClick={() => setSelectedNewRole("admin")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "admin"
                    ? "bg-rose-500/10 border-rose-500/50 shadow-xs"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "admin" ? "bg-rose-500 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Quản trị viên (Admin)</span>
                    {selectedNewRole === "admin" && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Toàn quyền hệ thống: quản lý tài khoản, thay đổi vai trò người dùng, xóa tài liệu và cấu hình.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={roleUpdating}
              onClick={() => setRoleModalOpen(false)}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={roleUpdating || selectedNewRole === selectedUserForRole?.role}
              onClick={handleSaveUserRole}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              {roleUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi vai trò"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
