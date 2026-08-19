import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import StarRating from "./StarRating";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Form gửi đánh giá (sao + bình luận) cho 1 tài liệu.
 *
 * Props:
 * - documentId: string (bắt buộc)
 * - onSuccess(review, avgRating): callback khi tạo thành công, dùng để
 *   cập nhật lại avgRating hiển thị ở trang chi tiết và làm mới ReviewList.
 */
export default function ReviewForm({ documentId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Bạn cần{" "}
        <Link to="/login" className="font-medium text-primary underline underline-offset-2">
          đăng nhập
        </Link>{" "}
        để đánh giá tài liệu này.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast({
        variant: "destructive",
        title: "Chưa chọn số sao",
        description: "Vui lòng chọn từ 1 đến 5 sao trước khi gửi.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/documents/${documentId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast({
            variant: "destructive",
            title: "Không thể đánh giá",
            description: "Bạn đã đánh giá tài liệu này rồi.",
          });
        } else {
          throw new Error(data.message || "Gửi đánh giá thất bại");
        }
        return;
      }

      toast({ title: "Đã gửi đánh giá", description: "Cảm ơn bạn đã đóng góp ý kiến." });
      setRating(0);
      setComment("");
      onSuccess?.(data.review, data.avgRating);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div>
        <Label className="mb-1.5 block">Đánh giá của bạn</Label>
        <StarRating value={rating} onChange={setRating} interactive size={24} />
      </div>

      <div>
        <Label htmlFor="review-comment" className="mb-1.5 block">
          Bình luận <span className="text-muted-foreground">(không bắt buộc)</span>
        </Label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Tài liệu này giúp ích gì cho bạn?"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Gửi đánh giá
      </Button>
    </form>
  );
}