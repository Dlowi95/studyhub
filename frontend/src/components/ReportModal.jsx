import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ReportModal({ isOpen, onClose, document: doc, onSuccess }) {
  const [reason, setReason] = useState("wrong_subject");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const reportReasons = [
    { value: "wrong_subject", label: "Sai học phần / môn học", desc: "Tài liệu được xếp nhầm môn học hoặc ngành đào tạo" },
    { value: "copyright", label: "Vi phạm bản quyền / Tài liệu cấm", desc: "Tài liệu thuộc sở hữu riêng hoặc bị cấm phát tán" },
    { value: "incorrect_content", label: "Nội dung sai lệch, đề thi lỗi đáp án", desc: "Nội dung không chính xác, gây nhầm lẫn khi ôn tập" },
    { value: "poor_quality", label: "Chất lượng file kém, mờ, không đọc được", desc: "File bị lỗi font, mờ nhòe hoặc mất trang" },
    { value: "spam", label: "Spam, quảng cáo thương mại hoặc lừa đảo", desc: "Tài liệu chứa đường link rác hoặc quảng cáo" },
    { value: "other", label: "Lý do khác", desc: "Các vấn đề vi phạm khác (cần ghi rõ chi tiết bên dưới)" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doc?.id && !doc?._id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setApiError("Bạn cần đăng nhập để gửi báo cáo vi phạm.");
      return;
    }

    if (reason === "other" && !details.trim()) {
      setApiError("Vui lòng ghi rõ mô tả chi tiết khi bạn chọn 'Lý do khác'.");
      return;
    }

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
          reason: details.trim() ? `${reasonLabel} — ${details.trim()}` : reasonLabel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gửi báo cáo thất bại");
      }

      onSuccess?.(doc.id || doc._id, data.report);
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
      <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl border-border bg-card text-foreground shadow-xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground ">
            Báo cáo tài liệu vi phạm
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            Tài liệu: {doc?.title || "Không xác định"}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-semibold text-foreground text-sm">Đã gửi báo cáo thành công</p>
            <p className="text-xs text-muted-foreground ">Ban quản trị StudyHub sẽ kiểm duyệt và xử lý trong thời gian sớm nhất.</p>
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
              <Label className="text-xs font-semibold text-foreground ">
                Lý do báo cáo vi phạm <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {reportReasons.map((item) => {
                  const isChecked = reason === item.value;
                  return (
                    <label
                      key={item.value}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border hover:bg-muted "
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={item.value}
                        checked={isChecked}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground ">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="report-details" className="text-xs font-semibold text-foreground ">
                Mô tả chi tiết (tùy chọn)
              </Label>
              <textarea
                id="report-details"
                rows={3}
                placeholder="Ghi rõ chi tiết lỗi hoặc trang tài liệu có vấn đề..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="border-border ">
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
