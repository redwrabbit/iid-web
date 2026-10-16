import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";

export const metadata: Metadata = {
  title: "서비스 플랜 · iid",
  description: "이드 컨설팅 서비스 플랜",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
          <div className="wrap section">
            <h1 className="h2">서비스 플랜 (예시)</h1>
            <p className="section__lead">조직의 규모·상황·니즈에 따라 맞춤형 패키지를 제공합니다. 모든 플랜은 기본 프레임워크를 기반으로 하되, 기업 상황에 맞게 조정됩니다. 제도 수립 등은 별도로 진행합니다.</p>
            <ul className="plan-cards">
              <li className="pc pc--s"><h3>Entry</h3><p className="pc__sub">가볍게 시작하는 온라인 HR 자문</p><p className="pc__meta">3개월</p><p>비대면 진행, 메신저 / 메일 등 자문 진행</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--s"><h3>Basic</h3><p className="pc__sub">정기 점검형 경영진 자문</p><p className="pc__meta">3개월</p><p>대면 미팅 월 1회, 메신저 / 메일 등 자문 진행</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--s"><h3>Standard</h3><p className="pc__sub">조직 운영 점검 기본형</p><p className="pc__meta">3개월</p><p>대면 미팅 월 2회, 메신저 / 메일 등 자문 진행</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--m"><h3>Professional</h3><p className="pc__sub">성장기 조직 맞춤형 HR 고도화</p><p className="pc__meta">3개월</p><p>대면 미팅 주 1회, 메신저 / 메일 등 자문 진행</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--l pc--dark"><h3>Fractional CHRO</h3><p className="pc__sub">전략적 의사결정 동반자</p><p className="pc__meta">3개월</p><p>파트타임 회사 출근: 업무 의사결정·처리 + 조직관리. 일자·시간에 따라 비용 별도 협의</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--half"><h3>교육 / 강의</h3><p className="pc__meta">1회</p><p>1.5시간 기준. 면접관, 평가, 리더십, 채용 등</p><p className="pc__price">별도 문의</p></li>
              <li className="pc pc--half"><h3>자문 연계 서비스</h3><p>재무·투자·브랜딩·마케팅 자문 필요 시 전문가 Pool에서 연계. 단가는 해당 전문가와 별도 협의</p><p className="pc__price">별도 문의</p></li>
            </ul>
          </div>
      </div>
      <SiteFooter />
    </div>
  );
}
