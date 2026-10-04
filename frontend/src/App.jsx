import { API_URL } from "@/lib/api";
import { clearAccountSession } from "@/lib/session";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import { Toaster } from "@/components/ui/toaster";
import { BookOpen, Clock3, RefreshCw, Wrench } from "lucide-react";
import { ThemeProvider } from "./context/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import "./App.css";

// Route-based code splitting for maximum performance and faster initial load
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UploadDocument = lazy(() => import("./pages/UploadDocument"));
const DocumentDetailPage = lazy(() => import("./pages/DocumentDetailPage"));
const SubjectDetailPage = lazy(() => import("./pages/SubjectDetailPage"));
const MyReports = lazy(() => import("./pages/MyReports"));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground ">
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

function MaintenanceScreen({ message, expectedEndAt, onLogin }) {
  const expectedDate = expectedEndAt ? new Date(expectedEndAt) : null;
  const hasExpectedDate = expectedDate && !Number.isNaN(expectedDate.getTime());

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-2xl rounded-[2rem] border border-primary/25 bg-card p-7 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <BookOpen size={31} />
        </div>
        <p className="mt-7 text-[11px] font-bold tracking-[0.22em] text-primary">STUDYHUB · THÔNG BÁO</p>
        <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Wrench size={23} />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">StudyHub đang bảo trì</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{message}</p>
        {hasExpectedDate && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground"><Clock3 size={15} /> Dự kiến mở lại {expectedDate.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
            <RefreshCw size={16} /> Kiểm tra lại
          </button>
          <button type="button" onClick={onLogin} className="h-11 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted">
            Đăng nhập quản trị
          </button>
        </div>
      </section>
    </main>
  );
}

function UploadPausedPage({ message }) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-warning/25 bg-card p-7 text-center shadow-sm sm:p-10">
        <CloudUploadFallback />
        <h1 className="mt-4 text-2xl font-extrabold text-foreground">Tạm ngưng nhận tài liệu</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{message}</p>
      </div>
    </section>
  );
}

function CloudUploadFallback() {
  return <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning"><Wrench size={25} /></div>;
}

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);


  // Notification State (Yêu cầu 4)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const uploadsEnabled = systemStatus?.uploadsEnabled !== false;

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    const refreshSystemStatus = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(`${API_URL}/system/status`, { cache: "no-store" });
        if (response.ok) {
          const status = await response.json();
          if (active) setSystemStatus(status);
        }
      } catch {
        // A temporary status check failure should not block browsing when the API recovers.
      } finally {
        requestInFlight = false;
      }
    };
    void refreshSystemStatus();
    const timer = window.setInterval(refreshSystemStatus, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const fetchNotifications = useCallback(async (authToken) => {
    const currentToken = authToken || localStorage.getItem("token");
    if (!currentToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/notifications`, {
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
      await fetch(`${API_URL}/notifications/read-all`, {
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
        await fetch(`${API_URL}/notifications/${notif._id}/read`, {
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
        const response = await fetch(`${API_URL}/auth/profile`, {
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
    setAuthReady(true);
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
      if (uploadsEnabled) setUploadModalOpen(true);
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
  }, [handleStorageChange, uploadsEnabled]);

  useEffect(() => {
    if (!token) return undefined;

    const refreshNotifications = () => {
      void fetchNotifications(token);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };

    const initialTimer = window.setTimeout(refreshNotifications, 0);
    const pollTimer = window.setInterval(refreshNotifications, 30000);
    window.addEventListener("focus", refreshNotifications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", refreshNotifications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications, token]);

  const openAuth = (tab = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleUploadClick = () => {
    if (!uploadsEnabled) return;
    if (!token || !user) {
      openAuth("login");
    } else {
      setUploadModalOpen(true);
    }
  };

  const handleLogout = () => {
    clearAccountSession();
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/";
  };

  // If on /admin route, render dedicated Admin layout without consumer header/footer
  if (isAdminRoute) {
    return (
      <>
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
        <Toaster />
      </>
    );
  }

  if (authReady && systemStatus?.maintenanceEnabled && !["admin", "moderator"].includes(user?.role)) {
    return (
      <>
        <MaintenanceScreen
          message={systemStatus.maintenanceMessage}
          expectedEndAt={systemStatus.maintenanceExpectedEndAt}
          onLogin={() => openAuth("login")}
        />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialTab={authModalTab} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="studyhub-app">
      <a href="#main-content" className="skip-link">Bỏ qua menu, đến nội dung</a>
      <SiteHeader user={user} token={token} onOpenAuth={openAuth} onUpload={handleUploadClick} onLogout={handleLogout} uploadsEnabled={uploadsEnabled}
        notifications={notifications} unreadCount={unreadCount} onFetchNotifications={() => fetchNotifications(token)} onReadAll={handleMarkAllAsRead} onNotificationClick={handleNotificationClick} />
      {!uploadsEnabled && <div role="status" className="mx-auto mt-3 w-[min(94%,1200px)] rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-xs font-medium leading-relaxed text-warning">{systemStatus?.uploadsMessage || "Đang tạm ngưng nhận tài liệu mới. Bạn vẫn có thể xem và tải tài liệu hiện có."}</div>}
      <main id="main-content" className="site-content" tabIndex={-1}>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home onOpenAuth={openAuth} user={user} uploadsEnabled={uploadsEnabled} />} />
            <Route path="/subjects" element={<SubjectDetailPage onOpenAuth={openAuth} user={user} />} />
            <Route path="/subjects/:subjectName" element={<SubjectDetailPage onOpenAuth={openAuth} user={user} />} />
            <Route path="/login" element={<AuthRedirect tab="login" onOpenAuth={openAuth} />} />
            <Route path="/register" element={<AuthRedirect tab="register" onOpenAuth={openAuth} />} />
            <Route path="/document/:id" element={<DocumentDetailPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/documents/upload" element={uploadsEnabled ? <ProtectedRoute><UploadDocument /></ProtectedRoute> : <UploadPausedPage message={systemStatus?.uploadsMessage || "Đang tạm ngưng nhận tài liệu mới."} />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter user={user} onUpload={handleUploadClick} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialTab={authModalTab} />
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return <ThemeProvider><BrowserRouter><MainLayout /></BrowserRouter></ThemeProvider>;
}
