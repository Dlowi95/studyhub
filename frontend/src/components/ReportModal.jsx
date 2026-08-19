import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ReportModal({ isOpen, onClose, document: doc }) {
  const [reason, setReason] = useState("wrong_subject");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const reportReasons = [
    { value: "wrong_subject", label: "Sai học phần / môn học" },
    { value: "copyright", label: "Vi phạm bản quyền / Tài liệu cấm chia sẻ" },
    { value: "incorrect_content", label: "Nội dung sai lệch, đề thi lỗi đáp án" },
    { value: "poor_quality", label: "Chất lượng file kém, mờ, không đọc được" },
    { value: "other", label: "Lý do khác" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doc?.id && !doc?._id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setApiError("Bạn cần đăng nhập để gửi báo cáo.");
      return;
    }

    // Tìm nhãn tiếng Việt tương ứng với value đã chọn (bắt buộc khai báo TRƯỚC khi dùng bên dưới)
    const reasonLabel = reportReasons.find((r) => r.value === reason)?.label || reason;

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId: doc.id || doc._id,
          reason: details.trim() ? `${reasonLabel}: ${details.trim()}` : reasonLabel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gửi báo cáo thất bại");
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails("");
        setReason("wrong_subject");
        setApiError("");
        onClose();
      }, 1800);
    } catch (err) {
      setApiError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl border-slate-200 shadow-xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Báo cáo tài liệu vi phạm
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 line-clamp-1">
            Tài liệu: {doc?.title || "Không xác định"}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">Đã gửi báo cáo thành công</p>
            <p className="text-xs text-slate-500">Ban quản trị StudyHub sẽ kiểm duyệt và xử lý trong thời gian sớm nhất.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {apiError}
              </div>
            )}
            <div className="space-y-2 text-left">
              <Label className="text-xs font-semibold text-slate-700">Lý do báo cáo</Label>
              <div className="space-y-1.5">
                {reportReasons.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="report-details" className="text-xs font-semibold text-slate-700">
                Mô tả chi tiết (tùy chọn)
              </Label>
              <textarea
                id="report-details"
                rows={3}
                placeholder="Ghi rõ chi tiết lỗi hoặc trang tài liệu có vấn đề..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}