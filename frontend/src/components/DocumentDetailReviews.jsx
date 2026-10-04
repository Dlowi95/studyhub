import { useState } from "react";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import { Star, UsersRound } from "lucide-react";

/**
 * Khu vực đánh giá (Review) cho trang chi tiết tài liệu.
 *
 * Props:
 * - documentId: string — _id của tài liệu (bắt buộc)
 * - avgRating: number — điểm trung bình hiện tại (để cập nhật real-time)
 * - onAvgRatingChange(newAvg): callback truyền lên DocumentDetailPage khi avgRating thay đổi
 */
export default function DocumentDetailReviews({ documentId, avgRating, onAvgRatingChange }) {
  // Mỗi lần tăng refreshKey, ReviewList sẽ tự fetch lại danh sách
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const handleReviewSuccess = (_review, newAvg) => {
    setReviewCount((count) => count + 1);
    // Làm mới danh sách
    setRefreshKey((k) => k + 1);
    // Cập nhật avgRating hiển thị local
    if (newAvg !== undefined) {
      onAvgRatingChange?.(newAvg);
    }
  };

  const handleAvgRatingChange = (newAvg) => {
    if (newAvg !== undefined) {
      onAvgRatingChange?.(newAvg);
    }
  };

  if (!documentId) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Tiêu đề khu vực đánh giá */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground ">Đánh giá tài liệu</h3>
        <span className="review-average-badge">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <strong>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</strong>
            <span>{reviewCount ? `${reviewCount} đánh giá` : "Chưa có đánh giá"}</span>
        </span>
      </div>

      {/* Form gửi đánh giá mới */}
      <div>
        <p className="review-section-kicker">
          <Star size={14} /> Gửi đánh giá của bạn
        </p>
        <ReviewForm documentId={documentId} onSuccess={handleReviewSuccess} />
      </div>

      {/* Danh sách đánh giá */}
      <div>
        <p className="review-section-kicker">
          <UsersRound size={14} /> Nhận xét từ cộng đồng
        </p>
        <ReviewList
          documentId={documentId}
          refreshKey={refreshKey}
          onAvgRatingChange={handleAvgRatingChange}
          onReviewCountChange={setReviewCount}
        />
      </div>
    </div>
  );
}
