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
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"}
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
              "transition-colors",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
            aria-label={`${star} sao`}
          >
            <Star
              size={size}
              className={cn(
                filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
