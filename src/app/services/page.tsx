import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "서비스 · iid",
  description: "이드 컨설팅이 함께하는 조직의 고민과 일하는 방식.",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <div className="panel">
          <div className="wrap page-head">
            <h1 className="h1-sm">서비스</h1>
            <p className="lead">이드 컨설팅이 함께하는 조직의 고민과 일하는 방식을 하나씩 살펴보세요.</p>
          </div>
          <div className="wrap svc-wrap">
            <ul className="svc-links">
              <li><Link href="/services/concerns"><span className="svc-links__t">이런 고민을 안고 계신가요</span><span className="svc-links__d">조직 성장과 변화 과정에서 누구나 겪는 6가지 상황</span><span className="svc-links__a" aria-hidden="true">→</span></Link></li>
              <li><Link href="/services/areas"><span className="svc-links__t">자문 · 컨설팅 영역</span><span className="svc-links__d">HR 자문 · 컨설팅 5개와 기타 · 확장 3개 영역</span><span className="svc-links__a" aria-hidden="true">→</span></Link></li>
              <li><Link href="/services/plans"><span className="svc-links__t">서비스 플랜</span><span className="svc-links__d">Entry부터 Fractional CHRO까지 맞춤형 패키지</span><span className="svc-links__a" aria-hidden="true">→</span></Link></li>
              <li><Link href="/services/ways"><span className="svc-links__t">일하는 방식</span><span className="svc-links__d">정답은 없고 맥락만 있다 · 4가지 원칙과 숫자로 보는 이드</span><span className="svc-links__a" aria-hidden="true">→</span></Link></li>
              <li><Link href="/services/about"><span className="svc-links__t">소개 · 이력</span><span className="svc-links__d">HR Problem Solver, 김동현(이드)과 거쳐온 회사들</span><span className="svc-links__a" aria-hidden="true">→</span></Link></li>
            </ul>
          </div>
      </div>
      <SiteFooter />
    </div>
  );
}
