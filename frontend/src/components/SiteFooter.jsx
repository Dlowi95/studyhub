import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import BrandMark from "./BrandMark";

export default function SiteFooter({ user, onUpload }) {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand"><Link to="/" aria-label="StudyHub — Trang chủ"><BrandMark /></Link><h2>Từ sinh viên,<br />cho sinh viên.</h2><p>Một nơi để chia sẻ học liệu, tìm đúng tài liệu<br className="hidden sm:block" /> và cùng nhau học tốt hơn.</p></div>
        <nav className="footer-links" aria-label="Khám phá StudyHub"><h2>KHÁM PHÁ</h2><Link to="/#featured">Thư viện học liệu</Link><Link to="/#subjects">Học phần</Link><button type="button" className="flex items-center gap-1" onClick={onUpload}>Đóng góp tài liệu<ArrowUpRight size={15} /></button></nav>
        <nav className="footer-links" aria-label="Thông tin và tài khoản"><h2>STUDYHUB & BẠN</h2><Link to="/#how-it-works">Cách hoạt động</Link><Link to="/#faq">Câu hỏi thường gặp</Link>{user && <Link to="/profile">Hồ sơ của tôi</Link>}{user && <Link to="/my-reports">Báo cáo của tôi</Link>}</nav>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} STUDYHUB</span><span><Heart size={13} /> Cùng học, cùng chia sẻ.</span><span>HỌC LIỆU MỞ · CÓ KIỂM DUYỆT</span></div>
    </footer>
  );
}
