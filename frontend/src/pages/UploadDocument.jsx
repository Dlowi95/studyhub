import { API_URL } from "@/lib/api";
import PageHeading from "@/components/PageHeading";
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
  Search,
  X,
  Layers3,
  Files,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fallbackSubjects, uploadDocumentsIndividually, validateUploadFile } from "@/lib/documentUpload";

const SUBJECT_OPTIONS = fallbackSubjects;

const DOC_TYPES = ["Đề thi & Đáp án", "Giáo trình & Sách", "Bài giảng & Slide", "Bài tập lớn / Đồ án", "Tài liệu ôn tập tổng hợp"];

export default function UploadDocument() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi & Đáp án");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState(SUBJECT_OPTIONS);
  const [uploadMode, setUploadMode] = useState("new");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceResults, setResourceResults] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchingResources, setSearchingResources] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const apiUrl = API_URL;

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiUrl}/subjects`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Không thể tải học phần"))))
      .then((data) => {
        if (cancelled) return;
        const savedSubjects = Array.isArray(data.subjects)
          ? data.subjects.map((item) => item.name).filter(Boolean)
          : [];
        setSubjectOptions([...new Set(savedSubjects)]);
      })
      .catch(() => {
        if (!cancelled) setSubjectOptions(SUBJECT_OPTIONS);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (uploadMode !== "variant" || resourceQuery.trim().length < 2) {
      const resetTimer = window.setTimeout(() => {
        setResourceResults([]);
        setSearchingResources(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingResources(true);
      try {
        const params = new URLSearchParams({ q: resourceQuery.trim(), searchIn: "title", limit: "8" });
        const response = await fetch(`${apiUrl}/documents?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể tìm tài liệu");
        setResourceResults(Array.isArray(data.items) ? data.items : []);
      } catch (searchError) {
        if (searchError.name !== "AbortError") setResourceResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchingResources(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiUrl, resourceQuery, uploadMode]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleBatchFileSelect = (selectedFiles) => {
    const files = Array.from(selectedFiles || []);
    if (!files.length) return;
    if (files.length > 10) {
      setError("Mỗi lần có thể chọn tối đa 10 bài giảng.");
      return;
    }
    const invalidFile = files.find((selectedFile) => validateUploadFile(selectedFile));
    if (invalidFile) {
      setError(`${invalidFile.name}: ${validateUploadFile(invalidFile)}`);
      return;
    }
    setError("");
    setBatchFiles(files.map((selectedFile) => ({
      file: selectedFile,
      title: selectedFile.name.replace(/\.[^/.]+$/, "").slice(0, 200),
    })));
    setFile(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      if (uploadMode === "batch") handleBatchFileSelect(e.dataTransfer.files);
      else handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalSubject = subject === "Khác" ? customSubject.trim() : subject;

    if (uploadMode === "batch" && (!batchFiles.length || batchFiles.some((item) => !item.title.trim()))) {
      setError("Vui lòng chọn file và kiểm tra tiêu đề từng bài giảng.");
      return;
    }
    if (uploadMode !== "batch" && !file) {
      setError("Vui lòng chọn file tài liệu cần tải lên.");
      return;
    }
    if (uploadMode === "variant" && !selectedResource) {
      setError("Hãy tìm và chọn bài giảng cần bổ sung định dạng.");
      return;
    }
    if (uploadMode === "variant" && file && (selectedResource.availableFormats || [selectedResource.fileType]).includes(file.name.split(".").pop()?.toUpperCase())) {
      setError("Bài giảng đã có định dạng này. Hãy chọn một định dạng khác.");
      return;
    }
    if (uploadMode === "new" && !title.trim()) {
      setError("Vui lòng nhập tên tài liệu.");
      return;
    }
    if ((uploadMode === "new" || uploadMode === "batch") && !finalSubject) {
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
      if (uploadMode === "batch") {
        setUploadProgress({ completed: 0, total: batchFiles.length });
        const { uploaded, failed } = await uploadDocumentsIndividually({
          files: batchFiles,
          subjectName: finalSubject,
          docType,
          description,
          tags: tags || finalSubject,
          apiUrl,
          token,
          onProgress: (completed, total) => setUploadProgress({ completed, total }),
        });
        if (!uploaded.length) throw new Error(failed[0]?.message || "Không gửi được tài liệu nào.");
        setBatchSummary({ uploaded: uploaded.length, failed });
        uploaded.forEach((document) => window.dispatchEvent(new CustomEvent("documentUploaded", { detail: document })));
        setSuccess(true);
        toast({
          title: failed.length ? "Đã gửi một phần tài liệu" : "Đã gửi các bài giảng",
          description: `${uploaded.length} file đã được gửi kiểm duyệt riêng${failed.length ? `, ${failed.length} file lỗi` : ""}.`,
        });
        return;
      }

      const formData = new FormData();
      if (uploadMode === "variant") {
        formData.append("variantOf", selectedResource.id || selectedResource._id);
      } else {
        formData.append("title", title.trim());
        formData.append("description", description.trim() || `${docType} - ${finalSubject}`);
        formData.append("subjectName", finalSubject);
        formData.append("tags", tags ? tags : finalSubject);
      }
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
        description: uploadMode === "variant"
          ? "Định dạng mới đã được gửi đi kiểm duyệt riêng."
          : "Tài liệu của bạn đã được gửi và đang chờ kiểm duyệt.",
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
        <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground ">
              {batchSummary ? (batchSummary.failed.length ? "Đã gửi thành công một phần" : "Đã gửi các bài giảng") : "Đăng tải tài liệu thành công!"}
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {batchSummary
                ? `${batchSummary.uploaded} bài đã được gửi để kiểm duyệt riêng.${batchSummary.failed.length ? ` ${batchSummary.failed.length} file lỗi: ${batchSummary.failed.map((item) => `${item.fileName} — ${item.message}`).join("; ")}` : " Sau khi duyệt, từng bài sẽ xuất hiện riêng trong học phần."}`
                : "Cảm ơn bạn đã đóng góp cho cộng đồng StudyHub. Tài liệu của bạn đã được gửi đến ban quản trị để kiểm duyệt trước khi hiển thị công khai."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted border border-border/70 text-left text-xs space-y-1.5">
              <div className="font-semibold text-foreground text-sm truncate">{uploadMode === "batch" ? `${batchFiles.length} bài giảng riêng` : selectedResource?.title || title}</div>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>Học phần: {selectedResource?.subjectName || (subject === "Khác" ? customSubject : subject)}</span>
                <span>•</span>
                <span>{uploadMode === "variant" ? `Bổ sung ${file?.name.split(".").pop()?.toUpperCase() || "định dạng"}` : uploadMode === "batch" ? "Mỗi file là một bài riêng" : docType}</span>
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
                setBatchFiles([]);
                setBatchSummary(null);
                setUploadProgress({ completed: 0, total: 0 });
                setSelectedResource(null);
                setResourceQuery("");
                setUploadMode("new");
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
    <div className="upload-page page-shell max-w-4xl pb-10">
      {/* Top bar back link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kiểm duyệt trước khi công khai</span>
        </div>
      </div>

      <PageHeading eyebrow="CHIA SẺ HỌC LIỆU" title="Tài liệu hay, cùng chia sẻ." description="Gửi đề thi, giáo trình hoặc ghi chú của bạn. Ban quản trị sẽ xem xét nội dung trước khi đưa vào thư viện." />
      <div className="paper-panel p-5 sm:p-8 mb-8">
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive flex items-start gap-3 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-2 rounded-2xl bg-muted/70 p-1.5 sm:grid-cols-3" role="group" aria-label="Loại đóng góp">
            <button type="button" onClick={() => { setUploadMode("new"); setSelectedResource(null); setBatchFiles([]); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition ${uploadMode === "new" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
              <UploadCloud size={16} /> Tạo tài liệu mới
            </button>
            <button type="button" onClick={() => { setUploadMode("batch"); setFile(null); setSelectedResource(null); setBatchFiles([]); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition ${uploadMode === "batch" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
              <Files size={16} /> Nhiều bài
            </button>
            <button type="button" onClick={() => { setUploadMode("variant"); setBatchFiles([]); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition ${uploadMode === "variant" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
              <Layers3 size={16} /> Thêm định dạng cho bài giảng
            </button>
          </div>

          {uploadMode === "variant" && (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label="Chọn bài giảng">
              <div>
                <h3 className="text-sm font-bold text-foreground">Chọn bài giảng có sẵn</h3>
                <p className="mt-1 text-xs text-muted-foreground">Các định dạng của cùng bài sẽ nằm chung một trang tài liệu.</p>
              </div>
              {selectedResource ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{selectedResource.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedResource.subjectName} · Đã có: {(selectedResource.availableFormats || [selectedResource.fileType]).filter(Boolean).join(", ")}</p>
                  {file && (selectedResource.availableFormats || [selectedResource.fileType]).includes(file.name.split(".").pop()?.toUpperCase()) && <p className="mt-2 text-xs font-semibold text-warning" role="status">Bài giảng đã có định dạng này; hãy chọn tệp khác định dạng.</p>}
                  </div>
                  <button type="button" className="icon-button shrink-0" aria-label="Chọn bài giảng khác" onClick={() => { setSelectedResource(null); setResourceQuery(""); }}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} placeholder="Tìm tên bài giảng..." className="h-11 rounded-xl pl-9" />
                  </div>
                  {searchingResources && <p className="text-xs text-muted-foreground">Đang tìm tài liệu...</p>}
                  {!searchingResources && resourceQuery.trim().length >= 2 && resourceResults.length === 0 && <p className="text-xs text-muted-foreground">Chưa tìm thấy bài giảng phù hợp.</p>}
                  {resourceResults.length > 0 && (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {resourceResults.map((resource) => (
                        <button key={resource._id} type="button" onClick={() => { setSelectedResource(resource); setResourceResults([]); setError(""); }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5">
                          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{resource.title}</span><span className="mt-1 block text-xs text-muted-foreground">{resource.subjectName} · {resource.variantCount || 1} định dạng</span></span>
                          <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-foreground">{(resource.availableFormats || [resource.fileType]).join(" / ")}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* File Drag & Drop Box */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
              Tệp tài liệu <span className="text-destructive">*</span>
            </Label>

            <div
              role="button"
              tabIndex={0}
              aria-label="Chọn tệp tài liệu"
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}
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
                  : file || batchFiles.length
                  ? "border-primary/50 bg-primary/10 "
                  : "border-border hover:border-primary/60 hover:bg-muted/60 "
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.xlsx,.txt"
                multiple={uploadMode === "batch"}
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files || []);
                  e.target.value = "";
                  if (uploadMode === "batch") handleBatchFileSelect(selectedFiles);
                  else handleFileSelect(selectedFiles[0]);
                }}
              />

              {uploadMode === "batch" ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs"><Files className="w-6 h-6" /></div>
                  <p className="text-sm font-semibold text-foreground">{batchFiles.length ? `${batchFiles.length} bài đã chọn` : "Chọn nhiều bài giảng cùng học phần"}</p>
                  <p className="text-xs text-muted-foreground">Mỗi file sẽ tạo một tài liệu và được duyệt riêng · tối đa 10 file</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground max-w-[240px] sm:max-w-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                    <p className="text-sm font-semibold text-foreground ">
                      Kéo thả tệp tài liệu vào đây hoặc <span className="text-primary underline">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-xs text-muted-foreground ">
                      Hỗ trợ PDF, DOCX, PPTX, XLSX, TXT (tối đa 25MB mỗi file)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploadMode === "batch" && batchFiles.length > 0 && (
            <section className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-4" aria-label="Danh sách bài giảng đã chọn">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Đặt tên từng bài ({batchFiles.length})</h3><button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => fileInputRef.current?.click()}>Chọn lại file</button></div>
              {batchFiles.map((item, index) => <div key={`${item.file.name}-${item.file.size}-${index}`} className="space-y-1 rounded-xl bg-muted/50 p-2.5"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB</span><button type="button" aria-label={`Xóa ${item.file.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => setBatchFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></button></div><Input value={item.title} maxLength={200} aria-label={`Tên bài giảng ${index + 1}`} onChange={(event) => setBatchFiles((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} className="h-10 rounded-lg text-sm" /></div>)}
            </section>
          )}

          {uploadMode === "batch" && <p className="-mt-3 rounded-xl bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">Dùng khi mỗi file là một bài/chương khác nhau trong cùng học phần. Nếu cùng một bài có nhiều bản DOCX, PDF..., chọn “Thêm định dạng cho bài giảng”.</p>}

          {(uploadMode === "new" || uploadMode === "batch") && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên tài liệu */}
            {uploadMode === "new" && <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
                Tiêu đề tài liệu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đề cương chi tiết Giải tích 1 kèm lời giải 2026"
                className="h-11 rounded-xl text-sm"
                required
              />
            </div>}

            {/* Học phần */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
                Học phần / Môn học <span className="text-destructive">*</span>
              </Label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <Label htmlFor="docType" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
                Thể loại tài liệu
              </Label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
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
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">
                Mô tả chi tiết nội dung tài liệu
              </Label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả tóm tắt nội dung tài liệu, cấu trúc tài liệu, dành cho sinh viên khóa nào..."
                className="w-full p-3.5 rounded-2xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border ">
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
                  {uploadMode === "batch" ? `Đang gửi ${uploadProgress.completed}/${uploadProgress.total}...` : "Đang tải lên..."}
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
