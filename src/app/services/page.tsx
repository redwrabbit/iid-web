import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "자문/컨설팅 · iid",
  description: "이드 컨설팅이 함께하는 조직의 고민, 영역, 플랜, 일하는 방식.",
};

const AREA_WORDS = ["멘토링 / 코칭", "의사결정 자문", "강연 / 내부 교육", "구조조정", "제도 / 프로세스", "자문 연계", "PMI", "M&A DD"];
const LADDER = [
  { name: "Entry", how: "비대면" },
  { name: "Basic", how: "월 1회" },
  { name: "Standard", how: "월 2회" },
  { name: "Professional", how: "주 1회" },
  { name: "CHRO", how: "파트타임 출근" },
];
const CYCLE = ["진단", "구조 해석", "실행 설계", "운영 검증"];

export default function Page() {
  return (
    <div className="site-root site-page">
      <div className="panel">
        <div className="wrap page-head">
          <h1 className="h1-sm">자문/컨설팅</h1>
          <p className="lead">조직의 규모와 상황에 맞춰, 필요한 만큼만 함께합니다. 궁금한 영역부터 열어보세요.</p>
        </div>
        <div className="wrap bento">
          <Link href="/services/concerns" className="bt bt--black bt--w7">
            <span className="bt__k">이런 고민을 안고 계신가요</span>
            <span className="bt__big"><b>6</b>가지 상황</span>
            <span className="bt__d">조직은 커졌는데 운영은 더 무거워진 경우부터, 우리만의 운영 방식이 필요한 조직까지.</span>
            <span className="bt__go" aria-hidden="true">→</span>
          </Link>
          <Link href="/services/areas" className="bt bt--orange bt--w5">
            <span className="bt__k">자문 · 컨설팅 영역</span>
            <span className="bt__big"><b>8</b>개 영역</span>
            <span className="bt__chips">
              {AREA_WORDS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </span>
            <span className="bt__go" aria-hidden="true">→</span>
          </Link>
          <Link href="/services/plans" className="bt bt--cream bt--w5">
            <span className="bt__k">서비스 플랜</span>
            <span className="bt__ladder" aria-hidden="true">
              {LADDER.map((l, i) => (
                <span key={l.name} style={{ height: `${28 + i * 18}%` }}>
                  <i>{l.name}</i>
                </span>
              ))}
            </span>
            <span className="bt__d">{LADDER.map((l) => l.how).join(" → ")}</span>
            <span className="bt__go" aria-hidden="true">→</span>
          </Link>
          <Link href="/services/ways" className="bt bt--soft bt--w7">
            <span className="bt__k">일하는 방식</span>
            <span className="bt__big bt__big--sm">정답은 없고, 맥락만 있다</span>
            <span className="bt__cycle" aria-label="진단, 구조 해석, 실행 설계, 운영 검증">
              {CYCLE.map((c, i) => (
                <span key={c}>
                  <b>{c}</b>
                  {i < CYCLE.length - 1 && <em aria-hidden="true">→</em>}
                </span>
              ))}
            </span>
            <span className="bt__go" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="wrap bento-foot">
          <p>상담 · 미팅 · 강연 문의는 <Link href="/ask">질문/상담</Link>에서 남겨주세요.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
