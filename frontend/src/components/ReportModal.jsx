import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReportModal({ isOpen, onClose, document: doc }) {
  const [reason, setReason] = useState("wrong_subject");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reportReasons = [
    { value: "wrong_subject", label: "Sai học phần / môn học" },
    { value: "copyright", label: "Vi phạm bản quyền / Tài liệu cấm chia sẻ" },
    { value: "incorrect_content", label: "Nội dung sai lệch, đề thi lỗi đáp án" },
    { value: "poor_quality", label: "Chất lượng file kém, mờ, không đọc được" },
    { value: "other", label: "Lý do khác" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails("");
      setReason("wrong_subject");
      onClose();
    }, 1200);
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
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
