import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("Dung lượng file tối đa là 25MB.");
        return;
      }
      setError("");
      setFile(selectedFile);
      if (!title) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn file tài liệu.");
      return;
    }

    if (!title || !subject) {
      setError("Vui lòng nhập tiêu đề và chọn môn học.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", `${docType} - ${subject}`);
      formData.append("subjectName", subject);
      formData.append("tags", subject);
      formData.append("fileType", file.name.split(".").pop()?.toUpperCase() || "FILE");
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để upload tài liệu");
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload thất bại");
      }

      setLoading(false);
      setSuccess(true);
      onUploadSuccess?.(data.document);

      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setSubject("");
        setFile(null);
        onClose();
      }, 1400);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Không thể upload tài liệu");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl border-slate-200 shadow-xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Đăng tải tài liệu mới
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tài liệu của bạn sẽ được kiểm duyệt trước khi hiển thị công khai trên StudyHub.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Gửi tài liệu thành công</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tài liệu đã được chuyển đến ban kiểm duyệt để duyệt trước khi hiển thị cho cộng đồng.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold text-slate-700">File tài liệu (PDF, DOCX)</Label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50 rounded-xl cursor-pointer transition-all">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                {file ? (
                  <span className="text-xs font-semibold text-primary truncate max-w-xs">{file.name}</span>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-slate-700">Bấm để chọn file hoặc kéo thả vào đây</span>
                    <span className="text-[11px] text-slate-400">PDF, DOCX, PPTX (tối đa 25MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="upload-title" className="text-xs font-semibold text-slate-700">
                Tiêu đề tài liệu
              </Label>
              <Input
                id="upload-title"
                type="text"
                placeholder="Ví dụ: Đề cương ôn tập Triết học 12 chương có đáp án..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="upload-subject" className="text-xs font-semibold text-slate-700">
                  Học phần / Môn học
                </Label>
                <select
                  id="upload-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjectOptions.map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upload-type" className="text-xs font-semibold text-slate-700">
                  Dạng tài liệu
                </Label>
                <select
                  id="upload-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Đề thi">Đề thi / Đề kiểm tra</option>
                  <option value="Đề cương">Đề cương ôn tập</option>
                  <option value="Giáo trình">Giáo trình / Slide</option>
                  <option value="Bài tập lớn">Bài tập lớn / Đồ án</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                  </span>
                ) : (
                  "Gửi tài liệu duyệt"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

