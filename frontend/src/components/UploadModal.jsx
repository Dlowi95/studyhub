import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight, ArrowLeft, Layers3, Search, X, Files } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fallbackSubjects, uploadDocumentsIndividually, validateUploadFile } from "@/lib/documentUpload";

const defaultSubjectOptions = fallbackSubjects;

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Chọn file, 2: Điền thông tin, 3: Xác nhận gửi duyệt
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [subjectOptions, setSubjectOptions] = useState(defaultSubjectOptions);
  const [uploadMode, setUploadMode] = useState("new");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceResults, setResourceResults] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchingResources, setSearchingResources] = useState(false);

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
    setStep(2);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    const apiUrl = API_URL;

    fetch(`${apiUrl}/subjects`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Không thể tải học phần"))))
      .then((data) => {
        if (cancelled) return;
        const savedNames = Array.isArray(data.subjects)
          ? data.subjects.map((item) => item.name).filter(Boolean)
          : [];
        setSubjectOptions([...new Set(savedNames)]);
      })
      .catch(() => {
        if (!cancelled) setSubjectOptions(defaultSubjectOptions);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || uploadMode !== "variant" || resourceQuery.trim().length < 2) {
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
        const response = await fetch(`${API_URL}/documents?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể tìm tài liệu");
        setResourceResults(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if (error.name !== "AbortError") setResourceResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchingResources(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, resourceQuery, uploadMode]);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      const validationError = validateUploadFile(selectedFile);
      if (validationError) {
        setError(validationError);
        toast({
          variant: "destructive",
          title: "Tệp không hợp lệ",
          description: validationError,
        });
        return;
      }
      setError("");
      setFile(selectedFile);
      if (!title) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
      // Auto move to step 2 after selecting file
      setStep(2);
    }
  };

  const handleNextStep = (e) => {
    e?.preventDefault();
    if (step === 1 && uploadMode === "batch" && !batchFiles.length) {
      setError("Vui lòng chọn ít nhất một file bài giảng.");
      return;
    }
    if (step === 1 && uploadMode !== "batch" && !file) {
      setError("Vui lòng chọn file tài liệu trước khi tiếp tục.");
      return;
    }
    if (step === 2) {
      if ((uploadMode === "new" && (!title.trim() || !subject))
        || (uploadMode === "batch" && (!batchFiles.length || !subject || batchFiles.some((item) => !item.title.trim())))
        || (uploadMode === "variant" && !selectedResource)) {
        setError(uploadMode === "variant" ? "Hãy chọn bài giảng cần bổ sung định dạng." : "Vui lòng kiểm tra tiêu đề và chọn học phần.");
        return;
      }
      if (uploadMode === "variant" && file && (selectedResource.availableFormats || [selectedResource.fileType]).includes(file.name.split(".").pop()?.toUpperCase())) {
        setError("Bài giảng đã có định dạng này. Hãy chọn một định dạng khác.");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (uploadMode === "batch") {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Bạn cần đăng nhập để upload tài liệu");
        setUploadProgress({ completed: 0, total: batchFiles.length });
        const { uploaded, failed } = await uploadDocumentsIndividually({
          files: batchFiles,
          subjectName: subject,
          docType,
          description,
          tags: subject,
          apiUrl: API_URL,
          token,
          onProgress: (completed, total) => setUploadProgress({ completed, total }),
        });
        if (!uploaded.length) throw new Error(failed[0]?.message || "Không gửi được tài liệu nào.");

        setBatchSummary({ uploaded: uploaded.length, failed });
        uploaded.forEach((document) => {
          window.dispatchEvent(new CustomEvent("documentUploaded", { detail: document }));
          onUploadSuccess?.(document);
        });
        setLoading(false);
        setSuccess(true);
        toast({
          title: failed.length ? "Đã gửi một phần tài liệu" : "Đã gửi các bài giảng",
          description: `${uploaded.length} file đã được gửi kiểm duyệt riêng${failed.length ? `, ${failed.length} file lỗi` : ""}.`,
        });
        window.setTimeout(() => {
          setSuccess(false);
          setBatchSummary(null);
          setUploadProgress({ completed: 0, total: 0 });
          setBatchFiles([]);
          setStep(1);
          setTitle("");
          setSubject("");
          setDescription("");
          setFile(null);
          setSelectedResource(null);
          setResourceQuery("");
          setUploadMode("new");
          onClose();
        }, 2200);
        return;
      }

      const formData = new FormData();
      if (uploadMode === "variant") {
        formData.append("variantOf", selectedResource._id || selectedResource.id);
      } else {
        formData.append("title", title.trim());
        formData.append("description", description || `${docType} - ${subject}`);
        formData.append("subjectName", subject);
        formData.append("tags", subject);
      }
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để upload tài liệu");
      }

      const res = await fetch(`${API_URL}/documents/upload`, {
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
      toast({
        title: "Đã gửi tài liệu thành công!",
        description: uploadMode === "variant"
          ? "Định dạng mới đang chờ được kiểm duyệt riêng."
          : "Tài liệu của bạn đã được chuyển đến ban quản trị để kiểm duyệt trước khi công khai.",
      });
      window.dispatchEvent(new CustomEvent("documentUploaded", { detail: data.document }));
      onUploadSuccess?.(data.document);

      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setTitle("");
        setSubject("");
        setDescription("");
        setFile(null);
        setBatchFiles([]);
        setBatchSummary(null);
        setSelectedResource(null);
        setResourceQuery("");
        setUploadMode("new");
        onClose();
      }, 1600);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Không thể upload tài liệu");
      toast({
        variant: "destructive",
        title: "Lỗi tải lên tài liệu",
        description: err.message || "Không thể upload tài liệu lúc này.",
      });
    }
  };

  const handleCloseModal = () => {
    if (loading) return;
    setStep(1);
    setError("");
    setBatchFiles([]);
    setFile(null);
    setBatchSummary(null);
    setUploadProgress({ completed: 0, total: 0 });
    setSelectedResource(null);
    setResourceQuery("");
    setUploadMode("new");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && handleCloseModal()}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl border-border bg-card text-foreground shadow-xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground ">
            Đăng tải tài liệu học tập
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground ">
            Chia sẻ đề thi, giáo trình và tài liệu ôn tập cùng sinh viên StudyHub.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator Header */}
        {!success && (
          <div className="flex items-center justify-between border-b border-border pb-3 pt-1 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 1 ? "text-primary" : "text-muted-foreground "}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-card text-foreground "}`}>1</span>
              <span>Chọn file</span>
            </div>
            <div className="h-0.5 w-6 bg-card "></div>
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 2 ? "text-primary" : "text-muted-foreground "}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-card text-foreground "}`}>2</span>
              <span>Thông tin</span>
            </div>
            <div className="h-0.5 w-6 bg-card "></div>
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 3 ? "text-primary" : "text-muted-foreground "}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-card text-foreground "}`}>3</span>
              <span>Gửi duyệt</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Screen */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-foreground text-base">{batchSummary ? (batchSummary.failed.length ? "Đã gửi thành công một phần" : "Đã gửi các bài giảng") : "Gửi tài liệu thành công"}</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {batchSummary
                ? `${batchSummary.uploaded} bài đã được gửi vào hàng đợi kiểm duyệt riêng.${batchSummary.failed.length ? ` ${batchSummary.failed.length} file lỗi: ${batchSummary.failed.map((item) => `${item.fileName} — ${item.message}`).join("; ")}` : " Sau khi duyệt, từng bài sẽ xuất hiện riêng trong học phần."}`
                : "Tài liệu đã được đưa vào hàng đợi kiểm duyệt. Sau khi ban quản trị phê duyệt, tài liệu sẽ hiển thị công khai trên StudyHub."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-left">
            {/* STEP 1: Chọn file */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Loại đóng góp">
                  <button type="button" onClick={() => { setUploadMode("new"); setSelectedResource(null); setBatchFiles([]); setError(""); }} className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-2.5 text-[10px] font-semibold ${uploadMode === "new" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}><UploadCloud size={13} /> Tài liệu mới</button>
                  <button type="button" onClick={() => { setUploadMode("batch"); setFile(null); setSelectedResource(null); setBatchFiles([]); setError(""); }} className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-2.5 text-[10px] font-semibold ${uploadMode === "batch" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}><Files size={13} /> Nhiều bài</button>
                  <button type="button" onClick={() => { setUploadMode("variant"); setBatchFiles([]); setError(""); }} className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-2.5 text-[10px] font-semibold ${uploadMode === "variant" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}><Layers3 size={13} /> Thêm định dạng</button>
                </div>
                {uploadMode === "batch" && <p className="rounded-lg bg-primary/5 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">Dùng khi mỗi file là một bài/chương khác nhau trong cùng học phần. Nếu là cùng một bài ở DOCX, PDF..., chọn “Thêm định dạng”.</p>}
                <Label className="text-xs font-semibold text-foreground ">{uploadMode === "batch" ? "Chọn file cho từng bài giảng (tối đa 10 file)" : "Bước 1: Chọn file từ thiết bị"}</Label>
                <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                  event.preventDefault();
                  if (uploadMode === "batch") handleBatchFileSelect(event.dataTransfer.files);
                  else handleFileSelect(event.dataTransfer.files?.[0]);
                }} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted rounded-2xl cursor-pointer transition-all">
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                  <span className="text-xs font-semibold text-foreground ">{uploadMode === "batch" ? "Chọn nhiều file hoặc kéo thả vào đây" : "Nhấp để tải file lên hoặc kéo thả vào đây"}</span>
                  <span className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, PPTX, XLSX, TXT · tối đa 25MB mỗi file</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.xlsx,.txt"
                    multiple={uploadMode === "batch"}
                    className="hidden"
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files || []);
                      event.target.value = "";
                      if (uploadMode === "batch") handleBatchFileSelect(selectedFiles);
                      else handleFileSelect(selectedFiles[0]);
                    }}
                  />
                </label>
              </div>
            )}

            {/* STEP 2: Điền thông tin */}
            {step === 2 && (
              <div className="space-y-3">
                {uploadMode === "batch" ? (
                  <section className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border p-3" aria-label="Danh sách bài giảng">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold">{batchFiles.length} bài giảng riêng</h4>
                      <button type="button" onClick={() => setStep(1)} className="text-[11px] font-medium text-primary hover:underline">Đổi danh sách file</button>
                    </div>
                    {batchFiles.map((item, index) => (
                      <div key={`${item.file.name}-${item.file.size}-${index}`} className="space-y-1 rounded-lg bg-muted/60 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] text-muted-foreground">{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                          <button type="button" aria-label={`Xóa ${item.file.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => setBatchFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button>
                        </div>
                        <Input value={item.title} maxLength={200} aria-label={`Tiêu đề bài ${index + 1}`} onChange={(event) => setBatchFiles((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} className="h-9 rounded-lg text-xs" />
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">Mỗi file sẽ tạo một bài riêng và được kiểm duyệt riêng.</p>
                  </section>
                ) : file && (
                  <div className="flex items-center justify-between p-2.5 bg-primary/10 rounded-xl border border-primary text-xs">
                    <span className="font-semibold text-primary truncate max-w-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      Đổi file
                    </button>
                  </div>
                )}

                {uploadMode === "variant" ? (
                  <section className="space-y-3 rounded-xl border border-border bg-card p-3" aria-label="Chọn bài giảng">
                    <div><h4 className="text-xs font-bold text-foreground">Chọn bài giảng cần bổ sung</h4><p className="mt-1 text-[10px] text-muted-foreground">Tệp mới sẽ được xếp chung với các định dạng hiện có.</p></div>
                    {selectedResource ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                        <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{selectedResource.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{selectedResource.subjectName} · {(selectedResource.availableFormats || [selectedResource.fileType]).join(" / ")}</p>{file && (selectedResource.availableFormats || [selectedResource.fileType]).includes(file.name.split(".").pop()?.toUpperCase()) && <p role="status" className="mt-1 text-[10px] font-semibold text-warning">Bài giảng đã có định dạng này.</p>}</div>
                        <button type="button" className="icon-button shrink-0" aria-label="Chọn bài giảng khác" onClick={() => { setSelectedResource(null); setResourceQuery(""); }}><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} placeholder="Tìm theo tên bài giảng..." className="h-10 rounded-lg pl-9 text-xs" /></div>
                        {searchingResources && <p className="text-[10px] text-muted-foreground">Đang tìm...</p>}
                        {!searchingResources && resourceQuery.trim().length >= 2 && resourceResults.length === 0 && <p className="text-[10px] text-muted-foreground">Chưa tìm thấy bài giảng.</p>}
                        {resourceResults.length > 0 && <div className="max-h-44 space-y-1.5 overflow-y-auto">{resourceResults.map((resource) => <button key={resource._id} type="button" onClick={() => { setSelectedResource(resource); setResourceResults([]); setError(""); }} className="flex w-full items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-left hover:border-primary/50 hover:bg-primary/5"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-foreground">{resource.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{resource.subjectName} · {resource.variantCount || 1} định dạng</span></span><span className="shrink-0 text-[9px] font-bold text-primary">{(resource.availableFormats || [resource.fileType]).join(" / ")}</span></button>)}</div>}
                      </>
                    )}
                  </section>
                ) : <>
                {uploadMode !== "batch" && <div className="space-y-1">
                  <Label htmlFor="upload-title" className="text-xs font-semibold text-foreground ">
                    Tiêu đề tài liệu *
                  </Label>
                  <Input
                    id="upload-title"
                    maxLength={200}
                    placeholder="Ví dụ: Đề cương ôn tập Giải tích 1 kỳ 2024.2 có đáp án..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl bg-card border-border text-foreground "
                  />
                </div>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="upload-subject" className="text-xs font-semibold text-foreground ">
                      Học phần / Môn học *
                    </Label>
                    <select
                      id="upload-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full h-10 px-3 text-xs bg-card border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">-- Chọn môn học --</option>
                      {subjectOptions.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="upload-type" className="text-xs font-semibold text-foreground ">
                      Dạng tài liệu
                    </Label>
                    <select
                      id="upload-type"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-card border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="Đề thi">Đề thi / Kiểm tra</option>
                      <option value="Đề cương">Đề cương ôn tập</option>
                      <option value="Giáo trình">Giáo trình / Slide</option>
                      <option value="Bài tập lớn">Bài tập lớn / Đồ án</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="upload-desc" className="text-xs font-semibold text-foreground ">
                    Mô tả ngắn gọn (tùy chọn)
                  </Label>
                  <textarea
                    id="upload-desc"
                    rows={2}
                    placeholder="Tóm tắt nội dung chính của tài liệu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-xs bg-card text-foreground rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                </>}
              </div>
            )}

            {/* STEP 3: Xác nhận gửi kiểm duyệt */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-2xl border border-border space-y-2 text-xs">
                  <h5 className="font-bold text-foreground border-b border-border pb-2">Xem lại thông tin đăng tải</h5>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Tiêu đề:</span>
                    <span className="font-semibold text-foreground text-right max-w-xs truncate">{uploadMode === "batch" ? `${batchFiles.length} bài giảng riêng` : selectedResource?.title || title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Môn học:</span>
                    <span className="font-semibold text-foreground ">{selectedResource?.subjectName || subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Phân loại:</span>
                    <span className="font-semibold text-foreground ">{uploadMode === "variant" ? `Thêm ${file?.name.split(".").pop()?.toUpperCase() || "định dạng"}` : uploadMode === "batch" ? "Mỗi file là một bài, duyệt riêng" : docType}</span>
                  </div>
                  {uploadMode === "batch" ? (
                    <div className="max-h-36 space-y-1 overflow-y-auto border-t border-border pt-2">
                      {batchFiles.map((item, index) => <p key={`${item.file.name}-${index}`} className="truncate text-right text-[11px]">{item.title} · {item.file.name.split(".").pop()?.toUpperCase()}</p>)}
                    </div>
                  ) : <div className="flex justify-between">
                    <span className="text-muted-foreground ">Tên file:</span>
                    <span className="font-semibold text-foreground truncate max-w-xs">{file?.name}</span>
                  </div>}
                </div>

                {/* Moderation Policy Notice */}
                <div className="p-3.5 bg-accent/10 border border-primary/80 rounded-xl flex items-start gap-2.5 text-xs text-primary ">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Quy trình kiểm duyệt:</strong> Tài liệu sẽ được ban quản trị kiểm tra tính chính xác và tuân thủ quy định trước khi hiển thị công khai trên hệ thống.
                  </p>
                </div>
              </div>
            )}

            {/* Dialog Action Buttons */}
            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border ">
              {step > 1 ? (
                <Button type="button" variant="outline" size="sm" onClick={handlePrevStep} disabled={loading} className="border-border ">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Quay lại
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} disabled={loading} className="border-border ">
                  Hủy
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadMode === "batch" ? `Đang gửi ${uploadProgress.completed}/${uploadProgress.total}...` : "Đang gửi..."}
                    </span>
                  ) : (
                    "Xác nhận gửi duyệt"
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
