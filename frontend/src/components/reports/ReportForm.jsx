import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const REASONS = [
  "Vi phạm bản quyền",
  "Nội dung sai lệch / không chính xác",
  "Spam hoặc quảng cáo",
  "Nội dung không phù hợp",
  "Khác",
];

/**
 * Dialog báo cáo vi phạm cho 1 tài liệu.
 *
 * Props:
 * - documentId: string (bắt buộc)
 * - onSuccess(report): callback khi gửi báo cáo thành công.
 * - trigger: element tuỳ chỉnh để mở dialog (mặc định là nút "Báo cáo").
 */
export default function ReportForm({ documentId, onSuccess, trigger }) {
  const [open, setOpen] = useState(false);
  const [reasonType, setReasonType] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem("token");
  const isOther = reasonType === "Khác";

  const resetForm = () => {
    setReasonType(REASONS[0]);
    setDetail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast({
        variant: "destructive",
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để gửi báo cáo.",
      });
      return;
    }

    if (isOther && !detail.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu chi tiết",
        description: "Vui lòng mô tả rõ lý do khi chọn 'Khác'.",
      });
      return;
    }

    const reason = detail.trim() ? `${reasonType} — ${detail.trim()}` : reasonType;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi báo cáo thất bại");

      toast({
        title: "Đã gửi báo cáo",
        description: "Cảm ơn bạn, đội ngũ quản trị sẽ xem xét sớm.",
      });
      resetForm();
      setOpen(false);
      onSuccess?.(data.report);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Không thể gửi báo cáo",
        description: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="mr-2 h-4 w-4" />
            Báo cáo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo cáo tài liệu vi phạm</DialogTitle>
          <DialogDescription>
            Cho chúng tôi biết vấn đề với tài liệu này. Quản trị viên sẽ xem xét và xử lý.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="report-reason" className="mb-1.5 block">
              Lý do
            </Label>
            <select
              id="report-reason"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="report-detail" className="mb-1.5 block">
              Chi tiết {isOther && <span className="text-destructive">*</span>}{" "}
              {!isOther && <span className="text-muted-foreground">(không bắt buộc)</span>}
            </Label>
            <textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}