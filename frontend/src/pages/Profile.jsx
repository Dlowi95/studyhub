import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hồ sơ");
        }

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data)); // sync local storage
      } catch (err) {
        setError(err.message);
        localStorage.clear();
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60svh]">
        <div className="text-muted-foreground">Đang tải thông tin hồ sơ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60svh] px-4">
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          Lỗi: {error}. Đang chuyển hướng về trang đăng nhập...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80svh] px-4">
      <Card className="w-full max-w-md shadow-lg border-muted/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</CardTitle>
          <CardDescription>Thông tin tài khoản của bạn trên StudyHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="flex items-center justify-center pb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold uppercase">
              {user?.name?.charAt(0)}
            </div>
          </div>
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground text-sm font-medium">Họ và tên</span>
              <span className="font-semibold">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground text-sm font-medium">Email</span>
              <span className="font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground text-sm font-medium">Vai trò</span>
              <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20">
                {user?.role}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground text-sm font-medium">Trạng thái</span>
              <Badge variant="outline" className="capitalize bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                {user?.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground text-sm font-medium">Ngày tham gia</span>
              <span className="text-sm text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {user?.role === "admin" && (
            <Link to="/admin" className="w-full">
              <Button variant="outline" className="w-full">
                Trang Quản Trị (Admin)
              </Button>
            </Link>
          )}
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            Đăng xuất
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

