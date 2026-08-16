import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách người dùng");
      }

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get logged in admin info
    const adminStr = localStorage.getItem("user");
    if (adminStr) {
      try {
        setCurrentAdmin(JSON.parse(adminStr));
      } catch (e) {
        console.error(e);
      }
    }
    fetchUsers();
  }, [navigate]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "active" ? "blocked" : "active";

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể cập nhật trạng thái");
        return;
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert("Đã xảy ra lỗi: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60svh]">
        <div className="text-muted-foreground">Đang tải danh sách người dùng...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-left">StudyHub Admin Panel</h1>
          <p className="text-muted-foreground text-left">
            Quản trị viên đang đăng nhập: <span className="font-semibold">{currentAdmin?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="outline">Hồ sơ cá nhân</Button>
          </Link>
          <Button onClick={handleLogout} variant="destructive">
            Đăng xuất
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          Lỗi: {error}
        </div>
      )}

      <Card className="shadow-md border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl text-left">Quản lý người dùng</CardTitle>
          <CardDescription className="text-left">
            Khoá tài khoản hoặc thay đổi trạng thái hoạt động của các thành viên.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không có người dùng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold uppercase">
                          {user.name?.charAt(0)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-left">{user.name}</TableCell>
                      <TableCell className="text-left">{user.email}</TableCell>
                      <TableCell className="text-left">
                        <Badge
                          variant="outline"
                          className={
                            user.role === "admin"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : user.role === "moderator"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge
                          variant="outline"
                          className={
                            user.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }
                        >
                          {user.status === "active" ? "Hoạt động" : "Bị khoá"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={user.status === "active" ? "destructive" : "default"}
                          disabled={user._id === currentAdmin?.id}
                          onClick={() => toggleUserStatus(user._id, user.status)}
                          className="min-w-[90px]"
                        >
                          {user.status === "active" ? "Khoá" : "Mở khoá"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
