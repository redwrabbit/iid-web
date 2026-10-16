import Link from "next/link";

export default function SiteFooter() {
  return (
<footer id="contact" className="foot">
      <div className="wrap foot__in">
        <div>
          <h2 className="foot__h">연락처</h2>
          <p>상담 · 미팅 · 강연 문의는 <Link className="foot__qa" href="/ask">질문/상담</Link>에서 남겨주세요.</p>
        </div>
        <div className="foot__links">
          <a className="btn btn--inv" href="mailto:iid.solutor@gmail.com">iid.solutor@gmail.com</a>
        </div>
        <ul className="foot__social" aria-label="이드 채널">
          <li><a href="https://www.instagram.com/iid_hrer" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="https://www.youtube.com/@iid_story" target="_blank" rel="noopener">YouTube</a></li>
          <li><a href="https://brunch.co.kr/@iid-hr" target="_blank" rel="noopener">Brunch</a></li>
          <li><a href="https://www.linkedin.com/in/shineastkim/" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
      </div>
      <div className="wrap foot__copy">© iid. HR Problem Solver</div>
    </footer>
  );
}
