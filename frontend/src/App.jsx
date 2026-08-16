import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

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

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("authChange", handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    // Notify storage state change to sync navbar
    window.dispatchEvent(new Event("authChange"))
    window.location.href = "/"
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col">
        {/* Navigation Bar */}
        <header className="border-b bg-card py-4 px-6 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                StudyHub
              </span>
            </Link>
            
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                Trang chủ
              </Link>
              {token && user ? (
                <>
                  {user.role === "admin" && (
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                      Trang Admin
                    </Link>
                  )}
                  <Link to="/profile" className="text-muted-foreground hover:text-foreground">
                    Hồ sơ ({user.name})
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="text-destructive hover:text-destructive/80 font-semibold"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-muted-foreground hover:text-foreground">
                    Đăng nhập
                  </Link>
                  <Link to="/register">
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-xs font-semibold">
                      Đăng ký
                    </button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto py-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
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
        <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
          StudyHub &copy; 2026. Phục vụ chia sẻ học tập.
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
