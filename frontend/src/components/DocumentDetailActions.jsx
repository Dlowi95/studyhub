import { Download, FileText, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentDetailActions({ doc, onDownload, onReport }) {
  if (!doc) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        type="button"
        onClick={() => onDownload?.(doc)}
        className="bg-primary hover:bg-primary/90 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Tải xuống
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => window.open(encodeURI(doc.fileUrl), "_blank", "noopener,noreferrer")}
      >
        <FileText className="w-4 h-4 mr-2" />
        Xem file
      </Button>

      <Button type="button" variant="secondary" onClick={() => onReport?.(doc)}>
        <MessageSquareWarning className="w-4 h-4 mr-2" />
        Báo cáo
      </Button>
    </div>
  );
}
