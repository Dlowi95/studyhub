import { API_URL } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import StarRating from "./StarRating";
import { Loader2, MessageSquareText, Send, Sparkles, Star } from "lucide-react";


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
  const [error, setError] = useState("");
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="review-login-prompt">
        <span className="review-prompt-icon"><Star size={19} /></span>
        <p>Bạn cần{" "}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }))}
          className="font-medium text-primary underline underline-offset-2 cursor-pointer"
        >
          đăng nhập
        </button>{" "}
        để đánh giá và chia sẻ cảm nhận về tài liệu.</p>
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
    setError("");
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
          setError("Tài khoản của bạn đã đánh giá tài liệu này rồi.");
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
      setError(err.message || "Vui lòng thử lại sau.");
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
    <form onSubmit={handleSubmit} className="review-form">
      <div className="review-rating-block">
        <div className="review-field-heading">
          <span className="review-prompt-icon"><Star size={19} /></span>
          <div><Label>Đánh giá của bạn</Label><p>Chọn số sao phù hợp với trải nghiệm học tập của bạn.</p></div>
        </div>
        <div className="review-star-picker">
          <StarRating value={rating} onChange={setRating} interactive size={30} />
          <span className="review-rating-hint" aria-live="polite">{rating ? `${rating}/5 · ${['', 'Chưa tốt', 'Tạm ổn', 'Khá tốt', 'Rất tốt', 'Tuyệt vời'][rating]}` : 'Chạm để chọn số sao'}</span>
        </div>
      </div>

      <div className="review-comment-field">
        <Label htmlFor="review-comment"><MessageSquareText size={16} /> Viết nhận xét <span>(không bắt buộc)</span></Label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          disabled={loading}
          maxLength={1000}
          placeholder="Tài liệu này giúp ích gì cho bạn?"
          className="review-textarea"
        />
        <div className="review-character-count">{comment.length}/1.000 ký tự</div>
      </div>

      {error && <p role="alert" className="review-inline-error">{error}</p>}
      <div className="review-submit-row">
        <p><Sparkles size={15} /> Chia sẻ tử tế giúp mọi người chọn tài liệu phù hợp.</p>
        <Button type="submit" disabled={loading || rating < 1} className="review-submit-button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Gửi đánh giá
        </Button>
      </div>
    </form>
  );
}
