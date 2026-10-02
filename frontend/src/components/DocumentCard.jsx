import { AlertCircle, CheckCircle2, Download, FileText, Flag, Star } from 'lucide-react';

export default function DocumentCard({ doc, onReport, onView }) {
  if (!doc) return null;
  const verified = Boolean(doc.isVerified ?? doc.status === 'approved');
  const subject = doc.subject || doc.subjectName || 'Khác';
  const type = String(doc.type || doc.fileType || 'FILE').toUpperCase();
  const author = typeof doc.uploader === 'string' ? doc.uploader : doc.uploader?.name || 'Sinh viên StudyHub';
  const cover = type.includes('PDF') ? 'var(--pastel-pink)' : type.includes('DOC') ? 'var(--pastel-lavender)' : type.includes('XLS') ? 'var(--pastel-mint)' : 'var(--pastel-cream)';
  const open = () => { if (verified) onView?.(doc); };
  return (
    <article className="document-card">
      <button type="button" className="document-cover" style={{ '--cover-color': cover }} onClick={open} disabled={!verified} aria-label={verified ? `Xem tài liệu ${doc.title}` : `${doc.title} đang chờ duyệt`}>
        <span className="cover-format">{type}</span>
        {verified && <span className="cover-verified"><CheckCircle2 size={12} /> Đã duyệt</span>}
        <span className="cover-paper" aria-hidden="true"><FileText /><i /><i /><i /></span>
        <span className="cover-star" aria-hidden="true">✳</span><span className="cover-subject">{subject}</span>
      </button>
      <div className="document-card-body">
        <h3><button type="button" onClick={open} disabled={!verified}>{doc.title}</button></h3>
        <div className="document-author"><span aria-hidden="true">{author[0]?.toUpperCase()}</span><p>{author}</p></div>
        {doc.fileAvailable === false && <p className="document-file-warning" title={doc.fileIssue}><AlertCircle size={12} /> Tệp nguồn cần cập nhật</p>}
        <div className="document-card-meta"><div><span title="Điểm đánh giá"><Star size={13} />{Number(doc.rating || 0).toFixed(1)}</span><span title="Lượt tải"><Download size={13} /><strong className="document-download-count">{doc.downloads ?? 0}</strong></span></div><button type="button" onClick={() => onReport?.(doc)} aria-label={`Báo cáo tài liệu ${doc.title}`} title="Báo cáo vi phạm"><Flag size={13} /></button></div>
      </div>
    </article>
  );
}
