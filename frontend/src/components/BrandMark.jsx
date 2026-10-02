import { BookOpen } from "lucide-react";

export default function BrandMark({ compact = false }) {
  return (
    <span className="brand-mark">
      <span className="brand-mark-icon"><BookOpen size={21} strokeWidth={2.3} /></span>
      {!compact && <span className="brand-wordmark">STUDYHUB<span className="brand-wordmark-dot">.</span></span>}
    </span>
  );
}
