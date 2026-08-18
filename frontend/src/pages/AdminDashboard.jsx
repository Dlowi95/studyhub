import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const subjectOptions = [
  "Giải tích",
  "Đại số tuyến tính",
  "Triết học Mác-Lênin",
  "Cấu trúc dữ liệu & Giải thuật",
  "Lập trình C/C++",
  "Vật lý đại cương",
  "Kinh tế vĩ mô",
  "Mạng máy tính",
  "Khác",
];

const createEmptyDocumentForm = () => ({
  title: "",
  description: "",
  subjectName: "",
  tags: "",
  fileUrl: "",
  fileName: "",
  fileType: "PDF",
  status: "pending",
});

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState(createEmptyDocumentForm());
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentAdmin, setCurrentAdmin] = useState(null);

  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleDocumentFormChange = (field, value) => {
    setDocumentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetDocumentForm = () => {
    setEditingDocumentId(null);
    setSelectedFile(null);
    setDocumentForm(createEmptyDocumentForm());
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể tải danh sách người dùng"
        );
      }

      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Không thể tải người dùng");
    }
  };

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/documents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể tải danh sách tài liệu"
        );
      }

      setDocuments(data);
    } catch (err) {
      console.error("Fetch documents error:", err);
      setError((prev) => prev || err.message);
    }
  };

  useEffect(() => {
    const adminStr = localStorage.getItem("user");

    if (adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        setCurrentAdmin(admin);
      } catch (err) {
        console.error("Không thể đọc thông tin admin:", err);
      }
    }

    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchUsers(),
        fetchDocuments(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [navigate]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const newStatus =
      currentStatus === "active" ? "blocked" : "active";

    try {
      const response = await fetch(
        `${API_URL}/admin/users/${userId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Không thể cập nhật trạng thái người dùng"
        );
        return;
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: newStatus,
              }
            : user
        )
      );
    } catch (err) {
      console.error("Toggle user status error:", err);
      alert("Đã xảy ra lỗi: " + err.message);
    }
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!documentForm.title || !documentForm.subjectName) {
      alert("Vui lòng nhập tiêu đề và học phần");
      return;
    }

    try {
      let finalFileUrl = documentForm.fileUrl || "";
      let finalFileName = documentForm.fileName || selectedFile?.name || "";
      let finalFileType = documentForm.fileType || selectedFile?.name?.split(".").pop()?.toUpperCase() || "PDF";

      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("title", documentForm.title);
        uploadFormData.append("description", documentForm.description || "");
        uploadFormData.append("subjectName", documentForm.subjectName);
        uploadFormData.append("tags", documentForm.tags);
        uploadFormData.append("fileType", finalFileType);
        uploadFormData.append("file", selectedFile);

        const uploadRes = await fetch(`${API_URL}/documents/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.message || "Upload file thất bại");
        }

        finalFileUrl = uploadData.document?.fileUrl || finalFileUrl;
        finalFileName = uploadData.document?.fileName || finalFileName;
        finalFileType = uploadData.document?.fileType || finalFileType;
      }

      if (!finalFileUrl) {
        alert("Vui lòng chọn file PDF hoặc nhập URL file");
        return;
      }

      const payload = {
        ...documentForm,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileType: finalFileType,
        tags: documentForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const url = editingDocumentId
        ? `${API_URL}/admin/documents/${editingDocumentId}`
        : `${API_URL}/admin/documents`;

      const method = editingDocumentId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu tài liệu");
      }

      const savedDocument = data.document;

      if (editingDocumentId) {
        setDocuments((prevDocuments) =>
          prevDocuments.map((doc) =>
            doc._id === editingDocumentId ? savedDocument : doc
          )
        );
      } else {
        setDocuments((prevDocuments) => [savedDocument, ...prevDocuments]);
      }

      resetDocumentForm();
    } catch (err) {
      console.error("Save document error:", err);
      alert(err.message || "Đã xảy ra lỗi khi lưu tài liệu");
    }
  };

  const handleDocumentEdit = (doc) => {
    setEditingDocumentId(doc._id);
    setDocumentForm({
      title: doc.title || "",
      description: doc.description || "",
      subjectName: doc.subjectName || "",
      tags: Array.isArray(doc.tags) ? doc.tags.join(", ") : "",
      fileUrl: doc.fileUrl || "",
      fileName: doc.fileName || "",
      fileType: doc.fileType || "PDF",
      status: doc.status || "pending",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDocumentDelete = async (documentId) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xoá tài liệu này?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xoá tài liệu");
      }

      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc._id !== documentId)
      );
    } catch (err) {
      console.error("Delete document error:", err);
      alert(err.message || "Đã xảy ra lỗi khi xoá tài liệu");
    }
  };

  const toggleDocumentStatus = async (documentId, currentStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const nextStatus =
      currentStatus === "pending"
        ? "approved"
        : currentStatus === "approved"
        ? "rejected"
        : "approved";

    try {
      const response = await fetch(
        `${API_URL}/admin/documents/${documentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Không thể cập nhật trạng thái tài liệu"
        );
        return;
      }

      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc._id === documentId
            ? {
                ...doc,
                status: nextStatus,
              }
            : doc
        )
      );
    } catch (err) {
      console.error("Toggle document status error:", err);

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
        <div className="text-muted-foreground">
          Đang tải dữ liệu quản trị...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-left">
            StudyHub Admin Panel
          </h1>

          <p className="text-muted-foreground text-left">
            Quản trị viên đang đăng nhập:{" "}
            <span className="font-semibold">
              {currentAdmin?.name || "Admin"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="outline">
              Hồ sơ cá nhân
            </Button>
          </Link>

          <Button
            onClick={handleLogout}
            variant="destructive"
          >
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
          <CardTitle className="text-xl text-left">
            {editingDocumentId ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
          </CardTitle>
          <CardDescription className="text-left">
            Gắn học phần, tag và trạng thái tài liệu trong hệ thống admin.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleDocumentSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Tiêu đề</label>
                <input
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => handleDocumentFormChange("title", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Ví dụ: Giải tích 1 - Chương 3"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Học phần</label>
                <select
                  value={documentForm.subjectName}
                  onChange={(e) => handleDocumentFormChange("subjectName", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn học phần --</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-left md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={documentForm.description}
                  onChange={(e) => handleDocumentFormChange("description", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[96px]"
                  placeholder="Mô tả ngắn về tài liệu"
                />
              </div>

              <div className="space-y-2 text-left md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Tags</label>
                <input
                  type="text"
                  value={documentForm.tags}
                  onChange={(e) => handleDocumentFormChange("tags", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Ví dụ: giải tích, đề thi, chương 3"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">File PDF / tài liệu</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:text-white file:px-3 file:py-1.5"
                />
                <p className="text-[11px] text-slate-500">Nếu chọn file mới, hệ thống sẽ thay thế file cũ bằng file vừa chọn.</p>
              </div>


              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Loại file</label>
                <select
                  value={documentForm.fileType}
                  onChange={(e) => handleDocumentFormChange("fileType", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="PPTX">PPTX</option>
                  <option value="ZIP">ZIP</option>
                  <option value="FILE">FILE</option>
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                <select
                  value={documentForm.status}
                  onChange={(e) => handleDocumentFormChange("status", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetDocumentForm}>
                Reset
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {editingDocumentId ? "Lưu thay đổi" : "Thêm tài liệu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-md border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl text-left">
            Quản lý người dùng
          </CardTitle>

          <CardDescription className="text-left">
            Khoá tài khoản hoặc thay đổi trạng thái hoạt động
            của các thành viên.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">
                    Avatar
                  </TableHead>
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
                          {user.name?.charAt(0) || "U"}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-left">
                        {user.name || "Chưa có tên"}
                      </TableCell>

                      <TableCell className="text-left">
                        {user.email || "Chưa có email"}
                      </TableCell>

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
                          {user.role || "user"}
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
                          disabled={user._id === currentAdmin?._id || user._id === currentAdmin?.id}
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

      <Card className="shadow-md border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl text-left">
            Quản lý tài liệu
          </CardTitle>

          <CardDescription className="text-left">
            Duyệt tài liệu trước khi hiển thị trên trang chủ cho người dùng.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Người đăng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có tài liệu nào cần duyệt.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc._id} className="hover:bg-muted/30 align-top">
                      <TableCell className="text-left">
                        <div className="font-medium max-w-[220px] break-words">
                          {doc.title || "Không có tiêu đề"}
                        </div>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                            Xem file
                          </a>
                        )}
                      </TableCell>

                      <TableCell className="text-left">
                        {doc.subjectName || doc.subjectId?.name || "Khác"}
                      </TableCell>

                      <TableCell className="text-left">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(Array.isArray(doc.tags) ? doc.tags : []).slice(0, 3).map((tag, index) => (
                            <Badge key={`${tag}-${index}`} variant="outline" className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700">
                              {tag}
                            </Badge>
                          ))}
                          {(!doc.tags || doc.tags.length === 0) && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-left">
                        {doc.uploaderId?.name || doc.uploader?.name || "Người dùng"}
                      </TableCell>

                      <TableCell className="text-left">
                        {doc.fileType || "FILE"}
                      </TableCell>

                      <TableCell className="text-left">
                        <Badge
                          variant="outline"
                          className={
                            doc.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : doc.status === "rejected"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                          }
                        >
                          {doc.status === "approved"
                            ? "Đã duyệt"
                            : doc.status === "rejected"
                            ? "Từ chối"
                            : "Chờ duyệt"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDocumentEdit(doc)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDocumentDelete(doc._id)}>
                            Xoá
                          </Button>
                          <Button
                            size="sm"
                            variant={doc.status === "approved" ? "destructive" : "default"}
                            onClick={() => toggleDocumentStatus(doc._id, doc.status)}
                          >
                            {doc.status === "approved" ? "Từ chối" : "Duyệt"}
                          </Button>
                        </div>
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
