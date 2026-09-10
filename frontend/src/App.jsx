import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import UploadDocument from "./pages/UploadDocument";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { UploadCloud, ShieldCheck, LogOut } from "lucide-react";
import "./App.css";

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleStorageChange = async () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    setToken(storedToken);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    if (storedToken) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch {
        // Keep the cached user when the profile request is unavailable.
      }
    }
  };

  useEffect(() => {
    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);

    const handleOpenAuthModal = (e) => {
      const { tab = "login" } = e.detail || {};
      setAuthModalTab(tab);
      setAuthModalOpen(true);
    };

    const handleOpenUploadModal = () => {
      setUploadModalOpen(true);
    };

    window.addEventListener("openAuthModal", handleOpenAuthModal);
    window.addEventListener("openUploadModal", handleOpenUploadModal);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
      window.removeEventListener("openUploadModal", handleOpenUploadModal);
    };
  }, []);

  const openAuth = (tab = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleUploadClick = () => {
    if (!token || !user) {
      openAuth("login");
    } else {
      setUploadModalOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/";
  };

  // If on /admin route, render dedicated Admin layout without consumer header/footer
  if (isAdminRoute) {
    return (
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Consumer Portal Layout
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 py-3.5 px-6 sticky top-0 z-40 shadow-xs backdrop-blur-md transition-colors">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:opacity-90 transition-opacity">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Study<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-primary dark:hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <a href="/#subjects" className="hover:text-primary dark:hover:text-primary transition-colors">
              Học phần
            </a>
            <a href="/#featured" className="hover:text-primary dark:hover:text-primary transition-colors">
              Tài liệu nổi bật
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs md:text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Đăng tài liệu</span>
            </button>

            {/* Dark Mode Theme Toggle */}
            <ThemeToggle />

            {/* Logged in */}
            {token && user ? (
              <div className="flex items-center gap-3 pl-1 border-l border-slate-200 dark:border-slate-800">
                {/* Admin Link */}
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Profile Link - Avatar only */}
                <Link
                  to="/profile"
                  title={user.name || "Hồ sơ cá nhân"}
                  className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
                >
                  {user.avatarUrl ? (
                    <>
                      <img
                        src={user.avatarUrl}
                        alt={user.name || "Avatar"}
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <div className="hidden w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 items-center justify-center text-xs font-bold uppercase shadow-xs">
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                    </>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                      {user.name ? user.name.charAt(0) : "U"}
                    </div>
                  )}
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Not logged in */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Tham gia
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 flex-grow px-4">
        <Routes>
          <Route path="/" element={<Home onOpenAuth={openAuth} user={user} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/document/:id" element={<DocumentDetailPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route
            path="/documents/upload"
            element={
              <ProtectedRoute>
                <UploadDocument />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Rich Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md pt-12 pb-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
                  S
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  Study<span className="text-primary">Hub</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nền tảng chia sẻ và kiểm duyệt đề thi, bài tập lớn, giáo trình chất lượng cao dành cho cộng đồng sinh viên đại học Việt Nam.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Hệ thống kiểm duyệt hoạt động 24/7</span>
              </div>
            </div>

            {/* Col 2: Học phần phổ biến */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-3">Học phần nổi bật</h3>
              <ul className="space-y-2">
                {["Cấu trúc dữ liệu", "Giải tích 1 & 2", "Kinh tế vi mô", "Triết học Mác - Lênin", "Xác suất thống kê", "Cơ sở dữ liệu"].map((item) => (
                  <li key={item}>
                    <Link to={`/?search=${encodeURIComponent(item)}`} className="hover:text-primary transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Khám phá */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-3">Khám phá nhanh</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">Trang chủ tài liệu</Link>
                </li>
                <li>
                  <button onClick={() => setUploadModalOpen(true)} className="hover:text-primary transition-colors text-left cursor-pointer">
                    Đóng góp tài liệu mới
                  </button>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-primary transition-colors">Quản lý tài liệu đã tải</Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-primary transition-colors">Câu hỏi thường gặp (FAQ)</a>
                </li>
              </ul>
            </div>

            {/* Col 4: Cam kết & Hỗ trợ */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-3">Chính sách & Hỗ trợ</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-slate-600 dark:text-slate-400">Chính sách bản quyền & Tác quyền</span>
                </li>
                <li>
                  <span className="text-slate-600 dark:text-slate-400">Tiêu chuẩn kiểm duyệt nội dung</span>
                </li>
                <li>
                  <span className="text-slate-600 dark:text-slate-400">Quy chế hoạt động cộng đồng</span>
                </li>
                <li className="pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Cần trợ giúp khẩn cấp?</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Email: support@studyhub.edu.vn</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 dark:text-slate-500">
            <p>© 2026 StudyHub. Xây dựng vì mục đích học thuật và kết nối sinh viên.</p>
            <p className="text-[11px]">Thiết kế chuẩn UI/UX Pro Max • Tương thích mọi thiết bị</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      {/* Global Notifications Toast */}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}