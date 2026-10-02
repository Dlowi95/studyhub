import { GraduationCap, Check, ArrowUpRight, FileText } from "lucide-react";

export default function StudyArtwork() {
  return (
    <div className="study-artwork" aria-hidden="true">
      <div className="artwork-blob" />
      <div className="artwork-square" />
      <div className="artwork-spark">✳</div>
      <div className="artwork-paper-back" />
      <div className="artwork-paper">
        <div className="artwork-paper-top"><FileText size={19} /><span>STUDY NOTES / 01</span><ArrowUpRight size={18} /></div>
        <div className="artwork-paper-title">Một chút kiến thức.<br />Một bước tiến xa.</div>
        <div className="artwork-lines"><span /><span /><span /></div>
        <div className="artwork-degree"><GraduationCap size={45} strokeWidth={1.6} /></div>
        <div className="artwork-paper-bottom"><span>CHIA SẺ ĐỂ CÙNG TIẾN BỘ</span><span>01</span></div>
      </div>
      <span className="artwork-sticker artwork-sticker-verified"><Check size={16} /> Đã kiểm duyệt</span>
      <span className="artwork-sticker artwork-sticker-preview"><FileText size={15} /> Xem trước tài liệu</span>
      <span className="artwork-handnote">học cùng nhau nhé!</span>
    </div>
  );
}
