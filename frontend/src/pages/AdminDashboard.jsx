import { API_URL } from "@/lib/api";
import { clearAccountSession } from "@/lib/session";
import BrandMark from "@/components/BrandMark";
import PageHeading from "@/components/PageHeading";
import Pagination from "@/components/Pagination";
import ThemeToggle from "@/components/ThemeToggle";
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
  Pencil,
  Loader2,
  ShieldCheck,
  FileText,
  History,
  Settings,
  Wrench,
  CloudUpload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const normalizeSearch = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
const matchesSearch = (values, query) => normalizeSearch(values.filter(Boolean).join(" ")).includes(normalizeSearch(query.trim()));
const nextSubjectCode = (subjects) => {
  const maxNumber = subjects.reduce((max, subject) => {
    const match = /^IT(\d+)$/i.exec(subject.code || "");
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `IT${String(maxNumber + 1).padStart(3, "0")}`;
};

// Reusable Sidebar Content Component for Desktop and Mobile Drawer
const DOCUMENT_STATUS_LABELS = {
  approved: "Đã duyệt",
  pending: "Chờ duyệt",
  rejected: "Bị từ chối",
};

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
    {
      id: "audit",
      label: "Nhật ký kiểm duyệt",
      icon: History,
      badge: null,
    },
    {
      id: "settings",
      label: "Cài đặt hệ thống",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="p-4 space-y-5">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <div><Link to="/" aria-label="StudyHub — Trang chủ"><BrandMark /></Link><p className="mt-3 text-[9px] font-bold tracking-widest">{isModerator ? "KIỂM DUYỆT NỘI DUNG" : "KHÔNG GIAN QUẢN TRỊ"}</p></div>
          {onItemClick && (
            <button
              onClick={onItemClick}
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <Separator className="bg-muted/60" />

        {/* Navigation Items */}
        <nav className="space-y-1 text-sm font-medium">
          {navItems.filter((item) => !isModerator || ["pending", "reports"].includes(item.id)).map((item) => {
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
                    ? "bg-primary/15 text-primary font-bold border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeType === "warning"
                        ? "bg-warning/20 text-warning border border-warning/30"
                        : item.badgeType === "danger"
                        ? "bg-destructive/20 text-destructive border border-destructive/30"
                        : "text-muted-foreground font-normal"
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
      <div className="p-3 border-t border-border/70 bg-card">
        <div className="flex items-center justify-between p-2 rounded-xl bg-card/80 border border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-8 h-8 rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg">
                {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate max-w-[90px]">
                {currentAdmin?.name || "admin"}
              </div>
              <div
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isModerator ? "text-primary" : "text-primary"
                }`}
              >
                {isModerator ? "MODERATOR" : "QUẢN TRỊ VIÊN"}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-card border-border text-foreground text-xs shadow-xl">
              <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted" />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/">
                  <ExternalLink className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Xem Website</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/profile">
                  <Shield className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Hồ sơ cá nhân</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
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
    let role = "student";
    try { role = JSON.parse(localStorage.getItem("user") || "null")?.role || role; } catch { /* Use the restricted default. */ }
    const moderatorTabs = ["pending", "reports"];
    const allTabs = [...moderatorTabs, "users", "documents", "subjects", "audit", "settings"];
    return allTabs.includes(requestedTab) && (role !== "moderator" || moderatorTabs.includes(requestedTab))
      ? requestedTab
      : role === "moderator" ? "pending" : "overview";
  });
  const [users, setUsers] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documentStats, setDocumentStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceEnabled: false,
    maintenanceMessage: "StudyHub đang được bảo trì để nâng cấp trải nghiệm. Vui lòng quay lại sau.",
    maintenanceExpectedEndAt: null,
    uploadsEnabled: true,
    uploadsMessage: "StudyHub đang tạm dừng nhận tài liệu mới. Bạn vẫn có thể xem và tải tài liệu hiện có.",
  });
  const [settingsMessageDraft, setSettingsMessageDraft] = useState(systemSettings.maintenanceMessage);
  const [settingsUploadsMessageDraft, setSettingsUploadsMessageDraft] = useState(systemSettings.uploadsMessage);
  const [settingsEndAtDraft, setSettingsEndAtDraft] = useState("");
  const [settingsReason, setSettingsReason] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

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
  const [dataError, setDataError] = useState("");
  const [docSubjectFilter, setDocSubjectFilter] = useState("all");
  const [docSourceFilter, setDocSourceFilter] = useState("all");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState("all");
  const subjectPageSize = 12;
  const [subjectPage, setSubjectPage] = useState({ key: "", page: 1 });
  const [pendingSearch, setPendingSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [documentPage, setDocumentPage] = useState({ key: "", page: 1 });
  const [mutationKey, setMutationKey] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const mutationRef = useRef(false);
  const dataAbortRef = useRef(null);

  const beginMutation = (key) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setMutationKey(key);
    return true;
  };
  const finishMutation = () => { mutationRef.current = false; setMutationKey(""); };

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
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectActive, setSubjectActive] = useState(true);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [subjectDeleteError, setSubjectDeleteError] = useState("");
  const subjectMutationRef = useRef(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const apiUrl = API_URL;
  const isModerator = currentAdmin?.role === "moderator";
  const changeActiveTab = (tab) => {
    if (isModerator && !["pending", "reports"].includes(tab)) return;
    setActiveTab(tab);
  };

  const fetchData = useCallback(async () => {
    dataAbortRef.current?.abort();
    const controller = new AbortController();
    dataAbortRef.current = controller;
    setLoading(true);
    setDataError("");
    try {
      const resources = isModerator
        ? [
            { key: "documents", label: "Hàng đợi kiểm duyệt", path: "/admin/documents?status=pending" },
            { key: "reports", label: "Báo cáo chờ xử lý", path: "/admin/reports?status=pending" },
          ]
        : [
            { key: "documents", label: "Tài liệu", path: "/admin/documents" },
            { key: "users", label: "Người dùng", path: "/admin/users" },
            { key: "stats", label: "Thống kê", path: "/admin/stats" },
            { key: "subjects", label: "Học phần", path: "/admin/subjects" },
            { key: "reports", label: "Báo cáo", path: "/admin/reports" },
            { key: "audit", label: "Nhật ký", path: "/admin/audit-logs" },
            { key: "settings", label: "Cài đặt hệ thống", path: "/admin/system-settings" },
          ];
      const results = await Promise.allSettled(resources.map(async ({ label, path }) => {
        const res = await fetch(`${apiUrl}${path}`, { headers: getAuthHeaders(), signal: controller.signal });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const error = new Error(`${label}: ${body.message || "Không tải được dữ liệu"}`);
          error.status = res.status;
          throw error;
        }
        return res.json();
      }));
      if (controller.signal.aborted) return;
      if (results.some((result) => result.status === "rejected" && [401, 403].includes(result.reason.status))) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChange"));
        window.location.href = "/";
        return;
      }
      const dataByKey = new Map(resources.map((resource, index) => [resource.key, results[index]]));
      const documentsResult = dataByKey.get("documents");
      if (documentsResult?.status === "fulfilled") {
        const docsList = Array.isArray(documentsResult.value) ? documentsResult.value : [];
        setAllDocs(docsList);
        setPendingDocs(docsList.filter((d) => d.status === "pending"));
      }
      const usersResult = dataByKey.get("users");
      setUsers(usersResult?.status === "fulfilled" && Array.isArray(usersResult.value) ? usersResult.value : []);
      const statsResult = dataByKey.get("stats");
      if (statsResult?.status === "fulfilled") setDocumentStats(statsResult.value);
      const subjectsResult = dataByKey.get("subjects");
      if (subjectsResult?.status === "fulfilled") {
        const subjectList = Array.isArray(subjectsResult.value.subjects) ? subjectsResult.value.subjects : [];
        const maxCount = Math.max(...subjectList.map((subject) => subject.count || 0), 1);
        setSubjects(
          subjectList.map((subject) => ({
            ...subject,
            id: subject.id || subject._id || subject.name,
            percentage: Math.round(((subject.count || 0) / maxCount) * 100),
          }))
        );
      }

      const reportsResult = dataByKey.get("reports");
      if (reportsResult?.status === "fulfilled") {
        setReports(Array.isArray(reportsResult.value.reports) ? reportsResult.value.reports : []);
      }
      const auditResult = dataByKey.get("audit");
      setAuditLogs(auditResult?.status === "fulfilled" && Array.isArray(auditResult.value.items) ? auditResult.value.items : []);
      const settingsResult = dataByKey.get("settings");
      if (settingsResult?.status === "fulfilled") {
        const nextSettings = settingsResult.value;
        setSystemSettings(nextSettings);
        setSettingsMessageDraft(nextSettings.maintenanceMessage || "");
        setSettingsUploadsMessageDraft(nextSettings.uploadsMessage || "");
        setSettingsEndAtDraft(nextSettings.maintenanceExpectedEndAt
          ? new Date(new Date(nextSettings.maintenanceExpectedEndAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          : "");
      }
      const failures = results.flatMap((result, index) => result.status === "rejected" ? [result.reason.message || `${resources[index].label}: Không tải được dữ liệu`] : []);
      setDataError(failures.length ? `Chưa cập nhật được đầy đủ dữ liệu. ${failures.join("; ")}` : "");
      if (!failures.length) setLastUpdated(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      if (!controller.signal.aborted) setDataError(e.message || "Không thể tải trang quản trị");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [apiUrl, isModerator]);

  const updateSystemSettings = async (updates) => {
    if (isModerator || settingsSaving) return;
    setSettingsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/admin/system-settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...updates, reason: settingsReason.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể lưu cài đặt hệ thống");
      const savedSettings = data.settings;
      setSystemSettings(savedSettings);
      if (Object.hasOwn(updates, "maintenanceMessage")) setSettingsMessageDraft(savedSettings.maintenanceMessage || "");
      if (Object.hasOwn(updates, "uploadsMessage")) setSettingsUploadsMessageDraft(savedSettings.uploadsMessage || "");
      if (Object.hasOwn(updates, "maintenanceExpectedEndAt")) setSettingsEndAtDraft(savedSettings.maintenanceExpectedEndAt
        ? new Date(new Date(savedSettings.maintenanceExpectedEndAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : "");
      setSettingsReason("");
      toast({ title: "Đã cập nhật cài đặt", description: data.message || "Thay đổi đã được ghi vào nhật ký hệ thống." });
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể lưu cài đặt", description: error.message });
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => { window.clearTimeout(timerId); dataAbortRef.current?.abort(); };
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => () => previewAbortRef.current?.abort(), []);

  // --- Document Approvals & Rejections ---
  const handleApproveDoc = async (docId) => {
    if (!beginMutation(`approve:${docId}`)) return;
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
    } finally {
      finishMutation();
    }
  };

  const handleOpenRejectModal = (doc) => {
    setSelectedPendingDoc(doc);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPendingDoc) return;
    const docId = selectedPendingDoc._id || selectedPendingDoc.id;
    if (!beginMutation(`reject:${docId}`)) return;

    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "rejected", moderationNote: rejectReason }),
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
    } finally {
      finishMutation();
    }
  };

  const handleDeleteDoc = (docId, title = "tài liệu này") => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền xóa tài liệu vĩnh viễn.",
      });
      return;
    }
    setDeleteConfirmation({ type: "document", id: docId, title });
  };

  const confirmDeleteDocument = async (docId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/documents/${docId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAllDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        setPendingDocs((prev) => prev.filter((d) => (d._id || d.id) !== docId));
        void fetchData();
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

  const handleOpenSubjectModal = (subject = null) => {
    setEditingSubject(subject);
    setNewSubjectName(subject?.name || "");
    setNewSubjectCode(subject?.code || (subject ? "" : nextSubjectCode(subjects)));
    setSubjectActive(subject?.active !== false);
    setSubjectError("");
    setSubjectModalOpen(true);
  };

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    if (subjectMutationRef.current || isModerator) return;
    const name = newSubjectName.trim();
    if (name.length < 2) {
      setSubjectError("Tên học phần phải có ít nhất 2 ký tự.");
      return;
    }

    subjectMutationRef.current = true;
    setSubjectSaving(true);
    setSubjectError("");
    try {
      const response = await fetch(`${apiUrl}/admin/subjects${editingSubject ? `/${encodeURIComponent(editingSubject.id || editingSubject._id)}` : ""}`, {
        method: editingSubject ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, code: newSubjectCode.trim(), active: subjectActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu học phần");
      }

      setSubjectModalOpen(false);
      setNewSubjectName("");
      setNewSubjectCode("");
      toast({ title: editingSubject ? "Đã cập nhật học phần" : "Đã thêm học phần" });
      await fetchData();
    } catch (error) {
      setSubjectError(error.message || "Không thể lưu học phần");
    } finally {
      subjectMutationRef.current = false;
      setSubjectSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject || subjectMutationRef.current || isModerator) return;
    subjectMutationRef.current = true;
    setSubjectSaving(true);
    setSubjectDeleteError("");
    try {
      const response = await fetch(`${apiUrl}/admin/subjects/${encodeURIComponent(deletingSubject.id || deletingSubject._id)}`, {
        method: "DELETE", headers: getAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể xóa học phần");
      setDeletingSubject(null);
      toast({ title: "Đã xóa học phần khỏi danh mục" });
      await fetchData();
    } catch (error) {
      setSubjectDeleteError(error.message);
    } finally {
      subjectMutationRef.current = false;
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
      setReportFeedbackText("Báo cáo không đủ căn cứ xử lý. Thao tác bỏ qua chỉ đóng báo cáo và không thay đổi trạng thái duyệt của tài liệu.");
    }
    setReportModalOpen(true);
  };

  const handleConfirmReportModal = async () => {
    if (!selectedReportForAction) return;
    if (!beginMutation(`report:${selectedReportForAction._id}`)) return;
    const report = selectedReportForAction;
    const action = reportActionType;

    try {
      const reportRes = await fetch(`${apiUrl}/admin/reports/${report._id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          adminFeedback: reportFeedbackText.trim(),
        }),
      });

      if (reportRes.ok) {
        setReportModalOpen(false);
        setSelectedReportForAction(null);
        fetchData();
        toast({
          title: action === "dismiss" ? "Đã bỏ qua báo cáo" : "Đã xử lý báo cáo vi phạm",
          description: action === "dismiss"
            ? "Báo cáo đã đóng; trạng thái duyệt của tài liệu không bị thay đổi."
            : "Tài liệu đã được xử lý theo quyết định vi phạm và người liên quan đã được thông báo.",
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
    } finally {
      finishMutation();
    }
  };

  const handleDeleteReport = (reportId) => {
    if (isModerator) {
      toast({
        variant: "destructive",
        title: "Quyền bị giới hạn",
        description: "Chỉ Quản trị viên (Admin) mới có quyền xóa dữ liệu nhật ký báo cáo.",
      });
      return;
    }
    setDeleteConfirmation({ type: "report", id: reportId });
  };

  const confirmDeleteReport = async (reportId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/reports/${reportId}`, {
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
      const reportRes = await fetch(`${apiUrl}/admin/reports/${report._id}/status`, {
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
        description: "Báo cáo đã chuyển về trạng thái chờ xử lý. Có thể kiểm duyệt lại tài liệu trong mục quản lý tài liệu.",
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
    clearAccountSession();
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
    audit: "Nhật ký kiểm duyệt",
    settings: "Cài đặt hệ thống",
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    const action = deleteConfirmation;
    setDeleteConfirmation(null);
    if (action.type === "document") await confirmDeleteDocument(action.id);
    else await confirmDeleteReport(action.id);
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
    { name: "Đã duyệt", count: approvedDocsCount, fill: "#4b763f" },
    { name: "Chờ duyệt", count: pendingDocs.length, fill: "#c9804d" },
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
  const missingFilesCount = allDocs.filter((doc) => doc.fileAvailable === false).length;
  const filteredDocs = allDocs.filter((doc) =>
    matchesSearch([doc.title, doc.subjectName, doc.uploaderId?.name, doc.fileName], searchQuery) &&
    (docFilterStatus === "all" || doc.status === docFilterStatus) &&
    (docSubjectFilter === "all" || doc.subjectName === docSubjectFilter) &&
    (docSourceFilter === "all" || (docSourceFilter === "missing" ? doc.fileAvailable === false : doc.fileAvailable === true))
  );
  const documentPageKey = JSON.stringify([searchQuery, docFilterStatus, docSubjectFilter, docSourceFilter]);
  const documentPages = Math.max(1, Math.ceil(filteredDocs.length / 20));
  const currentDocumentPage = Math.min(documentPages, documentPage.key === documentPageKey ? documentPage.page : 1);
  const visibleDocs = filteredDocs.slice((currentDocumentPage - 1) * 20, currentDocumentPage * 20);
  const filteredSubjects = subjects.filter((subject) => matchesSearch([subject.name, subject.code], subjectSearch)
    && (subjectStatusFilter === "all" || (subjectStatusFilter === "active" ? subject.active !== false : subject.active === false)));
  const subjectPageKey = JSON.stringify([subjectSearch, subjectStatusFilter]);
  const subjectPages = Math.max(1, Math.ceil(filteredSubjects.length / subjectPageSize));
  const currentSubjectPage = Math.min(subjectPages, subjectPage.key === subjectPageKey ? subjectPage.page : 1);
  const visibleSubjects = filteredSubjects.slice((currentSubjectPage - 1) * subjectPageSize, currentSubjectPage * subjectPageSize);
  const filteredPending = pendingDocs.filter((doc) => matchesSearch([doc.title, doc.subjectName, doc.uploaderId?.name], pendingSearch));
  const filteredReports = reports.filter((report) =>
    (reportFilter === "all" || report.status === reportFilter) &&
    matchesSearch([report.documentId?.title, report.documentTitle, report.reason, report.reporterId?.name, report.reporterId?.email], reportSearch)
  );
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
    <div className="admin-shell min-h-screen bg-background text-foreground flex antialiased selection:bg-primary/30 selection:text-primary">
      {/* 1. LEFT SIDEBAR (Desktop Fixed) */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border/70 flex-col shrink-0 sticky top-0 h-screen z-40">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={changeActiveTab}
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
          <aside className="relative w-72 max-w-[85vw] bg-card border-r border-border/70 flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarNav
              activeTab={activeTab}
              setActiveTab={changeActiveTab}
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
        <header className="h-14 px-4 sm:px-6 bg-card backdrop-blur-md border-b border-border/70 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 text-xs font-medium min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
              title="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="text-muted-foreground hidden sm:inline">Admin</span>
              <span className="text-foreground hidden sm:inline">/</span>
              <span className="text-foreground font-bold text-sm truncate">{tabTitles[activeTab]}</span>
            </div>

            {/* Role indicator pill badge */}
            <Badge
              variant="outline"
              className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isModerator
                  ? "bg-accent/10 text-primary border-primary/30"
                  : "bg-primary/10 text-primary border-primary/30"
              }`}
            >
              <ShieldCheck className="w-3 h-3 mr-1" />
              {isModerator ? "Kiểm duyệt viên" : "Quản trị viên"}
            </Badge>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs"><ThemeToggle />
            <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-card/80 px-3 py-1.5 rounded-lg border border-border/80">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Cập nhật {lastUpdated || "gần đây"}</span>
              <button
                onClick={fetchData}
                disabled={loading}
                title="Làm mới dữ liệu"
                className="ml-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Làm mới"
              className="md:hidden p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>

            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-card border-border hover:bg-muted text-muted-foreground text-xs font-semibold rounded-xl"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:mr-1.5 text-primary" />
                <span className="hidden sm:inline">Xem Website</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 text-left">
          <PageHeading eyebrow={isModerator ? "STUDYHUB / KIỂM DUYỆT" : "STUDYHUB / QUẢN TRỊ"} title={tabTitles[activeTab]} description={isModerator ? "Xử lý tài liệu và báo cáo đang chờ xét duyệt." : "Tài liệu, học phần và phản hồi — mọi việc cần xử lý ở cùng một nơi."} />
          {dataError && (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-xs text-warning sm:flex-row sm:items-center sm:justify-between">
              <p>{dataError}</p>
              <Button size="sm" variant="outline" disabled={loading} onClick={fetchData} className="shrink-0 border-warning/30 text-warning">Thử lại</Button>
            </div>
          )}
          {loading && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật dữ liệu quản trị…</p>}
          {!loading && activeTab === "overview" && (
            <div className={`grid gap-3 ${isModerator ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {[
                { label: "Tài liệu cần duyệt", count: pendingDocs.length, tab: "pending", tone: "text-warning" },
                { label: "Báo cáo cần xử lý", count: pendingReportsCount, tab: "reports", tone: "text-destructive" },
                { label: "Tài liệu thiếu tệp", count: missingFilesCount, tab: "documents", tone: "text-destructive" },
              ].filter((item) => !isModerator || item.tab !== "documents").map((item) => (
                <button key={item.tab} type="button" onClick={() => {
                  changeActiveTab(item.tab);
                  if (item.tab === "documents") { setDocSourceFilter("missing"); setDocFilterStatus("all"); setDocSubjectFilter("all"); setSearchQuery(""); setDocumentPage({ key: "", page: 1 }); }
                }} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 text-left transition hover:border-primary/40">
                  <span className="text-xs font-semibold text-muted-foreground">{item.label}</span><strong className={`text-2xl ${item.tone}`}>{item.count}</strong>
                </button>
              ))}
            </div>
          )}
          {/* ================= TAB 1: OVERVIEW (Yêu cầu 1: Biểu đồ & Thống kê) ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Primary Stat Cards Row */}
              <div className={`admin-stat-grid grid grid-cols-2 ${isModerator ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-4`}>
                {/* Stat 1: Người dùng */}
                {!isModerator && <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span>NGƯỜI DÙNG</span>
                      <div className="w-7 h-7 rounded-lg bg-accent/10 text-primary flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight">{users.length}</div>
                    <div className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{recentUsersCount} thành viên trong 30 ngày</span>
                    </div>
                  </CardContent>
                </Card>}

                {/* Stat 2: Tài liệu công khai */}
                {!isModerator && <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span>TÀI LIỆU CÔNG KHAI</span>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Files className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight">{approvedDocsCount}</div>
                    <div className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{documentStats?.summary?.totalDownloads || 0} lượt tải tổng cộng</span>
                    </div>
                  </CardContent>
                </Card>}

                {/* Stat 3: Việc chờ xử lý */}
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span>HÀNG ĐỢI KIỂM DUYỆT</span>
                      <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight">{pendingDocs.length}</div>
                    <div className="text-[11px] font-semibold text-warning">
                      <span>{pendingDocs.length > 0 ? "Cần xét duyệt nội dung mới" : "Không có tồn đọng"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stat 4: Báo cáo vi phạm */}
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span>BÁO CÁO CHỜ XỬ LÝ</span>
                      <div className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                        <MessageSquareWarning className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight">{pendingReportsCount}</div>
                    <div className="text-[11px] font-semibold text-destructive">
                      <span>{pendingReportsCount > 0 ? "Phản ánh từ sinh viên" : "Cộng đồng an toàn"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 1: AreaChart (Uploads theo tháng) & BarChart (Phân bố trạng thái tài liệu) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AreaChart: 2 cols */}
                <Card className="lg:col-span-2 bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span>Tài liệu upload theo thời gian</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Biểu đồ xu hướng tài liệu được chia sẻ trong các tháng gần nhất
                      </CardDescription>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {allDocs.length} tài liệu
                    </span>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUploadsEmerald" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / .2)" vertical={false} />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "0.75rem",
                              fontSize: "11px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="uploads"
                            name="Số tài liệu"
                            stroke="hsl(var(--primary))"
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
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <span>Trạng thái kiểm duyệt</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Phân bố tài liệu & phản ánh
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={docStatusChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / .2)" vertical={false} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} allowDecimals={false} />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "0.75rem",
                              fontSize: "11px",
                              color: "hsl(var(--foreground))",
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

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                        <span className="text-primary font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary" /> Đã duyệt
                        </span>
                        <span className="font-bold text-foreground">{approvedDocsCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                        <span className="text-warning font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-warning" /> Chờ duyệt
                        </span>
                        <span className="font-bold text-foreground">{pendingDocs.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Thống kê cơ cấu người dùng & Báo cáo cộng đồng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Cơ cấu người dùng theo vai trò */}
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Cơ cấu người dùng</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Tổng {users.length} tài khoản trong cơ sở dữ liệu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          Sinh viên
                        </span>
                        <span className="font-bold text-foreground font-mono">{studentUsersCount} ({users.length ? Math.round((studentUsersCount / users.length) * 100) : 0}%)</span>
                      </div>
                      <Progress value={users.length ? (studentUsersCount / users.length) * 100 : 0} className="h-1.5 bg-muted [&>div]:bg-accent" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          Kiểm duyệt viên (Moderator)
                        </span>
                        <span className="font-bold text-foreground font-mono">{moderatorUsersCount}</span>
                      </div>
                      <Progress value={users.length ? (moderatorUsersCount / users.length) * 100 : 0} className="h-1.5 bg-muted [&>div]:bg-accent" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          Quản trị viên (Admin)
                        </span>
                        <span className="font-bold text-foreground font-mono">{adminUsersCount}</span>
                      </div>
                      <Progress value={users.length ? (adminUsersCount / users.length) * 100 : 0} className="h-1.5 bg-muted [&>div]:bg-primary" />
                    </div>

                    {blockedUsersCount > 0 && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-destructive">
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
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquareWarning className="w-4 h-4 text-destructive" />
                      <span>An toàn nội dung & Báo cáo</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Tỷ lệ xử lý các phản ánh vi phạm
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card/80 border border-border">
                      <div>
                        <div className="text-2xl font-extrabold text-foreground">{reportResolutionRate}%</div>
                        <div className="text-[11px] text-muted-foreground">Tỷ lệ giải quyết vi phạm</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-card border border-border/80">
                        <div className="text-[10px] text-muted-foreground">Tổng nhận</div>
                        <div className="text-sm font-bold text-foreground">{reports.length}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/80">
                        <div className="text-[10px] text-primary">Đã xử lý</div>
                        <div className="text-sm font-bold text-primary">{resolvedReportsCount}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/80">
                        <div className="text-[10px] text-warning">Chờ duyệt</div>
                        <div className="text-sm font-bold text-warning">{pendingReportsCount}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => changeActiveTab("reports")}
                      className="w-full py-2 text-center text-xs font-semibold text-primary hover:text-primary hover:underline cursor-pointer"
                    >
                      Mở bảng quản lý báo cáo chi tiết →
                    </button>
                  </CardContent>
                </Card>

                {/* 3. Top Học phần quan tâm & Định dạng file */}
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">Học phần nổi bật</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">Môn học có nhiều tài liệu nhất</CardDescription>
                    </div>
                    <button
                      onClick={() => changeActiveTab("subjects")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Xem tất cả
                    </button>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2.5">
                    {[...subjects].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 3).map((sub) => (
                      <div key={sub.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground truncate max-w-[160px]">{sub.name}</span>
                          <span className="font-bold text-primary text-[11px]">{sub.count} tài liệu</span>
                        </div>
                        <Progress value={sub.percentage || 0} className="h-1 bg-muted [&>div]:bg-primary" />
                      </div>
                    ))}

                    <Separator className="bg-muted/60 my-2" />

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1.5">
                        <span>Định dạng file lưu trữ</span>
                        <span className="text-primary font-bold">{allDocs.length} file</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileFormatStats.map((format) => (
                          <div key={format.type} className="flex-1 p-1.5 rounded-lg bg-card border border-border/80 text-center">
                            <div className="text-[9px] text-muted-foreground font-bold uppercase">{format.type}</div>
                            <div className="font-bold text-xs text-foreground">{format.percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Quick Pending Queue Table */}
              <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-warning" />
                      <span>Hàng chờ kiểm duyệt cần xử lý ({pendingDocs.length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Tài liệu mới gửi lên chờ phê duyệt để hiển thị cho cộng đồng
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => changeActiveTab("pending")}
                    className="text-xs font-semibold text-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    Xem tất cả ({pendingDocs.length}) →
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingDocs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
                      <CheckCircle className="w-8 h-8 text-primary mx-auto opacity-80" />
                      <p className="font-semibold text-muted-foreground">Không có tài liệu nào chờ duyệt.</p>
                      <p className="text-[11px] text-muted-foreground">Tất cả tài liệu gửi lên đã được xem xét xong.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto min-w-full">
                      <Table>
                        <TableHeader className="bg-card/60 text-xs">
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Tiêu đề tài liệu</TableHead>
                            <TableHead className="text-muted-foreground">Học phần</TableHead>
                            <TableHead className="text-muted-foreground">Người đăng</TableHead>
                            <TableHead className="text-right text-muted-foreground">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {pendingDocs.slice(0, 4).map((doc) => (
                            <TableRow key={doc._id || doc.id} className="border-border/60 hover:bg-card/40">
                              <TableCell className="font-semibold text-foreground max-w-xs truncate">
                                {doc.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                  {doc.subjectName || doc.subjectId?.name || "Khác"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {doc.uploaderId?.name || "Thành viên"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    disabled={doc.fileAvailable === false || Boolean(mutationKey)}
                                    onClick={() => handleApproveDoc(doc._id || doc.id)}
                                    className="h-7 px-2.5 bg-primary hover:bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenRejectModal(doc)}
                                    className="h-7 px-2.5 border-border text-destructive hover:bg-destructive/10 rounded-lg text-xs cursor-pointer"
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
                <div className="p-3.5 rounded-2xl bg-accent/10 border border-primary/60 text-primary text-xs flex items-start gap-3 shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground text-xs">Chế độ Kiểm duyệt viên (Moderator)</p>
                    <p className="text-primary/90 text-[11px] leading-relaxed mt-0.5">
                      Bạn có quyền xem danh sách thành viên. Để đảm bảo an toàn hệ thống, chức năng đổi vai trò và khóa/mở khóa tài khoản chỉ dành riêng cho Quản trị viên (Quản trị viên).
                    </p>
                  </div>
                </div>
              )}

              {/* User KPI summary chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">TỔNG THÀNH VIÊN</div>
                  <div className="text-lg font-extrabold text-foreground mt-0.5">{users.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className="text-[10px] text-primary font-bold uppercase">SINH VIÊN</div>
                  <div className="text-lg font-extrabold text-primary mt-0.5">{studentUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className="text-[10px] text-primary font-bold uppercase">KIỂM DUYỆT VIÊN</div>
                  <div className="text-lg font-extrabold text-primary mt-0.5">{moderatorUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className="text-[10px] text-primary font-bold uppercase">QUẢN TRỊ VIÊN</div>
                  <div className="text-lg font-extrabold text-primary mt-0.5">{adminUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-destructive font-bold uppercase">TÀI KHOẢN KHÓA</div>
                  <div className="text-lg font-extrabold text-destructive mt-0.5">{blockedUsersCount}</div>
                </div>
              </div>

              {/* Users Table Card */}
              <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="border-b border-border/60 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Danh sách tài khoản ({users.length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Tìm kiếm, lọc thành viên theo vai trò và trạng thái
                    </CardDescription>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                      <Input
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs bg-card border-border text-foreground rounded-xl focus:border-primary"
                      />
                    </div>

                    {/* Role Filter */}
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border text-foreground rounded-xl">
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground text-xs">
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        <SelectItem value="student">Sinh viên</SelectItem>
                        <SelectItem value="moderator">Kiểm duyệt viên</SelectItem>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-[130px] h-9 text-xs bg-card border-border text-foreground rounded-xl">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground text-xs">
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
                        className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
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
                      <TableHeader className="bg-card/80 text-xs">
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Thành viên</TableHead>
                          <TableHead className="text-muted-foreground">Email</TableHead>
                          <TableHead className="text-muted-foreground">Vai trò</TableHead>
                          <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                          <TableHead className="text-muted-foreground">Ngày tham gia</TableHead>
                          <TableHead className="text-right text-muted-foreground">Hành động</TableHead>
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
                              <TableRow key={u._id} className="border-border/60 hover:bg-card/40">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="w-7 h-7 rounded-lg border border-border bg-muted text-foreground">
                                      <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs rounded-lg">
                                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <span>{u.name}</span>
                                        {isSelf && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-normal">
                                            (Bạn)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-[11px]">{u.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold ${
                                      role === "admin"
                                        ? "bg-destructive/15 text-destructive border-destructive/30"
                                        : role === "moderator"
                                        ? "bg-accent/15 text-primary border-primary/30"
                                        : "bg-card text-muted-foreground border-border"
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
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-destructive/10 text-destructive border-destructive/30"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        status === "active" ? "bg-primary" : "bg-destructive"
                                      }`}
                                    />
                                    {status === "active" ? "Hoạt động" : "Bị khóa"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap text-[11px]">
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
                                      className="h-7 px-2.5 text-xs font-semibold rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-40"
                                    >
                                      <UserCog className="w-3.5 h-3.5 mr-1 text-primary" />
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
                                          ? "border-border text-destructive hover:bg-destructive/10"
                                          : "bg-primary hover:bg-primary text-primary-foreground"
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
            <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-border/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Files className="w-4 h-4 text-primary" />
                    <span>Kho tài liệu ({filteredDocs.length}/{allDocs.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Toàn bộ tài liệu được đóng góp trên hệ thống
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <Input
                      placeholder="Tên tài liệu, học phần, người đăng..."
                      aria-label="Tìm tài liệu trong trang quản trị"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setDocumentPage({ key: "", page: 1 }); }}
                      className="pl-9 h-9 text-xs bg-card border-border text-foreground rounded-xl"
                    />
                  </div>

                  <Select value={docFilterStatus} onValueChange={value => { setDocFilterStatus(value); setDocumentPage({ key: "", page: 1 }); }}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border text-foreground rounded-xl">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground text-xs">
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="rejected">Bị từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={docSubjectFilter} onValueChange={value => { setDocSubjectFilter(value); setDocumentPage({ key: "", page: 1 }); }}>
                    <SelectTrigger aria-label="Lọc tài liệu theo học phần" className="w-[180px] h-9 text-xs bg-card border-border text-foreground rounded-xl"><SelectValue placeholder="Học phần" /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="all">Mọi học phần</SelectItem>
                      {subjects.map((subject) => <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={docSourceFilter} onValueChange={value => { setDocSourceFilter(value); setDocumentPage({ key: "", page: 1 }); }}>
                    <SelectTrigger aria-label="Lọc theo tình trạng tệp" className="w-[150px] h-9 text-xs bg-card border-border text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="all">Tất cả tệp</SelectItem><SelectItem value="missing">Thiếu tệp nguồn</SelectItem><SelectItem value="ready">Tệp sẵn sàng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto min-w-full">
                  <Table>
                    <TableHeader className="bg-card/80 text-xs">
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Tên tài liệu</TableHead>
                        <TableHead className="text-muted-foreground">Học phần</TableHead>
                        <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                        <TableHead className="text-muted-foreground">Lượt tải</TableHead>
                        <TableHead className="text-right text-muted-foreground">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {visibleDocs.map((doc) => (
                          <TableRow key={doc._id || doc.id} className="border-border/60 hover:bg-card/40">
                            <TableCell className="font-semibold text-foreground max-w-xs" title={doc.title}>
                              <div className="truncate">{doc.title}</div>
                              {doc.fileAvailable === false && (
                                <span className="mt-1 inline-flex text-[10px] font-medium text-destructive">
                                  Thiếu tệp nguồn
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-card text-muted-foreground border-border text-[10px]">
                                {doc.subjectName || "Khác"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.status === "approved" && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                                  Đã duyệt
                                </Badge>
                              )}
                              {doc.status === "pending" && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">
                                  Chờ duyệt
                                </Badge>
                              )}
                              {doc.status === "rejected" && (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                                  Bị từ chối
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-destructive font-bold tabular-nums">{doc.downloadCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fileUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={doc.fileAvailable === false}
                                    onClick={() => handleOpenPreview(doc)}
                                    title={doc.fileAvailable === false ? doc.fileIssue : "Xem trước an toàn"}
                                    className="h-7 px-2 border-border text-muted-foreground rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {!isModerator && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDoc(doc._id || doc.id, doc.title)}
                                    className="h-7 px-2 border-border text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                    title="Xóa vĩnh viễn (Chỉ Admin)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!loading && visibleDocs.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Không có tài liệu phù hợp với bộ lọc.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
                {!loading && <div className="px-5"><Pagination label="Phân trang kho tài liệu quản trị" itemLabel="tài liệu" page={currentDocumentPage} total={filteredDocs.length} pageSize={20} onPageChange={page => setDocumentPage({ key: documentPageKey, page })} /></div>}
              </CardContent>
            </Card>
          )}

          {/* ================= TAB 4: SUBJECTS MANAGEMENT ================= */}
          {activeTab === "subjects" && (
            <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Danh mục học phần ({subjects.length})</h3>
                  <p className="text-sm text-muted-foreground mt-1">Phân loại tài liệu và quản lý học phần đang sử dụng.</p>
                </div>
                {!isModerator && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenSubjectModal()}
                    disabled={subjectSaving}
                    className="h-10 bg-primary hover:bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Thêm học phần
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input aria-label="Tìm học phần" placeholder="Tìm theo tên hoặc mã học phần..." value={subjectSearch} onChange={(event) => { setSubjectSearch(event.target.value); setSubjectPage({ key: "", page: 1 }); }} className="min-w-0 w-full sm:flex-1 sm:min-w-[240px] max-w-md bg-card border-border text-foreground" />
                <select aria-label="Trạng thái học phần" value={subjectStatusFilter} onChange={event => { setSubjectStatusFilter(event.target.value); setSubjectPage({ key: "", page: 1 }); }} className="h-10 w-full sm:w-auto rounded-xl border border-border bg-card px-3 text-sm text-foreground">
                  <option value="all">Tất cả trạng thái</option><option value="active">Đang sử dụng</option><option value="inactive">Ngừng sử dụng</option>
                </select>
              </div>
              {loading ? <div role="status" className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Đang tải học phần…</div> : filteredSubjects.length === 0 ? (
                <div className="py-14 text-center rounded-xl border border-dashed border-border bg-card/30">
                  <GraduationCap className="w-9 h-9 mx-auto text-foreground mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">{subjectSearch || subjectStatusFilter !== "all" ? "Không tìm thấy học phần phù hợp" : "Chưa có học phần"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subjectSearch || subjectStatusFilter !== "all" ? "Thử từ khóa hoặc trạng thái khác." : isModerator
                      ? "Quản trị viên chưa tạo học phần nào."
                      : "Nhấn “Thêm học phần” để tạo danh mục đầu tiên."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {visibleSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="subject-admin-card min-w-0 p-4 rounded-xl bg-card/80 border border-border/80 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1">
                      {sub.code && (
                        <span className="px-2 py-0.5 rounded-md bg-card text-primary text-[10px] font-mono font-bold border border-primary/20">
                          {sub.code}
                        </span>
                      )}
                      <h4 className="font-bold text-foreground text-base leading-relaxed [overflow-wrap:anywhere] pt-1">{sub.name}</h4>
                      <p className="text-sm text-muted-foreground">{sub.count || 0} tài liệu học tập</p>
                      <span className={`inline-flex rounded-lg px-2 py-1 text-xs ${sub.active === false ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{sub.active === false ? "Ngừng sử dụng" : "Đang sử dụng"}</span>
                    </div>
                    {!isModerator && <div className="flex gap-2 border-t border-border pt-3">
                      <Button type="button" variant="outline" size="sm" className="flex-1" aria-label={`Sửa học phần ${sub.name}`} disabled={subjectSaving} onClick={() => handleOpenSubjectModal(sub)}><Pencil size={15} className="mr-1.5" />Sửa</Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" aria-label={`Xóa học phần ${sub.name}`} disabled={subjectSaving} onClick={() => { setSubjectDeleteError(""); setDeletingSubject(sub); }}><Trash2 size={15} className="mr-1.5" />Xóa</Button>
                    </div>}
                  </div>
                  ))}
                </div>
              )}
              {!loading && <Pagination label="Phân trang học phần" itemLabel="học phần" page={currentSubjectPage} total={filteredSubjects.length} pageSize={subjectPageSize} onPageChange={page => setSubjectPage({ key: subjectPageKey, page })} />}
            </Card>
          )}

          {/* ================= TAB 5: PENDING QUEUE (Kiểm duyệt tài liệu) ================= */}
          {activeTab === "pending" && (
            <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-border/60 pb-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-warning" />
                    <span>Hàng đợi kiểm duyệt tài liệu ({filteredPending.length}/{pendingDocs.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Phê duyệt hoặc từ chối các tài liệu mới do cộng đồng gửi lên
                  </CardDescription>
                </div>
                <Input aria-label="Tìm tài liệu chờ duyệt" placeholder="Tên, học phần hoặc người đăng..." value={pendingSearch} onChange={(event) => setPendingSearch(event.target.value)} className="max-w-sm bg-card border-border text-foreground text-xs" />
              </CardHeader>
              <CardContent className="p-0">
                {filteredPending.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto opacity-90" />
                    <p className="font-bold text-foreground text-sm">{pendingSearch ? "Không tìm thấy tài liệu phù hợp" : "Hàng đợi kiểm duyệt đang trống"}</p>
                    <p className="text-xs text-muted-foreground">{pendingSearch ? "Thử từ khóa khác hoặc xóa tìm kiếm." : "Tất cả tài liệu mới đã được xử lý xong."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto min-w-full">
                    <Table>
                      <TableHeader className="bg-card/80 text-xs">
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Tên tài liệu</TableHead>
                          <TableHead className="text-muted-foreground">Học phần</TableHead>
                          <TableHead className="text-muted-foreground">Người đăng</TableHead>
                          <TableHead className="text-muted-foreground">Định dạng</TableHead>
                          <TableHead className="text-muted-foreground">Ngày gửi</TableHead>
                          <TableHead className="text-right text-muted-foreground">Thao tác duyệt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {filteredPending.map((doc) => (
                          <TableRow key={doc._id || doc.id} className="border-border/60 hover:bg-card/40">
                            <TableCell className="font-semibold text-foreground max-w-xs" title={doc.title}>
                              <div className="truncate">{doc.title}</div>
                              {doc.fileAvailable === false && (
                                <span className="mt-1 inline-flex text-[10px] font-medium text-destructive">
                                  Thiếu tệp nguồn
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                                {doc.subjectName || doc.subjectId?.name || "Khác"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-foreground font-medium">{doc.uploaderId?.name || "Thành viên"}</div>
                              <div className="text-[10px] text-muted-foreground">{doc.uploaderId?.email}</div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">
                              {doc.fileType || "PDF"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[11px]">
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
                                    className="h-8 px-2.5 border-border text-muted-foreground hover:bg-muted rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  disabled={doc.fileAvailable === false || Boolean(mutationKey)}
                                  onClick={() => handleApproveDoc(doc._id || doc.id)}
                                  className="h-8 px-3 bg-primary hover:bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(doc)}
                                  className="h-8 px-3 border-border text-destructive hover:bg-destructive/10 rounded-lg text-xs font-semibold cursor-pointer"
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
            <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <MessageSquareWarning className="w-4 h-4 text-primary" />
                    <span>Quản lý báo cáo vi phạm ({reports.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Xử lý các phản ánh vi phạm từ thành viên và tự động gửi thông báo kết quả.
                  </CardDescription>
                </div>

                <Input aria-label="Tìm báo cáo" placeholder="Tài liệu, lý do hoặc người báo cáo..." value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} className="max-w-sm bg-card border-border text-foreground text-xs" />
                {/* Filter tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex rounded-xl bg-card border border-border p-0.5 text-xs">
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
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredReports.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs">
                    Không có báo cáo nào ở danh mục này.
                  </div>
                ) : (
                  <div className="overflow-x-auto min-w-full">
                    <Table>
                      <TableHeader className="bg-card/50">
                        <TableRow className="border-border/80 hover:bg-transparent">
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Tài liệu</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Người báo cáo</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Lý do vi phạm</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Ngày gửi</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Trạng thái</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/30">
                        {filteredReports
                          .map((report) => {
                            const isPending = report.status === "pending";
                            const isResolved = report.status === "resolved";
                            const docId = report.documentId?._id || report.documentId;
                            const docTitle = report.documentId?.title || report.documentTitle || "Tài liệu bị xóa";

                            return (
                              <TableRow key={report._id} className="border-border/60 hover:bg-card/40">
                                <TableCell className="font-semibold text-xs text-foreground max-w-[200px]">
                                  {report.documentId ? (
                                    <div className="space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const document = allDocs.find((doc) => String(doc._id || doc.id) === String(docId));
                                          if (document) void handleOpenPreview(document);
                                          else toast({ variant: "destructive", title: "Chưa tải được tài liệu", description: "Vui lòng làm mới dữ liệu rồi thử lại." });
                                        }}
                                        className="hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                                      >
                                        <span>{docTitle}</span>
                                        <Eye className="w-3 h-3 shrink-0 opacity-50" />
                                      </button>
                                      {report.documentId?.status && (
                                        <small className="block text-[10px] font-medium text-muted-foreground">
                                          Tài liệu: {DOCUMENT_STATUS_LABELS[report.documentId.status] || "Không công khai"}
                                        </small>
                                      )}
                                    </div>
                                  ) : (
                                    <span>{docTitle}<small className="block text-muted-foreground">Đã xóa khỏi hệ thống</small></span>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs text-muted-foreground">
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {report.reporterId?.name || "Người dùng StudyHub"}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{report.reporterId?.email}</div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                                  <div className="line-clamp-2" title={report.reason}>
                                    {report.reason}
                                  </div>
                                  {report.adminFeedback && (
                                    <div className="text-[10px] text-primary/90 mt-1 italic line-clamp-1">
                                      Phản hồi: {report.adminFeedback}
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap text-[11px]">
                                  {new Date(report.createdAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </TableCell>

                                <TableCell>
                                  {isPending && (
                                    <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] font-bold">
                                      Chờ xử lý
                                    </Badge>
                                  )}
                                  {isResolved && (
                                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold">
                                      Đã xử lý
                                    </Badge>
                                  )}
                                  {report.status === "dismissed" && (
                                    <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-bold">
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
                                          className="h-7 px-2.5 bg-destructive hover:bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold cursor-pointer"
                                          title="Gỡ tài liệu và chấp thuận báo cáo"
                                        >
                                          Xử lý vi phạm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenReportModal(report, "dismiss")}
                                          className="h-7 px-2.5 border-border text-muted-foreground hover:bg-muted rounded-lg text-xs font-semibold cursor-pointer"
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
                                          className="h-7 px-2 border-border text-muted-foreground hover:text-foreground rounded-lg text-xs cursor-pointer"
                                        >
                                          Mở lại
                                        </Button>
                                        {!isModerator && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteReport(report._id)}
                                            className="h-7 px-2 border-border text-destructive hover:bg-destructive/10 rounded-lg text-xs cursor-pointer"
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

          {/* ================= TAB 7: MODERATION AUDIT ================= */}
          {activeTab === "audit" && (
            <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-border/80">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Nhật ký kiểm duyệt
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Theo dõi người xử lý, thời điểm, trạng thái trước/sau và lý do của từng quyết định.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditLogs.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs">Chưa có hoạt động kiểm duyệt nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-card/50">
                        <TableRow className="border-border/80 hover:bg-transparent">
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Thời gian</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Người xử lý</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Hoạt động</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Tài liệu / báo cáo</TableHead>
                          <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Lý do</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => {
                          const title = log.metadata?.title || log.metadata?.documentTitle || (log.entityType === "SystemSetting" ? "Cài đặt hệ thống" : "Tài liệu / báo cáo");
                          const actionLabel = ({ document_status_changed: "Đổi trạng thái tài liệu", report_status_changed: "Xử lý báo cáo", subject_updated: "Cập nhật học phần", subject_deleted: "Xóa học phần", system_settings_updated: "Cập nhật cài đặt hệ thống" })[log.action] || log.action;
                          const settingFieldLabels = { maintenanceEnabled: "Bảo trì website", maintenanceMessage: "Thông báo bảo trì", maintenanceExpectedEndAt: "Thời gian mở lại", uploadsEnabled: "Nhận tài liệu mới", uploadsMessage: "Thông báo tải lên" };
                          const changeSummary = log.action === "system_settings_updated" ? (log.metadata?.changedFields || []).map((field) => settingFieldLabels[field] || field).join(", ") : `${log.previousStatus || "—"} → ${log.nextStatus || "—"}`;
                          return (
                            <TableRow key={log._id} className="border-border/60 hover:bg-card/40">
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                              <TableCell className="text-xs"><strong className="text-foreground">{log.actorId?.name || log.actorName || "Hệ thống"}</strong><span className="block text-[10px] text-muted-foreground">{log.actorRole || log.actorId?.role || ""}</span></TableCell>
                              <TableCell className="text-xs"><span className="font-semibold text-foreground">{actionLabel}</span><span className="block text-[10px] text-muted-foreground">{changeSummary}</span></TableCell>
                              <TableCell className="text-xs text-foreground max-w-[220px] truncate" title={title}>{title}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate" title={log.reason || ""}>{log.reason || "Không có ghi chú"}</TableCell>
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

          {activeTab === "settings" && !isModerator && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
                Chỉ quản trị viên mới có thể thay đổi trạng thái dịch vụ. Mọi thay đổi sẽ được ghi vào nhật ký quản trị.
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardHeader className="border-b border-border/70 p-5">
                    <CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-4 w-4 text-warning" /> Bảo trì website</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">Ẩn các chức năng công khai tạm thời. Đăng nhập, kiểm tra tình trạng và trang quản trị vẫn hoạt động để có thể tắt bảo trì.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/30 p-4">
                      <span><strong className="block text-sm">{systemSettings.maintenanceEnabled ? "Đang bật bảo trì" : "Website đang hoạt động"}</strong><span className="mt-1 block text-xs text-muted-foreground">Có hiệu lực trên API công khai.</span></span>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label="Bật chế độ bảo trì website"
                        checked={systemSettings.maintenanceEnabled}
                        disabled={settingsSaving}
                        onChange={(event) => void updateSystemSettings({ maintenanceEnabled: event.target.checked })}
                        className="h-5 w-9 shrink-0 cursor-pointer accent-primary disabled:cursor-wait"
                      />
                    </label>
                    {systemSettings.maintenanceEnabled && <p className="rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs leading-relaxed text-warning">Khách truy cập sẽ nhận trang bảo trì. Tài khoản admin và moderator vẫn có thể vào trang quản trị.</p>}
                    <div className="space-y-1.5">
                      <Label htmlFor="maintenance-message" className="text-xs font-semibold text-muted-foreground">Thông báo hiển thị</Label>
                      <Input id="maintenance-message" maxLength={500} disabled={settingsSaving} value={settingsMessageDraft} onChange={(event) => setSettingsMessageDraft(event.target.value)} className="bg-card text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maintenance-end-at" className="text-xs font-semibold text-muted-foreground">Dự kiến mở lại (không bắt buộc)</Label>
                      <Input id="maintenance-end-at" type="datetime-local" disabled={settingsSaving} value={settingsEndAtDraft} onChange={(event) => setSettingsEndAtDraft(event.target.value)} className="bg-card text-sm" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                  <CardHeader className="border-b border-border/70 p-5">
                    <CardTitle className="flex items-center gap-2 text-base"><CloudUpload className="h-4 w-4 text-primary" /> Nhận tài liệu mới</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">Tắt đăng tải khi cần xử lý hàng đợi hoặc khắc phục lỗi tải tệp. Thư viện vẫn xem và tải tài liệu bình thường.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/30 p-4">
                      <span><strong className="block text-sm">{systemSettings.uploadsEnabled ? "Đang nhận tài liệu" : "Đang tạm ngưng nhận tài liệu"}</strong><span className="mt-1 block text-xs text-muted-foreground">Ngăn cả thao tác tải tệp qua API.</span></span>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label="Cho phép tải tài liệu mới lên"
                        checked={systemSettings.uploadsEnabled}
                        disabled={settingsSaving}
                        onChange={(event) => void updateSystemSettings({ uploadsEnabled: event.target.checked })}
                        className="h-5 w-9 shrink-0 cursor-pointer accent-primary disabled:cursor-wait"
                      />
                    </label>
                    <div className="space-y-1.5">
                      <Label htmlFor="uploads-message" className="text-xs font-semibold text-muted-foreground">Thông báo khi tạm ngưng</Label>
                      <Input id="uploads-message" maxLength={300} disabled={settingsSaving} value={settingsUploadsMessageDraft} onChange={(event) => setSettingsUploadsMessageDraft(event.target.value)} className="bg-card text-sm" />
                    </div>
                    <p className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">Trạng thái hiện tại: {systemSettings.uploadsEnabled ? "đang mở đăng tải" : "đang tạm dừng đăng tải"}.</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border/80 text-foreground rounded-2xl shadow-xs">
                <CardContent className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-reason" className="text-xs font-semibold text-muted-foreground">Lý do ghi vào nhật ký (không bắt buộc)</Label>
                    <Input id="settings-reason" maxLength={500} disabled={settingsSaving} value={settingsReason} onChange={(event) => setSettingsReason(event.target.value)} placeholder="Ví dụ: Bảo trì máy chủ cơ sở dữ liệu" className="bg-card text-sm" />
                  </div>
                  <Button
                    type="button"
                    disabled={settingsSaving || !settingsMessageDraft.trim() || !settingsUploadsMessageDraft.trim()}
                    onClick={() => void updateSystemSettings({
                      maintenanceMessage: settingsMessageDraft.trim(),
                      maintenanceExpectedEndAt: settingsEndAtDraft ? new Date(settingsEndAtDraft).toISOString() : null,
                      uploadsMessage: settingsUploadsMessageDraft.trim(),
                    })}
                    className="min-w-40 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {settingsSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu</> : <><Check className="mr-2 h-4 w-4" />Lưu thông báo</>}
                  </Button>
                </CardContent>
              </Card>
            </div>
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
        <DialogContent className="w-[96vw] max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl bg-card border-border text-foreground shadow-2xl flex flex-col">
          <DialogHeader className="px-6 py-4 pr-12 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {previewDocument?.title || "Xem trước tài liệu"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                  <span>{previewDocument?.fileName || "Tệp tài liệu"}</span>
                  <span className="text-foreground">•</span>
                  <span>{previewDocument?.subjectName || "Chưa phân loại"}</span>
                </DialogDescription>
              </div>
              <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/30 text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Xem trước, không tự tải xuống
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 bg-card/70 p-3">
            {previewLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs">Đang chuẩn bị bản xem trước an toàn...</p>
              </div>
            )}

            {!previewLoading && previewError && (
              <div className="h-full flex items-center justify-center px-6">
                <div className="max-w-lg text-center p-6 rounded-2xl border border-warning/20 bg-warning/5">
                  <FileText className="w-10 h-10 mx-auto text-warning mb-3" />
                  <p className="text-sm font-bold text-foreground">Chưa thể hiển thị bản xem trước</p>
                  <p className="text-xs leading-relaxed text-muted-foreground mt-2">{previewError}</p>
                </div>
              </div>
            )}

            {!previewLoading && !previewError && previewMode === "pdf" && previewUrl && (
              <iframe
                src={previewUrl}
                title={`Bản xem trước ${previewDocument?.title || "tài liệu PDF"}`}
                className="w-full h-full rounded-xl border border-border bg-card"
              />
            )}

            {!previewLoading && !previewError && previewMode === "office" && previewUrl && (
              <iframe
                src={previewUrl}
                title={`Bản xem trước ${previewDocument?.title || "tài liệu Office"}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-xl border border-border bg-card"
              />
            )}

            {!previewLoading && !previewError && previewMode === "extracted" && extractedPreview && (
              <div className="w-full h-full overflow-auto rounded-xl border border-border bg-muted p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-primary bg-primary/10 px-4 py-3 text-primary">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                      <p className="text-xs leading-relaxed">{extractedPreview.notice}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {extractedPreview.imageCount > 0 && (
                        <Badge variant="outline" className="bg-card text-warning border-warning text-[10px]">
                          {(extractedPreview.images || []).length}/{extractedPreview.imageCount} ảnh hiển thị
                        </Badge>
                      )}
                      {extractedPreview.truncated && (
                        <Badge variant="outline" className="bg-card text-foreground border-border text-[10px]">
                          Nội dung đã rút gọn
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(extractedPreview.sections || []).map((section, index) => (
                    <section key={`${section.title}-${index}`} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                      <h3 className="px-4 py-2.5 border-b border-border bg-muted text-xs font-bold text-foreground">
                        {section.title}
                      </h3>
                      <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-6 text-foreground font-sans">
                        {section.content}
                      </pre>
                    </section>
                  ))}

                  {(extractedPreview.images || []).length > 0 && (
                    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                      <h3 className="px-4 py-2.5 border-b border-border bg-muted text-xs font-bold text-foreground">
                        Hình ảnh trong tài liệu
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {extractedPreview.images.map((image, index) => (
                          <figure key={`${image.name}-${index}`} className="rounded-lg border border-border bg-muted p-2">
                            <img
                              src={image.dataUrl}
                              alt={`Ảnh ${index + 1} trong tài liệu`}
                              loading="lazy"
                              className="w-full max-h-[520px] object-contain rounded-md bg-card"
                            />
                            <figcaption className="px-1 pt-2 text-[10px] text-muted-foreground truncate" title={image.name}>
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
              <pre className="w-full h-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-card p-5 text-sm leading-6 text-foreground">
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
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-card border-border text-foreground shadow-2xl">
          <form onSubmit={handleCreateSubject} className="space-y-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground">{editingSubject ? "Sửa học phần" : "Thêm học phần mới"}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {editingSubject ? "Đổi tên sẽ cập nhật học phần trên các tài liệu liên quan." : "Học phần mới sẽ xuất hiện trong danh sách phân loại khi tải tài liệu lên."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject-name" className="text-xs font-semibold text-muted-foreground">
                  Tên học phần <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject-name"
                  autoFocus
                  maxLength={120}
                  disabled={subjectSaving}
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  placeholder="Ví dụ: Kiến trúc máy tính"
                  className="h-11 text-sm bg-card border-border text-foreground rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject-code" className="text-xs font-semibold text-muted-foreground">
                  Mã học phần <span className="font-normal text-muted-foreground">{editingSubject ? "" : "(tự động)"}</span>
                </Label>
                <Input
                  id="subject-code"
                  maxLength={20}
                  readOnly={!editingSubject}
                  disabled={subjectSaving}
                  value={newSubjectCode}
                  onChange={(event) => setNewSubjectCode(event.target.value.toUpperCase())}
                  placeholder="Mã sẽ được tạo tự động"
                  className="h-11 text-sm font-mono uppercase bg-card border-border text-foreground rounded-xl"
                />
              </div>

              {editingSubject && <div className="space-y-1.5">
                <Label htmlFor="subject-active">Trạng thái</Label>
                <select id="subject-active" value={subjectActive ? "active" : "inactive"} disabled={subjectSaving} onChange={event => setSubjectActive(event.target.value === "active")} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground">
                  <option value="active">Đang sử dụng</option><option value="inactive">Ngừng sử dụng</option>
                </select>
                <p className="text-xs leading-relaxed text-muted-foreground">Ngừng sử dụng sẽ ẩn học phần khỏi lựa chọn khi đăng tài liệu mới. Tài liệu đã có vẫn được giữ lại.</p>
              </div>}

              {subjectError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
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
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={subjectSaving}
                className="bg-primary hover:bg-primary text-primary-foreground font-semibold"
              >
                {subjectSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> {editingSubject ? "Lưu thay đổi" : "Thêm học phần"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingSubject)} onOpenChange={open => { if (!open && !subjectMutationRef.current) setDeletingSubject(null); }}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Xóa học phần?</DialogTitle>
            <DialogDescription className="[overflow-wrap:anywhere]">
              Học phần “{deletingSubject?.name}” sẽ được gỡ khỏi danh mục.
            </DialogDescription>
          </DialogHeader>
          {(deletingSubject?.count || 0) > 0 ? <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed">Học phần này có {deletingSubject.count} tài liệu nên chưa thể xóa. Bạn có thể ngừng sử dụng học phần để giữ lại tài liệu hiện có.</p>
            : <p className="text-sm text-muted-foreground">Chỉ học phần chưa có tài liệu mới được xóa. Hệ thống sẽ kiểm tra lại trước khi thực hiện.</p>}
          {subjectDeleteError && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{subjectDeleteError}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={subjectSaving} onClick={() => setDeletingSubject(null)}>Hủy</Button>
            {(deletingSubject?.count || 0) > 0 ? <Button type="button" onClick={() => { const subject = deletingSubject; setDeletingSubject(null); handleOpenSubjectModal(subject); }}>Sửa trạng thái</Button>
              : <Button type="button" variant="destructive" disabled={subjectSaving} onClick={handleDeleteSubject}>{subjectSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />} {subjectSaving ? "Đang xóa…" : "Xóa học phần"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={(open) => { if (!mutationRef.current) setRejectModalOpen(open); }}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-card border-border text-foreground text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              Từ chối phê duyệt tài liệu
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
              Tài liệu: {selectedPendingDoc?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-muted-foreground">Lý do từ chối</Label>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="w-full h-10 text-xs bg-card border-border text-foreground rounded-xl">
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground text-xs">
                <SelectItem value="Tài liệu không rõ nguồn gốc hoặc chất lượng kém">Tài liệu không rõ nguồn gốc / chất lượng kém</SelectItem>
                <SelectItem value="Tài liệu trùng lặp với tài liệu đã có trên hệ thống">Tài liệu trùng lặp đã có trên hệ thống</SelectItem>
                <SelectItem value="Phân loại sai môn học hoặc thiếu thông tin cần thiết">Phân loại sai môn học / thiếu thông tin</SelectItem>
                <SelectItem value="Tài liệu vi phạm bản quyền / chính sách chia sẻ">Vi phạm bản quyền / chính sách chia sẻ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button type="button" variant="outline" size="sm" disabled={Boolean(mutationKey)} onClick={() => setRejectModalOpen(false)} className="border-border text-muted-foreground hover:bg-muted">
              Hủy
            </Button>
            <Button type="button" size="sm" disabled={Boolean(mutationKey)} onClick={handleConfirmReject} className="bg-destructive hover:bg-destructive text-destructive-foreground font-semibold">
              {mutationKey.startsWith("reject:") ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang từ chối…</> : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 2: REPORT ACTION & FEEDBACK MODAL ================= */}
      <Dialog open={reportModalOpen} onOpenChange={(open) => { if (!mutationRef.current) setReportModalOpen(open); }}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-card border-border text-foreground text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              <span>
                {reportActionType === "dismiss" ? "Bỏ qua báo cáo vi phạm" : "Xử lý vi phạm tài liệu"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
              Tài liệu: {selectedReportForAction?.documentId?.title || selectedReportForAction?.documentTitle || "Tài liệu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-card border border-border/80 text-xs space-y-1">
              <span className="font-semibold text-muted-foreground">Lý do thành viên báo cáo:</span>
              <p className="text-muted-foreground">{selectedReportForAction?.reason}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Ghi chú phản hồi cho người báo cáo (Notification)
              </Label>
              <textarea
                rows={3}
                value={reportFeedbackText}
                maxLength={2000}
                onChange={(e) => setReportFeedbackText(e.target.value)}
                placeholder="Nhập lý do xử lý hoặc lời nhắn gửi đến thành viên..."
                className="w-full p-2.5 text-xs rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Lời nhắn này sẽ hiển thị trực tiếp trong hòm thư Thông báo của thành viên đã gửi báo cáo.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(mutationKey)}
              onClick={() => setReportModalOpen(false)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={Boolean(mutationKey)}
              onClick={handleConfirmReportModal}
              className={
                reportActionType === "dismiss"
                  ? "bg-card hover:bg-card text-foreground font-semibold"
                  : "bg-destructive hover:bg-destructive text-destructive-foreground font-semibold"
              }
            >
              {mutationKey.startsWith("report:") ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý…</> : "Xác nhận & Gửi thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 3: ROLE CHANGE MODAL (Yêu cầu 3) ================= */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-card border-border text-foreground text-left shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              <span>Thay đổi vai trò người dùng</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Phân quyền tài khoản trong hệ thống StudyHub
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* User Target Info Card */}
            <div className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-xl border border-border bg-muted text-foreground">
                <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
                  {selectedUserForRole?.name ? selectedUserForRole.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground text-sm truncate">{selectedUserForRole?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{selectedUserForRole?.email}</div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-muted text-muted-foreground border-border uppercase shrink-0"
              >
                Hiện tại: {selectedUserForRole?.role || "student"}
              </Badge>
            </div>

            {/* Role Options Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Chọn vai trò mới</Label>

              {/* Option 1: Student */}
              <div
                onClick={() => setSelectedNewRole("student")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "student"
                    ? "bg-accent/10 border-primary/50 shadow-xs"
                    : "bg-card/60 border-border hover:border-border hover:bg-card"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "student" ? "bg-accent text-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Sinh viên (Student)</span>
                    {selectedNewRole === "student" && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Quyền cơ bản: xem tài liệu, tải xuống, đăng tài liệu và gửi báo cáo vi phạm.
                  </p>
                </div>
              </div>

              {/* Option 2: Moderator */}
              <div
                onClick={() => setSelectedNewRole("moderator")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "moderator"
                    ? "bg-accent/10 border-primary/50 shadow-xs"
                    : "bg-card/60 border-border hover:border-border hover:bg-card"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "moderator" ? "bg-accent text-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Kiểm duyệt viên (Moderator)</span>
                    {selectedNewRole === "moderator" && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Quyền kiểm duyệt: duyệt/từ chối tài liệu mới, tiếp nhận và xử lý các báo cáo vi phạm cộng đồng.
                  </p>
                </div>
              </div>

              {/* Option 3: Admin */}
              <div
                onClick={() => setSelectedNewRole("admin")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedNewRole === "admin"
                    ? "bg-destructive/10 border-destructive/50 shadow-xs"
                    : "bg-card/60 border-border hover:border-border hover:bg-card"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedNewRole === "admin" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Quản trị viên (Admin)</span>
                    {selectedNewRole === "admin" && <Check className="w-4 h-4 text-destructive" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={roleUpdating || selectedNewRole === selectedUserForRole?.role}
              onClick={handleSaveUserRole}
              className="bg-primary hover:bg-primary text-primary-foreground font-semibold cursor-pointer"
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
      <Dialog open={Boolean(deleteConfirmation)} onOpenChange={open => { if (!open) setDeleteConfirmation(null); }}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 size={18} className="text-destructive" /> Xác nhận xóa</DialogTitle>
            <DialogDescription className="[overflow-wrap:anywhere]">
              {deleteConfirmation?.type === "document"
                ? <>Tài liệu “{deleteConfirmation.title}” sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.</>
                : "Bản ghi báo cáo này sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmation(null)}>Hủy</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 size={16} className="mr-2" /> Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
