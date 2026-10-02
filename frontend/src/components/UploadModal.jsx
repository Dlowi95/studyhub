import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fallbackSubjects, validateUploadFile } from "@/lib/documentUpload";

const defaultSubjectOptions = fallbackSubjects;

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Chọn file, 2: Điền thông tin, 3: Xác nhận gửi duyệt
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [subjectOptions, setSubjectOptions] = useState(defaultSubjectOptions);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    if (step === 1 && !file) {
      setError("Vui lòng chọn file tài liệu trước khi tiếp tục.");
      return;
    }
    if (step === 2) {
      if (!title.trim() || !subject) {
        setError("Vui lòng nhập tiêu đề và chọn học phần.");
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
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description || `${docType} - ${subject}`);
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
      toast({
        title: "Đã gửi tài liệu thành công!",
        description: "Tài liệu của bạn đã được chuyển đến ban quản trị để kiểm duyệt trước khi công khai.",
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
    setStep(1);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
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
            <h4 className="font-bold text-foreground text-base">Gửi tài liệu thành công</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Tài liệu đã được đưa vào hàng đợi kiểm duyệt. Sau khi ban quản trị phê duyệt, tài liệu sẽ hiển thị công khai trên StudyHub.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-left">
            {/* STEP 1: Chọn file */}
            {step === 1 && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-foreground ">Bước 1: Chọn file từ thiết bị</Label>
                <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                  event.preventDefault();
                  handleFileSelect(event.dataTransfer.files?.[0]);
                }} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted rounded-2xl cursor-pointer transition-all">
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                  <span className="text-xs font-semibold text-foreground ">Nhấp để tải file lên hoặc kéo thả vào đây</span>
                  <span className="text-[11px] text-muted-foreground mt-1">Hỗ trợ file: PDF, DOCX, PPTX, XLSX, TXT (tối đa 25MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.xlsx,.txt"
                    className="hidden"
                    onChange={(event) => handleFileSelect(event.target.files?.[0])}
                  />
                </label>
              </div>
            )}

            {/* STEP 2: Điền thông tin */}
            {step === 2 && (
              <div className="space-y-3">
                {file && (
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

                <div className="space-y-1">
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
                </div>

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
              </div>
            )}

            {/* STEP 3: Xác nhận gửi kiểm duyệt */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-2xl border border-border space-y-2 text-xs">
                  <h5 className="font-bold text-foreground border-b border-border pb-2">Xem lại thông tin đăng tải</h5>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Tiêu đề:</span>
                    <span className="font-semibold text-foreground text-right max-w-xs truncate">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Môn học:</span>
                    <span className="font-semibold text-foreground ">{subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Phân loại:</span>
                    <span className="font-semibold text-foreground ">{docType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground ">Tên file:</span>
                    <span className="font-semibold text-foreground truncate max-w-xs">{file?.name}</span>
                  </div>
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
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="border-border ">
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
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
