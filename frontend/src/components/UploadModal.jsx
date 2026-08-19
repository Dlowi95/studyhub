import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, FileText, AlertCircle, Loader2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [step, setStep] = useState(1); // 1: Chọn file, 2: Điền thông tin, 3: Xác nhận gửi duyệt
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [docType, setDocType] = useState("Đề thi");
  const [description, setDescription] = useState("");
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

    // Simulate API upload
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      const newDoc = {
        id: "doc-" + Date.now(),
        title,
        subject: subject || "Chung",
        downloads: 0,
        rating: 5.0,
        type: file.name.endsWith(".docx") ? "DOCX" : file.name.endsWith(".pptx") ? "PPTX" : "PDF",
        uploader: "Tôi",
        isVerified: false,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      };

      onUploadSuccess?.(newDoc);

      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setTitle("");
        setSubject("");
        setDescription("");
        setFile(null);
        onClose();
      }, 1600);
    }, 900);
  };

  const handleCloseModal = () => {
    setStep(1);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl border-slate-200 shadow-xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Đăng tải tài liệu học tập
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Chia sẻ đề thi, giáo trình và tài liệu ôn tập cùng sinh viên StudyHub.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator Header */}
        {!success && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pt-1 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 1 ? "text-primary" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>1</span>
              <span>Chọn file</span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200"></div>
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 2 ? "text-primary" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>2</span>
              <span>Thông tin</span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200"></div>
            <div className={`flex items-center gap-1.5 font-semibold ${step >= 3 ? "text-primary" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
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
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Gửi tài liệu thành công</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tài liệu đã được đưa vào hàng đợi kiểm duyệt. Sau khi ban quản trị phê duyệt, tài liệu sẽ hiển thị công khai trên StudyHub.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-left">
            {/* STEP 1: Chọn file */}
            {step === 1 && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-700">Bước 1: Chọn file từ thiết bị</Label>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all">
                  <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-800">Nhấp để tải file lên hoặc kéo thả vào đây</span>
                  <span className="text-[11px] text-slate-400 mt-1">Hỗ trợ file: PDF, DOCX, PPTX (tối đa 25MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

            {/* STEP 2: Điền thông tin */}
            {step === 2 && (
              <div className="space-y-3">
                {file && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <span className="font-semibold text-emerald-900 truncate max-w-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-emerald-700 hover:underline font-medium text-[11px]"
                    >
                      Đổi file
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="upload-title" className="text-xs font-semibold text-slate-700">
                    Tiêu đề tài liệu *
                  </Label>
                  <Input
                    id="upload-title"
                    placeholder="Ví dụ: Đề cương ôn tập Giải tích 1 kỳ 2024.2 có đáp án..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="upload-subject" className="text-xs font-semibold text-slate-700">
                      Học phần / Môn học *
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

                  <div className="space-y-1">
                    <Label htmlFor="upload-type" className="text-xs font-semibold text-slate-700">
                      Dạng tài liệu
                    </Label>
                    <select
                      id="upload-type"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="Đề thi">Đề thi / Kiểm tra</option>
                      <option value="Đề cương">Đề cương ôn tập</option>
                      <option value="Giáo trình">Giáo trình / Slide</option>
                      <option value="Bài tập lớn">Bài tập lớn / Đồ án</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="upload-desc" className="text-xs font-semibold text-slate-700">
                    Mô tả ngắn gọn (tùy chọn)
                  </Label>
                  <textarea
                    id="upload-desc"
                    rows={2}
                    placeholder="Tóm tắt nội dung chính của tài liệu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Xác nhận gửi kiểm duyệt */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Xem lại thông tin đăng tải</h5>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiêu đề:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-xs truncate">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Môn học:</span>
                    <span className="font-semibold text-slate-800">{subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phân loại:</span>
                    <span className="font-semibold text-slate-800">{docType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tên file:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-xs">{file?.name}</span>
                  </div>
                </div>

                {/* Moderation Policy Notice */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Quy trình kiểm duyệt:</strong> Tài liệu sẽ được ban quản trị kiểm tra tính chính xác và tuân thủ quy định trước khi hiển thị công khai trên hệ thống.
                  </p>
                </div>
              </div>
            )}

            {/* Dialog Action Buttons */}
            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {step > 1 ? (
                <Button type="button" variant="outline" size="sm" onClick={handlePrevStep} disabled={loading}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Quay lại
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                  Hủy
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary/90 text-white"
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
                  className="bg-primary hover:bg-primary/90 text-white font-semibold"
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
