import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import CareerBoard from "@/components/site/CareerBoard";
import { companies } from "@/content/careers";

export const metadata: Metadata = {
  title: "이드 소개 · iid",
  description: "HR Problem Solver, 김동현(이드)의 소개와 이력.",
};

const groups = [
  {
    key: "enterprise",
    title: "대기업 주요 이력",
    summary: [
      "현대자동차그룹과 현대모비스에서 그룹사 단위 인사기획 및 글로벌 HR 제도 개선 프로젝트를 수행했습니다.",
      "특히 CEO 평가·육성, 글로벌 인사제도 설계, 해외 법인 HR 안정화 등 전사적 HR 의사결정 프로젝트를 수행했습니다.",
    ],
    items: companies.filter((c) => c.group === "enterprise"),
  },
  {
    key: "startup",
    title: "스타트업 주요 이력",
    summary: [
      "토스, 야놀자, 클래스101, 휴이노, 티오더 등에서 Series A~Pre-IPO 단계의 HR을 총괄하며 채용, 조직 운영, 제도 설계, 구조조정, 리더십 육성까지 스타트업 전 주기를 경험했습니다.",
      "특히 급성장기(10배 이상 규모 확장), 조직 재편, 성과관리 체계 구축, 투자/IPO 대응 등 성장과 위기 국면을 모두 아우르는 HR 의사결정 프로젝트를 리드했습니다.",
    ],
    items: companies.filter((c) => c.group === "startup"),
  },
];

export default function Page() {
  return (
    <div className="site-root site-page">
      <div className="panel panel--sub">
        <div className="wrap ab-top">
          <article className="ab ab--intro">
            <h1 className="h2">HR Problem Solver, 김동현(이드)입니다</h1>
            <p>
              저는 대기업과 스타트업을 오가며 채용부터 구조조정, M&amp;A까지 HR의 전 주기를 직접 경험했습니다. 저는 HR이 단순히 제도와 문서를 만드는 일이 아니라, 비즈니스와 사람 사이에서 실제로 작동하는 의사결정과 실행 구조를 설계하는 일이라고 믿습니다. 좋은 조직은 제도만으로 만들어지지 않습니다. 현장의 운영과 결정 순간에서 답이 만들어지고, 그 순간을 함께하는 것이 저의 역할입니다.
            </p>
          </article>
          <aside className="career-side" aria-label="약력">
            <ul className="career">
              <li><b>現</b> 티오더 HR Director</li>
              <li><b>前</b> 휴이노 HR 리드</li>
              <li><b>前</b> 클래스101 HR Head</li>
              <li><b>前</b> 야놀자 HRBP Team Lead</li>
              <li><b>前</b> 토스 People Operation Manager</li>
              <li><b>前</b> 현대자동차그룹 기획조정실 인사실</li>
              <li><b>前</b> 현대모비스 글로벌HR기획팀</li>
              <li className="muted">서울대학교 경영학과 졸업</li>
              <li className="muted">외부 자문: 글로벌창업사관학교 멘토링 (2025년)</li>
            </ul>
          </aside>
        </div>

        <section className="wrap sec">
          <div className="sec-head">
            <h2 className="h2 h2--xl">회사별 상세 이력</h2>
            <p className="sec__lead">회사를 누르면 맡았던 역할과 주요 업무가 팝업으로 열립니다.</p>
          </div>
          <CareerBoard groups={groups} />
        </section>

      </div>
      <SiteFooter />
    </div>
  );
}
