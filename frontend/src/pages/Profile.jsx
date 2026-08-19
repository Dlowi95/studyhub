import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Shield,
  Calendar,
  UploadCloud,
  Bookmark,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("uploads"); // "uploads" | "saved" | "downloads"
  const navigate = useNavigate();

  // Mock my uploads with moderation statuses (Approved, Pending, Rejected)
  const [myUploads, setMyUploads] = useState([
    {
      id: "doc-1",
      title: "Đề cương ôn tập Triết học Mác-Lênin (12 chương có lời giải)",
      subject: "Triết học Mác-Lênin",
      status: "approved", // approved | pending | rejected
      downloads: 1420,
      rating: 4.8,
      size: "2.4 MB",
      date: "12/02/2026",
    },
    {
      id: "my-doc-2",
      title: "Đề thi giữa kỳ môn Kinh tế vi mô có đáp án - ĐH Kinh tế Quốc Dân",
      subject: "Kinh tế vi mô",
      status: "pending",
      downloads: 0,
      rating: 0,
      size: "3.4 MB",
      date: "18/02/2026",
    },
    {
      id: "my-doc-3",
      title: "Tóm tắt bài giảng Giải tích 2 phần Tích phân mặt",
      subject: "Giải tích 2",
      status: "rejected",
      rejectReason: "Hình ảnh bị mờ, khó đọc",
      downloads: 0,
      rating: 0,
      size: "1.2 MB",
      date: "10/02/2026",
    },
  ]);

  // Mock saved/bookmarked documents
  const [savedDocs, setSavedDocs] = useState([
    {
      id: "doc-2",
      title: "Giáo trình và bài tập Cấu trúc dữ liệu và Giải thuật",
      subject: "Cấu trúc dữ liệu",
      uploader: "Lâm Nguyễn",
      rating: 5.0,
      size: "5.1 MB",
    },
    {
      id: "doc-3",
      title: "Đề thi cuối kỳ Giải tích 1 có đáp án chi tiết kỳ 2024.2",
      subject: "Giải tích",
      uploader: "Ban Học Tập",
      rating: 4.6,
      size: "1.8 MB",
    },
  ]);

  // Mock download history
  const [downloadHistory, setDownloadHistory] = useState([
    {
      id: "doc-1",
      title: "Đề cương ôn tập Triết học Mác-Lênin (12 chương có lời giải)",
      subject: "Triết học Mác-Lênin",
      downloadedAt: "18/02/2026",
      size: "2.4 MB",
    },
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hồ sơ");
        }

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        // Fallback to local storage if API is offline
        const localUser = localStorage.getItem("user");
        if (localUser) {
          try {
            setUser(JSON.parse(localUser));
          } catch (e) {
            navigate("/login");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50svh]">
        <div className="text-slate-500 text-xs font-medium">Đang tải thông tin hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6 text-left">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Hồ sơ cá nhân
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Quản lý tài khoản, tài liệu đã đăng tải và lịch sử học tập của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Link to="/admin">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
                Trang Quản trị Admin
              </Button>
            </Link>
          )}
          <Button onClick={handleLogout} variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold hover:text-destructive">
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Grid: User Info (Left) & Content Tabs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: User Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-bold uppercase shadow-inner">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs capitalize">
                Vai trò: {user?.role || "student"}
              </Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs capitalize">
                {user?.status === "active" ? "Đang hoạt động" : "Bị khóa"}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Tài liệu đã chia sẻ:</span>
              <span className="font-bold text-slate-800">{myUploads.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tài liệu đã lưu:</span>
              <span className="font-bold text-slate-800">{savedDocs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ngày tham gia:</span>
              <span className="font-semibold text-slate-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Activity Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("uploads")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "uploads"
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Tài liệu đã đăng ({myUploads.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "saved"
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Đã lưu ({savedDocs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("downloads")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "downloads"
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Đã tải về ({downloadHistory.length})</span>
            </button>
          </div>

          {/* TAB 1: MY UPLOADS */}
          {activeTab === "uploads" && (
            <div className="space-y-3">
              {myUploads.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium text-xs">Bạn chưa đăng tải tài liệu nào.</p>
                </div>
              ) : (
                myUploads.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {doc.subject}
                        </span>

                        {/* Moderation Status Badges */}
                        {doc.status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã duyệt
                          </span>
                        )}
                        {doc.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Đang chờ duyệt
                          </span>
                        )}
                        {doc.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200" title={doc.rejectReason}>
                            <XCircle className="w-3 h-3" />
                            Bị từ chối: {doc.rejectReason}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Ngày gửi: {doc.date} • Dung lượng: {doc.size}
                        {doc.status === "approved" && ` • ${doc.downloads} lượt tải`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link to={`/document/${doc.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-slate-200">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Xem
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: SAVED DOCUMENTS */}
          {activeTab === "saved" && (
            <div className="space-y-3">
              {savedDocs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium text-xs">Bạn chưa lưu tài liệu nào.</p>
                </div>
              ) : (
                savedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                        {doc.subject}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400">Đăng bởi: {doc.uploader} • {doc.size}</p>
                    </div>

                    <Link to={`/document/${doc.id}`}>
                      <Button size="sm" className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold">
                        Đọc ngay
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: DOWNLOAD HISTORY */}
          {activeTab === "downloads" && (
            <div className="space-y-3">
              {downloadHistory.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Download className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium text-xs">Chưa có lịch sử tải về.</p>
                </div>
              ) : (
                downloadHistory.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {doc.subject}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400">Đã tải vào ngày: {doc.downloadedAt} • {doc.size}</p>
                    </div>

                    <Link to={`/document/${doc.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-slate-200">
                        Xem lại
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
