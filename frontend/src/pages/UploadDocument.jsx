import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SUBJECT_OPTIONS = [
  "Giải tích 1 & 2",
  "Đại số tuyến tính",
  "Triết học Mác-Lênin",
  "Cấu trúc dữ liệu & Giải thuật",
  "Cơ sở dữ liệu",
  "Lập trình Web",
  "Lập trình C/C++",
  "Mạng máy tính",
  "Kinh tế vi mô",
  "Kinh tế vĩ mô",
  "Vật lý đại cương",
  "An toàn thông tin",
  "Khác",
];

const DOC_TYPES = ["Đề thi & Đáp án", "Giáo trình & Sách", "Bài giảng & Slide", "Bài tập lớn / Đồ án", "Tài liệu ôn tập tổng hợp"];

export default function UploadDocument() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi & Đáp án");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState(SUBJECT_OPTIONS);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiUrl}/subjects`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Không thể tải học phần"))))
      .then((data) => {
        if (cancelled) return;
        const savedSubjects = Array.isArray(data.subjects)
          ? data.subjects.map((item) => item.name).filter(Boolean)
          : [];
        setSubjectOptions([...new Set([...savedSubjects, ...SUBJECT_OPTIONS])]);
      })
      .catch(() => {
        if (!cancelled) setSubjectOptions(SUBJECT_OPTIONS);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Dung lượng file tối đa là 25MB.");
      return;
    }

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    const validExtensions = ["pdf", "docx", "pptx", "xlsx", "txt"];
    if (!validExtensions.includes(ext)) {
      setError("Chỉ chấp nhận file định dạng PDF, DOCX, PPTX, XLSX hoặc TXT.");
      return;
    }

    setError("");
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalSubject = subject === "Khác" ? customSubject.trim() : subject;

    if (!file) {
      setError("Vui lòng chọn file tài liệu cần tải lên.");
      return;
    }
    if (!title.trim()) {
      setError("Vui lòng nhập tên tài liệu.");
      return;
    }
    if (!finalSubject) {
      setError("Vui lòng chọn hoặc nhập tên học phần.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bạn cần đăng nhập để đăng tải tài liệu.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim() || `${docType} - ${finalSubject}`);
      formData.append("subjectName", finalSubject);
      formData.append("tags", tags ? tags : finalSubject);
      formData.append("fileType", file.name.split(".").pop()?.toUpperCase() || "FILE");
      formData.append("file", file);

      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải lên tài liệu");
      }

      setSuccess(true);

      toast({
        title: "Tải lên thành công!",
        description: "Tài liệu của bạn đã được gửi và đang chờ kiểm duyệt.",
      });
    } catch (err) {
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Đăng tải tài liệu thành công!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cảm ơn bạn đã đóng góp cho cộng đồng StudyHub. Tài liệu của bạn đã được gửi đến ban quản trị để kiểm duyệt trước khi hiển thị công khai.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-left text-xs space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{title}</div>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Học phần: {subject === "Khác" ? customSubject : subject}</span>
              <span>•</span>
              <span>{docType}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setSubject("");
                setCustomSubject("");
                setDescription("");
                setTags("");
                setFile(null);
              }}
              variant="outline"
              className="flex-1 rounded-xl text-xs font-semibold"
            >
              Đăng thêm tài liệu khác
            </Button>
            <Link to="/profile" className="flex-1">
              <Button className="w-full rounded-xl text-xs font-semibold">
                Xem trong hồ sơ của tôi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      {/* Top bar back link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kiểm duyệt an toàn 24/7</span>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Đăng tải tài liệu học tập
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Chia sẻ đề thi, giáo trình, bài tập lớn và ghi chú để cùng xây dựng cộng đồng sinh viên vững mạnh.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* File Drag & Drop Box */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tệp tài liệu <span className="text-red-500">*</span>
            </Label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.xlsx,.txt"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white max-w-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi file khác
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Kéo thả tệp tài liệu vào đây hoặc <span className="text-primary underline">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hỗ trợ PDF, DOCX, PPTX, XLSX, TXT (Tối đa 25MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên tài liệu */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tiêu đề tài liệu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đề cương chi tiết Giải tích 1 kèm lời giải 2026"
                className="h-11 rounded-xl text-sm"
                required
              />
            </div>

            {/* Học phần */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Học phần / Môn học <span className="text-red-500">*</span>
              </Label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Chọn học phần --</option>
                {subjectOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              {subject === "Khác" && (
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Nhập tên môn học khác..."
                  className="h-10 mt-2 rounded-xl text-xs"
                  required
                />
              )}
            </div>

            {/* Loại tài liệu */}
            <div className="space-y-2">
              <Label htmlFor="docType" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Thể loại tài liệu
              </Label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Từ khoá / Tags (cách nhau bởi dấu phẩy)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="VD: giai tich, de thi, on tap, bach khoa"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mô tả chi tiết nội dung tài liệu
              </Label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả tóm tắt nội dung tài liệu, cấu trúc tài liệu, dành cho sinh viên khóa nào..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Link to="/">
              <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold px-5 h-10">
                Hủy bỏ
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl text-xs font-semibold px-6 h-10 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Gửi duyệt tài liệu
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
