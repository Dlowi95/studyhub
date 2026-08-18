import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AuthModal from './components/AuthModal'
import UploadModal from './components/UploadModal'
import { UploadCloud, ShieldCheck, User as UserIcon, LogOut } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState("login")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Listen for changes in login state
  const handleStorageChange = () => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    setToken(storedToken)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    // Run once on load
    handleStorageChange()

    // Listen to storage events (tab sync)
    window.addEventListener("storage", handleStorageChange)
    // Listen to custom event (same window change)
    window.addEventListener("authChange", handleStorageChange)

    // Global listener to trigger AuthModal from any page/button
    const handleOpenAuthModal = (e) => {
      const { tab = "login" } = e.detail || {}
      setAuthModalTab(tab)
      setAuthModalOpen(true)
    }
    window.addEventListener("openAuthModal", handleOpenAuthModal)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("authChange", handleStorageChange)
      window.removeEventListener("openAuthModal", handleOpenAuthModal)
    }
  }, [])

  const openAuth = (tab = "login") => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const handleUploadClick = () => {
    if (!token || !user) {
      openAuth("login")
    } else {
      setUploadModalOpen(true)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    // Notify storage state change to sync navbar
    window.dispatchEvent(new Event("authChange"))
    window.location.href = "/"
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
        {/* Navigation Bar */}
        <header className="border-b bg-white/95 py-3.5 px-6 sticky top-0 z-40 shadow-xs backdrop-blur-md">
          <div className="container mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
<div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:opacity-90 transition-opacity">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Study<span className="text-primary">Hub</span>
              </span>
            </Link>
            
            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <a href="#subjects" className="hover:text-primary transition-colors">
                Học phần
              </a>
              <a href="#featured" className="hover:text-primary transition-colors">
                Tài liệu nổi bật
              </a>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Quick Upload Button */}
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs md:text-sm font-semibold transition-all shadow-xs active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Đăng tài liệu</span>
              </button>

              {token && user ? (
                <div className="flex items-center gap-3 pl-1 border-l border-slate-200">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    title="Đăng xuất"
                    className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuth("login")}
                    className="text-xs md:text-sm font-semibold text-slate-700 hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => openAuth("register")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold shadow-xs transition-all active:scale-95"
                  >
                    Tham gia
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto py-8 flex-grow px-4">
          <Routes>
            <Route path="/" element={<Home onOpenAuth={openAuth} user={user} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-white py-8 text-center text-xs text-slate-500">
          <div className="container mx-auto space-y-2">
            <p className="font-semibold text-slate-700">StudyHub — Nền tảng chia sẻ và kiểm duyệt tài liệu học tập</p>
            <p>© 2026 StudyHub. Hỗ trợ sinh viên ôn tập và nâng cao chất lượng học tập.</p>
          </div>
        </footer>

        {/* Global Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialTab={authModalTab}
        />

        {/* Global Upload Modal */}
        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  )
}

export default App