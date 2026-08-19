import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DocumentCard from "@/components/DocumentCard";
import DocumentDetailActions from "@/components/DocumentDetailActions";
import DocumentDetailHeader from "@/components/DocumentDetailHeader";
import DocumentDetailMeta from "@/components/DocumentDetailMeta";
import DocumentDetailReviews from "@/components/DocumentDetailReviews";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const normalizeDocument = (doc) => ({
  id: doc._id || doc.id,
  title: doc.title || "Tài liệu chưa có tiêu đề",
  subject: doc.subjectName || doc.subjectId?.name || "Khác",
  subjectName: doc.subjectName || doc.subjectId?.name || "Khác",
  downloads: doc.downloadCount || 0,
  rating: doc.avgRating || 0,
  type: (doc.fileType || "PDF").toString().toUpperCase(),
  uploader: doc.uploaderId?.name || "StudyHub",
  isVerified: doc.status === "approved",
  size: doc.fileName ? `${Math.max(1, Math.round((doc.fileSize || 2) / 1024 / 1024))} MB` : "2 MB",
  fileUrl: doc.fileUrl,
  description: doc.description || "",
  status: doc.status,
  tags: doc.tags || [],
  createdAt: doc.createdAt,
  viewCount: doc.viewCount || 0,
  downloadCount: doc.downloadCount || 0,
  avgRating: doc.avgRating || 0,
  uploaderId: doc.uploaderId,
});

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avgRating, setAvgRating] = useState(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetDoc, setReportTargetDoc] = useState(null);

  const openReportModal = (targetDoc) => {
    setReportTargetDoc(targetDoc);
    setReportModalOpen(true);
  };
  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTargetDoc(null);
  };

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const detailRes = await fetch(`${apiUrl}/documents/${id}`);
        const detailData = await detailRes.json();

        if (!detailRes.ok) {
          throw new Error(detailData.message || "Không tìm thấy tài liệu");
        }

        const normalizedDoc = normalizeDocument(detailData);
        setDoc(normalizedDoc);
        setAvgRating(normalizedDoc.avgRating);

        if (normalizedDoc.subjectName) {
          const relatedRes = await fetch(
            `${apiUrl}/documents?status=approved&subject=${encodeURIComponent(normalizedDoc.subjectName)}`
          );

          const relatedData = await relatedRes.json();
if (relatedRes.ok && Array.isArray(relatedData.items)) {
  setRelatedDocs(
    relatedData.items
      .map(normalizeDocument)
      .filter((item) => item.id !== normalizedDoc.id)
      .slice(0, 3)
  );
}
        }
      } catch (err) {
        setError(err.message || "Không thể tải tài liệu");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  const handleDownload = async (docItem) => {
    if (!docItem?.fileUrl) return;

    const safeUrl = encodeURI(docItem.fileUrl);
    window.open(safeUrl, "_blank", "noopener,noreferrer");

    try {
      await fetch(`${apiUrl}/documents/${docItem.id}/download`, { method: "POST" });
    } catch (error) {
      // ignore network failure for counter update
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Đang tải tài liệu...
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-semibold text-red-700">Không thể tải tài liệu</p>
          <p className="mt-2 text-sm text-red-600">{error || "Tài liệu không tồn tại hoặc đã bị xóa."}</p>
          <Link to="/" className="mt-5 inline-block">
            <Button variant="outline">Quay lại trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            ← Quay lại trang chủ
          </Link>
        </div>

        <div className="mt-6 space-y-6">
          <DocumentDetailHeader doc={doc} />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mô tả</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {doc.description || "Tài liệu này chưa có mô tả chi tiết."}
            </p>
          </div>

          <DocumentDetailMeta doc={doc} />

          <DocumentDetailActions
            doc={doc}
            onDownload={handleDownload}
            onReport={openReportModal}
          />
        </div>
      </div>

      {/* Khu vực đánh giá */}
      <DocumentDetailReviews
        documentId={doc.id}
        avgRating={avgRating}
        onAvgRatingChange={(newAvg) => setAvgRating(newAvg)}
      />

      {relatedDocs.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Tài liệu cùng học phần</h2>
            <span className="text-sm text-slate-500">{relatedDocs.length} tài liệu</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedDocs.map((item) => (
              <DocumentCard
                key={item.id}
                doc={item}
                onView={(relatedDoc) => navigate(`/documents/${relatedDoc.id}`)}
                onReport={openReportModal}
              />
            ))}
          </div>
        </div>
      )}
      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        document={reportTargetDoc}
      />
    </div>
  );
}
