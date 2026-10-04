import { API_URL } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StarRating from "./StarRating";
import { CornerDownRight, Loader2, MessageCircle, Reply, Send, Trash2 } from "lucide-react";


function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Danh sách đánh giá của 1 tài liệu.
 *
 * Props:
 * - documentId: string (bắt buộc)
 * - refreshKey: any — đổi giá trị này (vd sau khi ReviewForm tạo review mới)
 *   để component tự fetch lại danh sách.
 * - onAvgRatingChange(avgRating): callback khi avgRating đổi (sau khi xoá).
 */
export default function ReviewList({ documentId, refreshKey, onAvgRatingChange, onReviewCountChange }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem("token");
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem("user") || "null"); } catch { /* Ignore an expired local session. */ }

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/documents/${documentId}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được đánh giá");
      const nextReviews = data.reviews || [];
      setReviews(nextReviews);
      onReviewCountChange?.(nextReviews.length);
    } catch (err) {
      setError(err.message || "Không tải được đánh giá");
    } finally {
      setLoading(false);
    }
  }, [documentId, onReviewCountChange]);

  useEffect(() => {
    queueMicrotask(() => void fetchReviews());
  }, [fetchReviews, refreshKey]);

  const handleDelete = async (reviewId) => {
    if (!token) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xoá đánh giá thất bại");

      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      onReviewCountChange?.(reviews.length - 1);
      onAvgRatingChange?.(data.avgRating);
      toast({ title: "Đã xoá đánh giá" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Không thể xoá",
        description: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleReply = async (event, review) => {
    event.preventDefault();
    if (!token) {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
      return;
    }
    const text = replyDraft.trim();
    if (!text || sendingReply) return;
    setSendingReply(true);
    try {
      const response = await fetch(`${API_URL}/reviews/${review._id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể gửi phản hồi");
      setReviews(previous => previous.map(item => item._id === review._id
        ? { ...item, replies: [...(item.replies || []), data.reply] }
        : item));
      setReplyDraft("");
      setReplyingId(null);
      toast({ title: "Đã gửi phản hồi" });
    } catch (err) {
      toast({ variant: "destructive", title: "Không thể gửi phản hồi", description: err.message });
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải đánh giá...
      </div>
    );
  }

  if (error) {
    return <p className="review-error-card" role="alert">{error}</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="review-empty-state">
        <span><MessageCircle size={19} /></span>
        <div><strong>Chưa có đánh giá nào</strong><p>Hãy là người đầu tiên chia sẻ cảm nhận về tài liệu này.</p></div>
      </div>
    );
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => {
        const isOwner = currentUser && String(review.userId?._id) === String(currentUser.id || currentUser._id);
        const isAdmin = currentUser?.role === "admin";
        const canDelete = isOwner || isAdmin;
        const replies = Array.isArray(review.replies) ? review.replies : [];

        return (
          <li id={`review-${review._id}`} key={review._id} className="review-card">
            <div className="review-card-header">
              <div className="review-author">
                <div className="review-avatar">
                  {review.userId?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <strong>{review.userId?.name || "Người dùng ẩn danh"}</strong>
                  <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                </div>
              </div>
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={deletingId !== null}
                  onClick={() => handleDelete(review._id)}
                  aria-label="Xoá đánh giá"
                >
                  {deletingId === review._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>

            <div className="review-card-rating">
              <StarRating value={review.rating} size={17} />
              <span>{review.rating}/5</span>
            </div>

            {review.comment ? <p className="review-comment">{review.comment}</p> : <p className="review-no-comment">Đã gửi điểm đánh giá, chưa có nhận xét kèm theo.</p>}

            {replies.length > 0 && <div className="review-replies" aria-label="Phản hồi nhận xét">
              {replies.map(reply => <article className="review-reply-item" key={reply._id}>
                <CornerDownRight size={16} aria-hidden="true" />
                <div className="review-reply-body">
                  <div className="review-reply-heading"><strong>{reply.userId?.name || "Thành viên"}</strong><time dateTime={reply.createdAt}>{formatDate(reply.createdAt)}</time></div>
                  {reply.replyToUserId?.name && <span className="review-replying-to">Trả lời {reply.replyToUserId.name}</span>}
                  <p>{reply.comment}</p>
                </div>
              </article>)}
            </div>}

            <div className="review-card-footer">
              <button type="button" className="review-reply-toggle" aria-expanded={replyingId === review._id}
                onClick={() => {
                  if (!token) { window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } })); return; }
                  setReplyDraft("");
                  setReplyingId(replyingId === review._id ? null : review._id);
                }}>
                {replyingId === review._id ? <MessageCircle size={16} /> : <Reply size={16} />}
                {replyingId === review._id ? "Đóng phản hồi" : `Trả lời${replies.length ? ` · ${replies.length}` : ""}`}
              </button>
            </div>

            {replyingId === review._id && <form className="review-reply-form" onSubmit={event => handleReply(event, review)}>
              <label htmlFor={`reply-${review._id}`}>Phản hồi {review.userId?.name || "nhận xét này"}</label>
              <textarea id={`reply-${review._id}`} value={replyDraft} maxLength={1000} rows={2} autoFocus
                disabled={sendingReply} placeholder="Viết phản hồi lịch sự..." onChange={event => setReplyDraft(event.target.value)} />
              <div className="review-reply-form-footer"><span>{replyDraft.length}/1.000</span>
                <Button type="submit" size="sm" disabled={sendingReply || !replyDraft.trim()} className="review-reply-submit">
                  {sendingReply ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Gửi phản hồi
                </Button>
              </div>
            </form>}
          </li>
        );
      })}
    </ul>
  );
}
