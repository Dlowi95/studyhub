import { API_URL } from "@/lib/api";
import DocumentPreview from "@/components/DocumentPreview";
import { Button } from "@/components/ui/button";
import { interactionHeaders } from "@/lib/interaction";
import { ArrowLeft, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadDocument = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/documents/${id}`, {
          signal: controller.signal,
          headers: interactionHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Không tìm thấy tài liệu");
        setDocument({ ...data, id: data.id || data._id, type: data.fileType || data.type });
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message || "Không thể tải tài liệu");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadDocument();
    return () => controller.abort();
  }, [id]);

  return (
    <div className="mx-auto w-[min(96%,1100px)] space-y-5 py-8 sm:py-12">
      <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
        <Link to={document ? `/documents/${document.id}` : "/"}>
          <ArrowLeft size={16} />
          {document ? "Quay lại tài liệu" : "Về trang chủ"}
        </Link>
      </Button>

      <section className="paper-panel space-y-5 p-4 sm:p-7">
        <header className="flex min-w-0 items-start gap-3 border-b border-border pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">BẢN XEM AN TOÀN</p>
            <h1 className="mt-1 break-words text-lg font-extrabold text-foreground sm:text-2xl">
              {document?.title || (loading ? "Đang tải tài liệu…" : "Không mở được tài liệu")}
            </h1>
            {document && <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">{document.fileType || "Tài liệu"}</p>}
          </div>
        </header>

        {document && document.status !== "approved" && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
            <strong>{document.status === "rejected" ? "Bản riêng · Tài liệu bị từ chối" : "Bản riêng · Đang chờ kiểm duyệt"}</strong>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Chỉ chủ sở hữu mới mở được bản này. {document.moderationNote || "Tài liệu chưa được công khai."}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Đang chuẩn bị bản xem trước…</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center">
            <h2 className="font-bold text-destructive">Không thể mở tài liệu</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <DocumentPreview document={document} />
        )}
      </section>
    </div>
  );
}
