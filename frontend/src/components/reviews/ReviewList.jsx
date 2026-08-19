import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StarRating from "./StarRating";
import { Loader2, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

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
export default function ReviewList({ documentId, refreshKey, onAvgRatingChange }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/documents/${documentId}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được đánh giá");
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message || "Không tải được đánh giá");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchReviews();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải đánh giá...
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-sm text-destructive">{error}</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Chưa có đánh giá nào cho tài liệu này. Hãy là người đầu tiên!
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => {
        const isOwner = currentUser && review.userId?._id === currentUser.id;
        const isAdmin = currentUser?.role === "admin";
        const canDelete = isOwner || isAdmin;

        return (
          <li key={review._id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {review.userId?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {review.userId?.name || "Người dùng ẩn danh"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === review._id}
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

            <div className="mt-3">
              <StarRating value={review.rating} size={16} />
            </div>

            {review.comment && (
              <p className="mt-2 text-sm text-foreground">{review.comment}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}