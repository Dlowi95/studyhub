import { API_URL } from "@/lib/api";
import { clearAccountSession } from "@/lib/session";
import PageHeading from "@/components/PageHeading";
import Pagination from "@/components/Pagination";
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  Bookmark,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ExternalLink,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [documentsSummary, setDocumentsSummary] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, totalViews: 0, totalDownloads: 0 });
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsPagination, setDocumentsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [documentsReloadKey, setDocumentsReloadKey] = useState(0);
  const documentsRequestRef = useRef(0);
  const [activeTab, setActiveTab] = useState("uploads"); // "uploads" | "saved" | "downloads" | "account"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "approved" | "pending" | "rejected"
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Edit Name & Avatar States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Saved bookmarks and download history from local storage
  const [savedDocs, setSavedDocs] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [followSummary, setFollowSummary] = useState({ followers: 0, following: 0 });

  const navigate = useNavigate();
  const { toast } = useToast();
  const apiUrl = API_URL;

  // 1. Fetch User Profile
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể tải hồ sơ");
      }

      setUser(data);
      setNewName(data.name || "");
      localStorage.setItem("user", JSON.stringify(data));
    } catch {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          setNewName(parsed.name || "");
        } catch {
          window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch User's Real Uploaded Documents
  const fetchMyDocuments = async ({ page, query, status, requestId }) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setDocsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", q: query, status });
      const response = await fetch(`${apiUrl}/documents/my?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (documentsRequestRef.current !== requestId) return;
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        setDocumentsSummary(data.summary || { total: data.count || 0, approved: 0, pending: 0, rejected: 0, totalViews: 0, totalDownloads: 0 });
        const nextPage = Number(data.page) || 1;
        setDocumentsPage(nextPage);
        setDocumentsPagination({
          page: nextPage,
          limit: Number(data.limit) || 10,
          total: Number(data.count) || 0,
          totalPages: Number(data.totalPages) || 0,
        });
      } else if (documentsRequestRef.current === requestId) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Không thể tải tài liệu của bạn");
      }
    } catch (err) {
      if (documentsRequestRef.current === requestId) console.error("Error fetching user documents:", err);
    } finally {
      if (documentsRequestRef.current === requestId) setDocsLoading(false);
    }
  };

  // 3. Load saved docs from the account and keep download history local-only.
  const loadLocalActivity = async () => {
    const token = localStorage.getItem("token");
    const legacySaved = (() => {
      try { return JSON.parse(localStorage.getItem("studyhub_bookmarks") || "[]"); } catch { return []; }
    })();
    try {
      const history = JSON.parse(localStorage.getItem("studyhub_downloads") || "[]");
      setDownloadHistory(history);
    } catch {
      setDownloadHistory([]);
    }

    if (!token) { setSavedDocs(legacySaved); return; }
    try {
      const response = await fetch(`${apiUrl}/bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Không thể tải tài liệu đã lưu");
      let data = await response.json();
      let bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      // Migrate bookmarks created by older versions once the account endpoint is available.
      if (bookmarks.length === 0 && legacySaved.length > 0) {
        await Promise.all(legacySaved.slice(0, 50).map((item) => item.id || item._id
          ? fetch(`${apiUrl}/bookmarks/${item.id || item._id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
          : null));
        const refreshed = await fetch(`${apiUrl}/bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
        if (refreshed.ok) data = await refreshed.json();
        bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      }
      setSavedDocs(bookmarks.map((item) => ({ ...item, id: item.id || item._id, subject: item.subjectName || item.subject || "Khác", uploader: item.uploaderId?.name || item.uploader || "StudyHub" })));
    } catch {
      setSavedDocs(legacySaved);
    }
  };

  const fetchFollowSummary = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/follows/me/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setFollowSummary({ followers: Number(data.followers) || 0, following: Number(data.following) || 0 });
    } catch (error) {
      console.error("Không thể tải thống kê theo dõi:", error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProfile();
      void loadLocalActivity();
      void fetchFollowSummary();
    });

    // Listen for custom event if new upload happens
    const handleDocUploaded = () => {
      setDocumentsPage(1);
      setDocumentsReloadKey((key) => key + 1);
    };
    window.addEventListener("documentUploaded", handleDocUploaded);
    window.addEventListener("bookmarksChanged", loadLocalActivity);
    return () => {
      window.removeEventListener("documentUploaded", handleDocUploaded);
      window.removeEventListener("bookmarksChanged", loadLocalActivity);
    };
    // These loaders are intentionally run once when the profile mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const requestId = ++documentsRequestRef.current;
    const timer = window.setTimeout(() => {
      void fetchMyDocuments({ page: documentsPage, query: searchQuery, status: statusFilter, requestId });
    }, searchQuery ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      if (documentsRequestRef.current === requestId) documentsRequestRef.current += 1;
    };
    // This effect intentionally requests the current server-side filter/page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsPage, searchQuery, statusFilter, documentsReloadKey]);

  const handleLogout = () => {
    clearAccountSession();
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Định dạng không hợp lệ",
        description: "Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File quá lớn",
        description: "Dung lượng ảnh tối đa là 5MB.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarUploading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Không thể phân tích phản hồi máy chủ.", { cause: parseErr });
      }

      if (!res.ok) {
        throw new Error(data.message || "Cập nhật ảnh đại diện thất bại");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));
      toast({
        title: "Cập nhật thành công",
        description: "Ảnh đại diện của bạn đã được thay đổi.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật ảnh",
        description: err.message || "Đã xảy ra lỗi khi tải ảnh lên.",
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  // Name Update Handler
  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast({
        variant: "destructive",
        title: "Tên không hợp lệ",
        description: "Họ và tên không được để trống.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setNameSaving(true);
    try {
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Không thể phân tích phản hồi máy chủ.", { cause: parseErr });
      }

      if (!res.ok) {
        throw new Error(data.message || "Cập nhật tên thất bại");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));
      setIsEditingName(false);
      toast({
        title: "Đã lưu thay đổi",
        description: `Họ và tên mới "${data.user?.name}" đã được cập nhật.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật tên",
        description: err.message || "Đã xảy ra lỗi khi cập nhật tên.",
      });
    } finally {
      setNameSaving(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${apiUrl}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok) {
        setDeleteConfirmId(null);
        setDocumentsReloadKey((key) => key + 1);
        toast({
          title: "Đã xoá tài liệu",
          description: "Tài liệu đã được xoá thành công khỏi kho lưu trữ.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Không thể xoá",
          description: data.message || "Xoá tài liệu thất bại.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Đã xảy ra lỗi khi thực hiện thao tác xoá.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenUpload = () => {
    window.dispatchEvent(new Event("openUploadModal"));
  };

  const stats = documentsSummary;
  const filteredDocuments = documents;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Đang tải hồ sơ sinh viên...</p>
      </div>
    );
  }

  return (
    <div className="profile-page page-shell space-y-7 text-left pb-10">
      <PageHeading eyebrow="GÓC HỌC TẬP CÁ NHÂN" title="Không gian của bạn." description="Quản lý tài liệu đã chia sẻ, theo dõi kiểm duyệt và tìm lại những tài liệu đã lưu." />
      <div className="profile-layout">
        <aside className="profile-sidebar paper-panel" aria-label="Quản lý tài khoản">
          <div className="profile-sidebar-identity">
            <div className="profile-sidebar-avatar-wrap">
              <div className="profile-sidebar-avatar">{avatarUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name || "Ảnh đại diện"} referrerPolicy="no-referrer" /> : user?.name?.charAt(0) || "U"}</div>
              <button type="button" className="profile-avatar-edit" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} aria-label="Đổi ảnh đại diện"><Camera size={15} /></button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            <div className="profile-sidebar-user">
              {isEditingName ? <div className="profile-name-editor"><input aria-label="Tên hiển thị" value={newName} maxLength={60} onChange={event => setNewName(event.target.value)} autoFocus /><button type="button" onClick={handleSaveName} disabled={nameSaving || !newName.trim()} aria-label="Lưu tên">{nameSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button><button type="button" onClick={() => { setIsEditingName(false); setNewName(user?.name || ""); }} aria-label="Hủy sửa tên"><X size={15} /></button></div> : <div className="profile-sidebar-name-row"><h2>{user?.name || "Người dùng StudyHub"}</h2><button type="button" onClick={() => { setNewName(user?.name || ""); setIsEditingName(true); }} aria-label="Sửa tên hiển thị"><Pencil size={14} /></button></div>}
              <p className="profile-sidebar-email">{user?.email}</p>
              <Badge variant="outline" className="profile-role-badge"><ShieldCheck size={13} />{user?.role === "admin" ? "Quản trị viên" : user?.role === "moderator" ? "Kiểm duyệt viên" : "Sinh viên"}</Badge>
            </div>
          </div>
          <nav className="profile-side-nav" aria-label="Các mục hồ sơ">
            <button type="button" className={activeTab === "account" ? "is-active" : ""} aria-pressed={activeTab === "account"} onClick={() => setActiveTab("account")}><User size={17} /><span>Tài khoản</span></button>
            <button type="button" className={activeTab === "uploads" ? "is-active" : ""} aria-pressed={activeTab === "uploads"} onClick={() => setActiveTab("uploads")}><FileText size={17} /><span>Tài liệu của tôi</span><span className="profile-nav-count">{stats.total}</span></button>
            <button type="button" className={activeTab === "saved" ? "is-active" : ""} aria-pressed={activeTab === "saved"} onClick={() => setActiveTab("saved")}><Bookmark size={17} /><span>Đã lưu</span>{savedDocs.length > 0 && <span className="profile-nav-count">{savedDocs.length}</span>}</button>
            <button type="button" className={activeTab === "downloads" ? "is-active" : ""} aria-pressed={activeTab === "downloads"} onClick={() => setActiveTab("downloads")}><Download size={17} /><span>Đã tải về</span>{downloadHistory.length > 0 && <span className="profile-nav-count">{downloadHistory.length}</span>}</button>
            <Link to="/my-reports"><ShieldAlert size={17} /><span>Báo cáo của tôi</span></Link>
          </nav>
          <div className="profile-sidebar-actions">
            <Button type="button" onClick={handleOpenUpload} className="w-full justify-center gap-2"><UploadCloud size={16} />Đăng tài liệu mới</Button>
            {(user?.role === "admin" || user?.role === "moderator") && <Link className="profile-admin-link" to="/admin"><Shield size={16} />{user?.role === "admin" ? "Trang quản trị" : "Trang kiểm duyệt"}</Link>}
            <button type="button" className="profile-logout-link" onClick={handleLogout}><LogOut size={16} />Đăng xuất</button>
          </div>
        </aside>
        <main className="profile-content">
        <div className="profile-content-toolbar">
          <div><p className="profile-content-kicker">KHÔNG GIAN CÁ NHÂN</p><h2>{activeTab === "uploads" ? "Tài liệu của tôi" : activeTab === "saved" ? "Tài liệu đã lưu" : activeTab === "downloads" ? "Lịch sử tải xuống" : "Chi tiết tài khoản"}</h2><p>Quản lý hoạt động học tập của bạn trên StudyHub.</p></div>
          <div className="profile-toolbar-actions"><Button variant="outline" size="sm" onClick={() => { setDocumentsReloadKey((key) => key + 1); fetchProfile(); }} disabled={docsLoading} className="rounded-xl border-border gap-2"><RefreshCw size={15} className={docsLoading ? "animate-spin" : ""} />Làm mới</Button><Button size="sm" onClick={handleOpenUpload} className="rounded-xl gap-2"><UploadCloud size={15} />Đăng tài liệu</Button></div>
        </div>
      {/* Upload metrics belong to the uploads section only. */}
      {activeTab === "uploads" && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Uploads */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:border-border transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground ">Tài liệu đã đăng</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground ">
              {stats.approved} được duyệt • {stats.pending} đang chờ
            </p>
          </div>
        </div>

        {/* Stat 2: Approved Documents */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:border-primary transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground ">Đã phê duyệt</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
              {stats.approved}
            </div>
            <p className="text-[11px] text-primary/80 font-medium">
              Sẵn sàng cho cộng đồng tải
            </p>
          </div>
        </div>

        {/* Stat 3: Total Downloads */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:border-primary transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground ">Lượt tải nhận được</span>
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-primary flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-extrabold text-destructive tracking-tight">
              {stats.totalDownloads}
            </div>
            <p className="text-[11px] text-muted-foreground ">
              {stats.totalViews} lượt xem bài viết
            </p>
          </div>
        </div>

        {/* Stat 4: Moderation Ratio */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:border-warning transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground ">Chờ duyệt / Xử lý</span>
            <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-extrabold text-warning tracking-tight">
              {stats.pending}
            </div>
            <p className="text-[11px] text-muted-foreground ">
              {stats.rejected > 0 ? `${stats.rejected} bị từ chối` : "Kiểm duyệt tự động & BQT"}
            </p>
          </div>
        </div>
      </div>}

        <div className="space-y-5">
        {/* TAB 1: MY UPLOADS (REAL DATA FROM MONGODB) */}
        {activeTab === "uploads" && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 ">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, môn học..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setDocumentsPage(1); }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground "
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "approved", label: "Đã duyệt" },
                  { key: "pending", label: "Đang chờ" },
                  { key: "rejected", label: "Bị từ chối" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setStatusFilter(item.key); setDocumentsPage(1); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                      statusFilter === item.key
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "bg-muted text-foreground hover:bg-card "
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents List */}
            {docsLoading ? (
              <div className="bg-card p-12 rounded-3xl border border-border/80 text-center space-y-3">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">Đang đồng bộ tài liệu từ cơ sở dữ liệu...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              /* High-polish Empty State */
              <div className="bg-card p-12 md:p-16 rounded-3xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border text-muted-foreground flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8 stroke-1 text-muted-foreground " />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-bold text-foreground text-base">
                    {searchQuery || statusFilter !== "all"
                      ? "Không tìm thấy tài liệu phù hợp"
                      : "Bạn chưa đăng tải tài liệu nào"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {searchQuery || statusFilter !== "all"
                      ? "Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc trạng thái."
                      : "Chia sẻ đề thi, bài giảng hoặc tài liệu ôn tập của bạn để hỗ trợ cộng đồng sinh viên cùng học tốt!"}
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={handleOpenUpload}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold px-4 py-2 gap-1.5 shadow-xs active:scale-[0.98]"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Đăng tài liệu ngay
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => {
                  const isDeleting = deletingId === doc._id;
                  const isConfirming = deleteConfirmId === doc._id;

                  return (
                    <div
                      key={doc._id}
                      className="group bg-card p-4 md:p-5 rounded-2xl border border-border/80 hover:border-primary/40 hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left side: Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Meta Tags & Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-muted text-foreground text-[11px] font-semibold">
                            {doc.subjectName || "Học phần chung"}
                          </span>

                          <span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border text-[10px] font-medium uppercase tracking-wider">
                            {doc.fileType || "DOCUMENT"}
                          </span>

                          {/* Status Badges */}
                          {doc.status === "approved" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/80 ">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary " />
                              Đã kiểm duyệt
                            </span>
                          )}
                          {doc.status === "pending" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2.5 py-0.5 rounded-lg border border-warning/80 ">
                              <Clock className="w-3.5 h-3.5 text-warning " />
                              Đang chờ duyệt
                            </span>
                          )}
                          {doc.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-lg border border-destructive/80 ">
                              <AlertCircle className="w-3.5 h-3.5 text-destructive " />
                              Bị từ chối
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        {doc.status === "approved" ? (
                          <Link to={`/documents/${doc._id}`} className="block text-foreground font-bold text-sm md:text-base hover:text-primary transition-colors line-clamp-1">{doc.title}</Link>
                        ) : <h3 className="text-sm font-bold text-foreground md:text-base">{doc.title}</h3>}
                        {doc.status === "rejected" && doc.moderationNote && <p className="text-xs text-destructive ">Lý do từ chối: {doc.moderationNote}</p>}

                        {/* Description (if available) */}
                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {doc.description}
                          </p>
                        )}

                        {/* Sub details: Date, views, downloads */}
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                          <span>
                            Ngày tải:{" "}
                            {doc.createdAt
                              ? new Date(doc.createdAt).toLocaleDateString("vi-VN")
                              : "N/A"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-muted-foreground " />
                            {doc.viewCount || 0} lượt xem
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-foreground font-medium">
                            <Download className="w-3 h-3 text-muted-foreground " />
                            {doc.downloadCount || 0} lượt tải
                          </span>
                        </div>
                      </div>

                      {/* Right side: Actions */}
                      <div className="profile-document-actions">
                        <Link to={`/document/${doc._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="profile-doc-action profile-doc-action-view"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Xem tài liệu
                          </Button>
                        </Link>

                        {/* Delete confirmation flow */}
                        {isConfirming ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="profile-doc-delete-confirm"
                            >
                              {isDeleting ? "Đang xoá..." : "Xác nhận xoá"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmId(null)}
                              className="profile-doc-delete-cancel"
                            >
                              Huỷ
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(doc._id)}
                            title="Xoá tài liệu này"
                            aria-label={`Xoá ${doc.title}`}
                            className="profile-doc-action profile-doc-action-delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  page={documentsPagination.page}
                  total={documentsPagination.total}
                  pageSize={documentsPagination.limit}
                  totalPages={documentsPagination.totalPages}
                  onPageChange={setDocumentsPage}
                  disabled={docsLoading}
                  itemLabel="tài liệu"
                  label="Phân trang tài liệu của tôi"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED BOOKMARKS */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedDocs.length === 0 ? (
              <div className="bg-card p-12 md:p-16 rounded-3xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border text-muted-foreground flex items-center justify-center mx-auto">
                  <Bookmark className="w-8 h-8 stroke-1 text-muted-foreground " />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-bold text-foreground text-base">
                    Chưa có tài liệu được lưu
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Khi tìm thấy tài liệu hữu ích trên StudyHub, hãy nhấn nút "Lưu" để xem lại nhanh tại đây bất kỳ lúc nào.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold px-4 py-2 gap-1.5 shadow-xs">
                      Khám phá tài liệu ngay
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {savedDocs.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                        {doc.subject || "Tài liệu"}
                      </span>
                      <h4 className="font-bold text-foreground text-sm">{doc.title}</h4>
                      <p className="text-[11px] text-muted-foreground ">
                        Đăng bởi: {doc.uploader || "Thành viên"}
                      </p>
                    </div>

                    <Link to={`/document/${doc.id || doc._id}`}>
                      <Button
                        size="sm"
                        className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        Đọc ngay
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOWNLOAD HISTORY */}
        {activeTab === "downloads" && (
          <div className="space-y-4">
            {downloadHistory.length === 0 ? (
              <div className="bg-card p-12 md:p-16 rounded-3xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border text-muted-foreground flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8 stroke-1 text-muted-foreground " />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-bold text-foreground text-base">
                    Chưa có lịch sử tải xuống
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Mỗi khi bạn tải tài liệu học tập, lịch sử sẽ tự động được ghi nhận tại đây giúp bạn dễ dàng truy cập lại.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold px-4 py-2 gap-1.5 shadow-xs">
                      Tìm tài liệu cần học
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {downloadHistory.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-muted text-foreground text-[11px] font-semibold">
                        {doc.subject || "Tài liệu"}
                      </span>
                      <h4 className="font-bold text-foreground text-sm">{doc.title}</h4>
                      <p className="text-[11px] text-muted-foreground ">
                        Đã tải: {doc.downloadedAt || "Gần đây"}
                      </p>
                    </div>

                    <Link to={`/document/${doc.id || doc._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs rounded-xl border-border hover:bg-muted "
                      >
                        Tải lại
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACCOUNT DETAILS & PROFILE EDIT */}
        {activeTab === "account" && (
          <div className="profile-account-page space-y-5">
            <section className="profile-account-overview paper-panel" aria-label="Hồ sơ cá nhân">
              <div className="profile-account-avatar-wrap">
                <div className="profile-account-avatar">
                  {avatarUploading ? <Loader2 className="animate-spin" /> : user?.avatarUrl ? <img src={user.avatarUrl} alt={user?.name || "Ảnh đại diện"} referrerPolicy="no-referrer" /> : user?.name?.charAt(0) || "U"}
                </div>
                <button type="button" className="profile-avatar-edit" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} aria-label="Đổi ảnh đại diện"><Camera size={15} /></button>
              </div>
              <div className="profile-account-summary">
                <div className="profile-account-name-row"><h3>{user?.name || "Người dùng StudyHub"}</h3><Badge variant="outline" className="profile-role-badge">{user?.role === "admin" ? "Quản trị viên" : user?.role === "moderator" ? "Kiểm duyệt viên" : "Sinh viên"}</Badge></div>
                <p className="profile-account-email">{user?.email}</p>
                <div className="profile-account-counts" aria-label="Thống kê hồ sơ">
                  <div><strong>{stats.total}</strong><span>Tài liệu đã đăng</span></div>
                  <div><strong>{followSummary.followers}</strong><span>Người theo dõi</span></div>
                  <div><strong>{followSummary.following}</strong><span>Đang theo dõi</span></div>
                  <Button type="button" variant="outline" size="sm" disabled={avatarUploading} onClick={() => avatarInputRef.current?.click()} className="profile-account-avatar-action"><Camera size={14} />{avatarUploading ? "Đang cập nhật ảnh..." : "Đổi ảnh đại diện"}</Button>
                </div>
              </div>
            </section>
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-border/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground ">Chi tiết tài khoản</h3>
              <p className="text-xs text-muted-foreground ">
                Quản lý và cập nhật thông tin cá nhân của bạn trên StudyHub.
              </p>
            </div>

            {/* Profile fields: Editable Name, Email, Role, Joined Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Name Editor */}
              <div className="p-4 rounded-2xl bg-muted border border-border/60 space-y-2">
                <label className="text-muted-foreground font-medium block">Họ và tên hiển thị:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-semibold shadow-xs"
                    placeholder="Nhập tên mới..."
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={nameSaving || !newName.trim() || newName === user?.name}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 h-9 shrink-0"
                  >
                    {nameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu tên"}
                  </Button>
                </div>
              </div>

              {/* Email Address */}
              <div className="p-4 rounded-2xl bg-muted border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium">Địa chỉ Email:</span>
                <p className="font-semibold text-foreground text-sm">{user?.email}</p>
                <p className="text-[11px] text-muted-foreground ">Email dùng để định danh và liên hệ</p>
              </div>

              {/* System Role */}
              <div className="p-4 rounded-2xl bg-muted border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium">Vai trò hệ thống:</span>
                <p className="font-semibold text-foreground capitalize text-sm">
                  {user?.role === "admin" ? "Quản trị viên (Admin)" : "Sinh viên (Student)"}
                </p>
                <p className="text-[11px] text-muted-foreground ">Quyền hạn truy cập trên nền tảng</p>
              </div>

              {/* Joined Date */}
              <div className="p-4 rounded-2xl bg-muted border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium">Ngày tham gia:</span>
                <p className="font-semibold text-foreground text-sm">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Mới tham gia"}
                </p>
                <p className="text-[11px] text-muted-foreground ">Thời gian khởi tạo tài khoản</p>
              </div>
            </div>

            {/* Help footer - removed logout button as requested */}
            <div className="pt-4 border-t border-border ">
              <span className="text-xs text-muted-foreground ">
                Cần hỗ trợ về tài khoản? Liên hệ quản trị viên StudyHub.
              </span>
            </div>
          </div>
          </div>
        )}
        </div>
      </main>
      </div>
    </div>
  );
}
