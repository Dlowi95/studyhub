import { useState } from "react";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import { Star } from "lucide-react";

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
  const [localAvg, setLocalAvg] = useState(avgRating ?? 0);

  const handleReviewSuccess = (_review, newAvg) => {
    // Làm mới danh sách
    setRefreshKey((k) => k + 1);
    // Cập nhật avgRating hiển thị local
    if (newAvg !== undefined) {
      setLocalAvg(newAvg);
      onAvgRatingChange?.(newAvg);
    }
  };

  const handleAvgRatingChange = (newAvg) => {
    if (newAvg !== undefined) {
      setLocalAvg(newAvg);
      onAvgRatingChange?.(newAvg);
    }
  };

  if (!documentId) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
      {/* Tiêu đề khu vực đánh giá */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 className="text-base font-bold text-slate-900">Đánh giá tài liệu</h3>
        {localAvg > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {localAvg.toFixed(1)}
          </span>
        )}
      </div>

      {/* Form gửi đánh giá mới */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Gửi đánh giá của bạn
        </p>
        <ReviewForm documentId={documentId} onSuccess={handleReviewSuccess} />
      </div>

      {/* Danh sách đánh giá */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Đánh giá từ cộng đồng
        </p>
        <ReviewList
          documentId={documentId}
          refreshKey={refreshKey}
          onAvgRatingChange={handleAvgRatingChange}
        />
      </div>
    </div>
  );
}
