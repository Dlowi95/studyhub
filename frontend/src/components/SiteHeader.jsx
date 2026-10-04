import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, CheckCheck, LogOut, Menu, X, UploadCloud, ShieldCheck, ArrowUpRight } from "lucide-react";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader({ user, token, onOpenAuth, onUpload, onLogout, notifications, unreadCount, onFetchNotifications, onReadAll, onNotificationClick, uploadsEnabled = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const location = useLocation();
  const authenticated = Boolean(token && user);
  const manages = authenticated && ["admin", "moderator"].includes(user.role);
  const links = [
    { label: "Trang chủ", to: "/" }, { label: "Học phần", to: "/subjects" },
    { label: "Thư viện", to: "/#featured" },
    ...(authenticated ? [{ label: "Báo cáo của tôi", to: "/my-reports" }] : []),
  ];
  const active = (to) => `${location.pathname}${location.hash}` === to;

  useEffect(() => {
    const timer = window.setTimeout(() => { setMenuOpen(false); setNotificationsOpen(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!location.hash) { window.scrollTo({ top: 0 }); return; }
    const id = location.hash.slice(1);
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return true;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!notificationsOpen && !menuOpen) return;
    const dismiss = (event) => {
      if (event.type === "keydown" && event.key === "Escape") { setNotificationsOpen(false); setMenuOpen(false); }
      if (event.type === "pointerdown" && !notificationRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismiss); };
  }, [notificationsOpen, menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-logo" to="/" aria-label="StudyHub — Trang chủ"><BrandMark /></Link>
        <nav className="site-nav" aria-label="Điều hướng chính">
          {links.map((link) => <Link key={link.to} to={link.to} className={active(link.to) ? "is-active" : ""} aria-current={active(link.to) ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className="site-actions">
          <button type="button" className="paper-button paper-button-primary header-upload" disabled={authenticated && !uploadsEnabled} title={authenticated && !uploadsEnabled ? "Đang tạm ngưng nhận tài liệu mới" : undefined} onClick={authenticated ? onUpload : () => onOpenAuth("login")}>
            {authenticated ? <><UploadCloud size={16} /><span>{uploadsEnabled ? "Đăng tài liệu" : "Tạm ngưng đăng"}</span></> : <>Bắt đầu ngay <ArrowUpRight size={16} /></>}
          </button>
          <ThemeToggle />
          {authenticated && (
            <>
              <div className="notification-anchor" ref={notificationRef}>
                <button type="button" className="icon-button notification-trigger" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={() => { setNotificationsOpen(!notificationsOpen); if (!notificationsOpen) void onFetchNotifications(); }}>
                  <Bell size={19} />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <section className="notification-panel" id="notification-panel" aria-label="Thông báo">
                    <div className="notification-panel-heading"><h2>Thông báo{unreadCount > 0 && <span>{unreadCount} mới</span>}</h2>{unreadCount > 0 && <button type="button" onClick={onReadAll}><CheckCheck size={15} /> Đọc tất cả</button>}</div>
                    <div className="notification-list">
                      {notifications.length === 0 ? <p className="notification-empty">Chưa có thông báo mới.<br />Kết quả kiểm duyệt sẽ được cập nhật tại đây.</p> : notifications.map((notification) => (
                        <Link key={notification._id} to={notification.link || "/my-reports"} className={`notification-item ${notification.read ? "" : "is-unread"}`} onClick={() => { setNotificationsOpen(false); void onNotificationClick(notification); }}>
                          <span className="notification-dot" /><div><strong>{notification.title}</strong><p>{notification.message}</p><time>{new Date(notification.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></div>
                        </Link>
                      ))}
                    </div>
                    <Link to={manages ? "/admin" : "/my-reports"} className="notification-footer" onClick={() => setNotificationsOpen(false)}>{manages ? "Mở trang quản trị" : "Xem báo cáo của tôi"}<ArrowUpRight size={15} /></Link>
                  </section>
                )}
              </div>
              {manages && <Link className="header-admin" to="/admin" aria-label="Mở trang quản trị"><ShieldCheck size={17} /><span>Quản trị</span></Link>}
              <Link className="header-avatar" to="/profile" aria-label="Hồ sơ của tôi">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : user.name?.[0]?.toUpperCase() || "S"}</Link>
              <button type="button" className="icon-button header-logout" onClick={onLogout} aria-label="Đăng xuất"><LogOut size={18} /></button>
            </>
          )}
          <button type="button" className="icon-button header-menu-toggle" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} aria-controls="site-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {menuOpen && (
        <nav className="site-mobile-nav" id="site-mobile-nav" aria-label="Điều hướng trên điện thoại">
          {links.map((link) => <Link key={link.to} to={link.to} className={active(link.to) ? "is-active" : ""} onClick={() => setMenuOpen(false)}>{link.label}<ArrowUpRight size={16} /></Link>)}
          {manages && <Link to="/admin">Trang quản trị<ShieldCheck size={16} /></Link>}
          {authenticated && <Link to="/profile">Hồ sơ của tôi<ArrowUpRight size={16} /></Link>}
          <button type="button" disabled={authenticated && !uploadsEnabled} onClick={() => { setMenuOpen(false); authenticated ? onUpload() : onOpenAuth("login"); }}>{authenticated ? uploadsEnabled ? "Đăng tài liệu mới" : "Tạm ngưng đăng tải" : "Đăng nhập / Đăng ký"}<UploadCloud size={16} /></button>
          {authenticated && <button type="button" onClick={onLogout}>Đăng xuất<LogOut size={16} /></button>}
        </nav>
      )}
    </header>
  );
}
