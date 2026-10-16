import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";

export const metadata: Metadata = {
  title: "자문 · 컨설팅 영역 · iid",
  description: "이드 컨설팅 자문 · 컨설팅 영역",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
          <div className="wrap section">
            <h1 className="h2">자문 · 컨설팅 영역</h1>
            <p className="section__lead">이런 고민을 해결하기 위해, 이드 컨설팅은 다음과 같은 서비스를 제공합니다.</p>
            <h3 className="h3">HR 자문 · 컨설팅</h3>
            <dl className="services">
              <div><dt>멘토링 / 코칭<span>3개월 단위</span></dt><dd>리더가 성과와 팀을 동시에 챙기지 못해 흔들릴 때, 개인·조직 맞춤형 멘토링과 코칭으로 성장 기반을 마련합니다.</dd></div>
              <div><dt>의사결정 자문 / 조언<span>3개월 단위</span></dt><dd>중요한 순간마다 대표가 혼자 판단해야 하는 부담을 덜고, 구조적·전략적 대안을 제시합니다.</dd></div>
              <div><dt>강연 / 내부 교육<span>1회</span></dt><dd>단발성 이벤트가 아니라, 실제 현장 문제를 다루는 맞춤 교육으로 인식과 실행력을 변화시킵니다.</dd></div>
              <div><dt>구조조정 컨설팅 / 운영<span>3개월 단위</span></dt><dd>위기 국면에서 감정적 충돌 없이 효율화를 진행할 수 있도록, 인력 정비와 리더십 재편을 전략적으로 설계합니다.</dd></div>
              <div><dt>제도 / 프로세스 컨설팅<span>3개월 단위</span></dt><dd>제도는 있는데도 현장에서 작동하지 않을 때, 채용·평가·보상·문화 전반을 실제 운영 가능한 구조로 정립합니다.</dd></div>
            </dl>
            <h3 className="h3">기타 · 확장 <small>개별 논의</small></h3>
            <dl className="services services--minor">
              <div><dt>다른 영역 자문 연계</dt><dd>HR만으로 해결이 어려운 이슈는 마케팅·브랜딩·재무 등 네트워크 전문가와 함께 풀어드립니다.</dd></div>
              <div><dt>PMI (Post-merger Integration)</dt><dd>인수합병 이후 조직·제도·문화가 따로 노는 상황에서, 통합과 정렬을 설계합니다.</dd></div>
              <div><dt>M&amp;A DD (Due Diligence)</dt><dd>투자·인수 전, 인사·조직 리스크를 미리 점검해 위험을 최소화합니다.</dd></div>
            </dl>
          </div>
      </div>
      <SiteFooter />
    </div>
  );
}
