import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import {
  UploadCloud,
  ShieldCheck,
  LogOut,
  Bell,
  ShieldAlert,
  CheckCheck,
  Menu,
  X,
  Home as HomeIcon,
  BookOpen,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import "./App.css";

// Route-based code splitting for maximum performance and faster initial load
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UploadDocument = lazy(() => import("./pages/UploadDocument"));
const DocumentDetailPage = lazy(() => import("./pages/DocumentDetailPage"));
const MyReports = lazy(() => import("./pages/MyReports"));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500 dark:text-slate-400">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs font-medium">Đang tải trang...</span>
    </div>
  );
}

function AuthRedirect({ tab = "login", onOpenAuth }) {
  useEffect(() => {
    if (onOpenAuth) {
      onOpenAuth(tab);
    } else {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab } }));
    }
  }, [tab, onOpenAuth]);

  return <Navigate to="/" replace />;
}

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    queueMicrotask(() => setMobileMenuOpen(false));
  }, [location.pathname]);

  // Notification State (Yêu cầu 4)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = useCallback(async (authToken) => {
    const currentToken = authToken || localStorage.getItem("token");
    if (!currentToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      }
    } catch {
      // non-blocking
    }
  }, []);

  const handleMarkAllAsRead = async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // non-blocking
    }
  };

  const handleNotificationClick = async (notif) => {
    const currentToken = token || localStorage.getItem("token");
    if (!notif.read && currentToken) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications/${notif._id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // non-blocking
      }
    }
    setNotifOpen(false);
  };

  const handleStorageChange = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    setToken(storedToken);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
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
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } catch {
        // Keep the cached user when the profile request is unavailable.
      }
      fetchNotifications(storedToken);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    const initialSyncTimer = window.setTimeout(() => {
      void handleStorageChange();
    }, 0);

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
      window.clearTimeout(initialSyncTimer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
      window.removeEventListener("openUploadModal", handleOpenUploadModal);
    };
  }, [handleStorageChange]);

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
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Consumer Portal Layout
  return (
    <div className="studyhub-page flex min-h-screen min-w-0 flex-col overflow-x-clip bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 px-4 py-3 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="StudyHub - Trang chủ">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[0.9rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-black text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.9)] transition-transform group-hover:-rotate-2 group-hover:scale-105">
              <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/20" />
              S
            </div>
            <span className="hidden text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white sm:block">
              Study<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/70 p-1 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 lg:flex">
            <Link to="/" className="rounded-full bg-white px-3.5 py-2 text-slate-950 shadow-sm transition-colors dark:bg-slate-800 dark:text-white">
              Trang chủ
            </Link>
            <a href="/#subjects" className="rounded-full px-3.5 py-2 transition hover:bg-white hover:text-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-300">
              Học phần
            </a>
            <a href="/#featured" className="rounded-full px-3.5 py-2 transition hover:bg-white hover:text-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-300">
              Thư viện
            </a>
            {token && user && (
              <Link
                to="/my-reports"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 transition hover:bg-white hover:text-amber-700 dark:hover:bg-slate-800 dark:hover:text-amber-300"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Báo cáo của tôi</span>
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            {/* Upload Button */}
            <button
              type="button"
              onClick={handleUploadClick}
              aria-label="Đăng tài liệu"
              className="hidden h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white shadow-[0_10px_24px_-14px_rgba(5,150,105,0.9)] transition hover:bg-emerald-500 active:scale-95 sm:flex sm:px-4"
              title="Đăng tài liệu"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng tài liệu</span>
            </button>

            {/* Dark Mode Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
              title="Menu"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logged in */}
            {token && user ? (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 dark:border-slate-800 sm:gap-2">
                {/* Notification Bell (Yêu cầu 4) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (!notifOpen) fetchNotifications();
                    }}
                    className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Thông báo"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden text-left">
                      <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">Thông báo</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {unreadCount} mới
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Đọc tất cả</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                            Bạn chưa có thông báo nào
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n._id}
                              to={n.link || "/my-reports"}
                              onClick={() => handleNotificationClick(n)}
                              className={`block p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                !n.read ? "bg-primary/5 dark:bg-primary/10" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    !n.read ? "bg-primary" : "bg-transparent"
                                  }`}
                                />
                                <div className="space-y-1 min-w-0">
                                  <p
                                    className={`text-xs ${
                                      !n.read
                                        ? "text-slate-900 dark:text-white font-bold"
                                        : "text-slate-700 dark:text-slate-300 font-medium"
                                    }`}
                                  >
                                    {n.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {n.message}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.createdAt).toLocaleDateString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          to="/my-reports"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-primary hover:underline inline-block"
                        >
                          Xem tất cả báo cáo của bạn →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin/Moderator Link */}
                {(user.role === "admin" || user.role === "moderator") && (
                  <Link
                    to="/admin"
                    className="hidden items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400 xl:flex"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.role === "admin" ? "Admin" : "Moderator"}</span>
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
                  className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-destructive/10 hover:text-destructive sm:block"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Not logged in */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  aria-label="Đăng nhập hoặc tạo tài khoản"
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal-500 active:scale-95 sm:px-4 md:text-sm"
                >
                  <UserRoundPlus className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Tham gia</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[82vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  S
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Study<span className="text-primary">Hub</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <HomeIcon className="w-4 h-4 text-primary" />
                <span>Trang chủ</span>
              </Link>

              <a
                href="/#subjects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Học phần</span>
              </a>

              <a
                href="/#featured"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tài liệu nổi bật</span>
              </a>

              {token && user && (
                <Link
                  to="/my-reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Báo cáo của tôi</span>
                </Link>
              )}

              <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleUploadClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Đăng tài liệu mới</span>
                </button>
              </div>

              {token && user && (user.role === "admin" || user.role === "moderator") && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{user.role === "admin" ? "Trang Quản trị Admin" : "Trang Kiểm duyệt Moderator"}</span>
                </Link>
              )}
            </div>

            {/* Drawer Footer: User Profile or Login */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {token && user ? (
                <div className="space-y-3">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {user.name ? user.name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {user.name || "Tài khoản"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth("login");
                  }}
                  className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Đăng nhập / Tham gia
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto w-full min-w-0 flex-grow overflow-x-clip px-4 py-6 sm:px-6 md:py-8">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home onOpenAuth={openAuth} user={user} />} />
            <Route path="/login" element={<AuthRedirect tab="login" onOpenAuth={openAuth} />} />
            <Route path="/register" element={<AuthRedirect tab="register" onOpenAuth={openAuth} />} />
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
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute>
                  <MyReports />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/5 bg-[#071316] pb-8 pt-12 text-xs text-slate-400">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Col 1: Brand info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-base font-black text-white shadow-lg shadow-emerald-950/40">
                  S
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  Study<span className="text-emerald-400">Hub</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Nền tảng chia sẻ và kiểm duyệt đề thi, bài tập lớn, giáo trình chất lượng cao dành cho cộng đồng sinh viên đại học Việt Nam.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Tài liệu công khai đều qua kiểm duyệt</span>
              </div>
            </div>

            {/* Col 2: Học phần phổ biến */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-white">Học phần nổi bật</h3>
              <ul className="space-y-2">
                {["Cấu trúc dữ liệu", "Giải tích 1 & 2", "Kinh tế vi mô", "Triết học Mác - Lênin", "Xác suất thống kê", "Cơ sở dữ liệu"].map((item) => (
                  <li key={item}>
                    <a href={`/?search=${encodeURIComponent(item)}#featured`} className="transition-colors hover:text-emerald-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Khám phá */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-white">Khám phá nhanh</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="transition-colors hover:text-emerald-300">Trang chủ tài liệu</Link>
                </li>
                <li>
                  <button onClick={handleUploadClick} className="cursor-pointer text-left transition-colors hover:text-emerald-300">
                    Đóng góp tài liệu mới
                  </button>
                </li>
                <li>
                  <Link to="/profile" className="transition-colors hover:text-emerald-300">Quản lý tài liệu đã tải</Link>
                </li>
                <li>
                  <a href="/#faq" className="transition-colors hover:text-emerald-300">Câu hỏi thường gặp</a>
                </li>
              </ul>
            </div>

            {/* Col 4: Cam kết & Hỗ trợ */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-white">Chính sách & Hỗ trợ</h3>
              <ul className="space-y-2">
                <li>
                  <span>Chính sách bản quyền & Tác quyền</span>
                </li>
                <li>
                  <span>Tiêu chuẩn kiểm duyệt nội dung</span>
                </li>
                <li>
                  <span>Quy chế hoạt động cộng đồng</span>
                </li>
                <li className="pt-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11px]">
                    <p className="font-semibold text-slate-200">Cần hỗ trợ?</p>
                    <p className="mt-0.5 text-slate-400">support@studyhub.edu.vn</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-slate-500 sm:flex-row">
            <p>© 2026 StudyHub. Xây dựng vì mục đích học thuật và kết nối sinh viên.</p>
            <p className="inline-flex items-center gap-1.5 text-[11px]"><ShieldCheck className="h-3.5 w-3.5" /> Học liệu mở · Chia sẻ có trách nhiệm</p>
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
