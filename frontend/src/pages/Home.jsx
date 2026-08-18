import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, UploadCloud, ShieldCheck } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import SubjectFilter from "@/components/SubjectFilter";
import ReportModal from "@/components/ReportModal";
import UploadModal from "@/components/UploadModal";

export default function Home({ onOpenAuth, user }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDocForReport, setActiveDocForReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const subjects = [
    "Tất cả",
    "Giải tích",
    "Đại số tuyến tính",
    "Triết học Mác-Lênin",
    "Cấu trúc dữ liệu",
    "Vật lý đại cương",
    "Kinh tế vĩ mô",
  ];

  const normalizeDocument = (doc) => ({
    id: doc._id || doc.id,
    title: doc.title || "Tài liệu chưa có tiêu đề",
    subject: doc.subjectName || doc.subjectId?.name || "Khác",
    downloads: doc.downloadCount || 0,
    rating: doc.avgRating || 4.8,
    type: (doc.fileType || "PDF").toString().toUpperCase(),
    uploader: doc.uploaderId?.name || "StudyHub",
    isVerified: doc.status === "approved",
    size: doc.fileName ? `${Math.max(1, Math.round((doc.fileSize || 2) / 1024 / 1024))} MB` : "2 MB",
    fileUrl: doc.fileUrl,
  });

  const fetchApprovedDocuments = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/documents?status=approved`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải tài liệu");
      }

      setDocuments(Array.isArray(data) ? data.map(normalizeDocument) : []);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchApprovedDocuments();
  }, []);

  const handleUploadClick = () => {
    if (!user) {
      onOpenAuth?.("login");
    } else {
      setUploadModalOpen(true);
    }
  };

  const handleReportClick = (doc) => {
    if (!user) {
      onOpenAuth?.("login");
    } else {
      setActiveDocForReport(doc);
      setReportModalOpen(true);
    }
  };

  const handleViewDoc = async (doc) => {
    if (!doc?.id) return;

    try {
      await fetch(`${apiUrl}/documents/${doc.id}/view`, { method: "POST" });
    } catch (e) {
      // ignore view counter failure
    }

    navigate(`/documents/${doc.id}`);
  };

  const handleNewUploadSuccess = (newDoc) => {
    setDocuments((prev) => [normalizeDocument(newDoc), ...prev]);
  };

  const filteredDocs = documents.filter((doc) => {
    const title = (doc.title || "").toLowerCase();
    const subject = (doc.subject || "").toLowerCase();
    const matchesSearch =
      title.includes(searchQuery.toLowerCase()) ||
      subject.includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || selectedSubject === "Tất cả" || subject.includes(selectedSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-14 px-6 rounded-3xl bg-gradient-to-b from-emerald-50/60 to-slate-50 border border-slate-200/80 shadow-xs relative overflow-hidden space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tài liệu học tập có kiểm duyệt</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-slate-900 leading-tight">
          Kho tài liệu học tập, học phần và đề thi chất lượng cao
        </h1>

        <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto">
          Tìm kiếm, tải về tài liệu và cùng nhau chia sẻ đề cương ôn thi từ sinh viên các trường đại học.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 pt-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Nhập tên môn học, học phần, đề thi (vd: Giải tích 1, Triết học...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-sm md:text-base bg-white shadow-sm border-slate-200 rounded-xl focus-visible:ring-primary"
            />
          </div>
          <Button className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold bg-primary text-white shadow-sm hover:bg-primary/90">
            Tìm kiếm
          </Button>
        </div>
      </section>

      {/* Subject Filter Section */}
      <section id="subjects">
        <SubjectFilter
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
        />
      </section>

      {/* Documents Grid Section */}
      <section id="featured" className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Tài liệu nổi bật
          </h2>
          <span className="text-xs md:text-sm text-slate-500 font-medium">
            Hiển thị {filteredDocs.length} tài liệu
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium text-sm">
              Không tìm thấy tài liệu phù hợp với từ khóa này
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("");
              }}
            >
              Xem tất cả tài liệu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onReport={handleReportClick}
                onView={handleViewDoc}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upload CTA Section */}
      <section className="p-8 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
            <span>Thư viện tài liệu mở StudyHub</span>
          </div>
          <h3 className="text-2xl font-bold">Bạn có tài liệu học tập hoặc đề thi?</h3>
          <p className="text-slate-300 text-sm max-w-lg">
            Đăng tải tài liệu của bạn để hỗ trợ sinh viên khác trong việc ôn tập và học tập hiệu quả.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUploadClick}
          className="shrink-0 px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4 text-emerald-700" />
          <span>Chia sẻ tài liệu ngay</span>
        </button>
      </section>

      {/* Reusable Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        document={activeDocForReport}
      />

      {/* Reusable Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleNewUploadSuccess}
      />
    </div>
  );
}
