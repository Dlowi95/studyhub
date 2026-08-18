import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AuthModal({ isOpen, onClose, initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sync tab when initialTab or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError("");
      setSuccess("");
      setShowPassword(false);
    }
  }, [isOpen, initialTab]);

  const switchTab = (newTab) => {
    setTab(newTab);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    try {
      if (tab === "login") {
        const res = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Đăng nhập thất bại");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChange"));

        setSuccess("Đăng nhập thành công");
        setTimeout(() => {
          onClose();
          if (data.user?.role === "admin") {
            window.location.href = "/admin";
          }
        }, 600);
      } else {
        const res = await fetch(`${apiUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Đăng ký thất bại");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChange"));

        setSuccess("Đăng ký tài khoản thành công");
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder / trigger for Google OAuth
    alert("Tính năng Đăng nhập Google đang được kết nối với Google Client ID");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-slate-200 shadow-xl rounded-2xl">
        {/* Modal Top Header */}
        <div className="bg-slate-50 p-6 pb-4 border-b border-slate-200/80">
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/70 p-1 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tab === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchTab("register")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tab === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {tab === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {tab === "login"
                ? "Nhập email và mật khẩu của bạn để truy cập tài khoản."
                : "Điền thông tin bên dưới để tạo tài khoản StudyHub mới."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-5 space-y-4">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-11 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 font-medium text-slate-700 shadow-sm rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 absolute">
              hoặc email
            </span>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === "register" && (
              <div className="space-y-1.5 text-left">
                <Label htmlFor="auth-name" className="text-xs font-semibold text-slate-700">
                  Họ và tên
                </Label>
                <Input
                  id="auth-name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 text-sm rounded-xl border-slate-200"
                />
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label htmlFor="auth-email" className="text-xs font-semibold text-slate-700">
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="ten@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-sm rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password" className="text-xs font-semibold text-slate-700">
                  Mật khẩu
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-sm rounded-xl border-slate-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 font-semibold text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                </span>
              ) : tab === "login" ? (
                "Đăng nhập"
              ) : (
                "Tạo tài khoản"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <div className="text-center pt-2 text-xs text-slate-500">
            {tab === "login" ? (
              <p>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="text-primary font-semibold hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
