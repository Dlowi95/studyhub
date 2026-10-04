import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sao đánh giá dùng chung.
 * - Chỉ đọc: <StarRating value={4} />
 * - Chọn được: <StarRating value={rating} onChange={setRating} interactive />
 */
export default function StarRating({
  value = 0,
  onChange,
  interactive = false,
  size = 18,
}) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1" role={interactive ? "group" : "img"}
      aria-label={interactive ? "Chọn số sao đánh giá" : `Đánh giá ${value} trên 5 sao`}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={cn(
              "star-rating-item transition-transform",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
            aria-label={`${star} sao`}
            aria-pressed={interactive ? star === Math.round(value) : undefined}
          >
            <Star
              size={size}
              className={cn(
                filled ? "fill-warning text-warning" : "fill-none text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
