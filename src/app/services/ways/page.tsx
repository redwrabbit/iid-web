import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";

export const metadata: Metadata = {
  title: "일하는 방식 · iid",
  description: "이드 컨설팅 일하는 방식",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
          <div className="band">
            <div className="wrap">
              <h1 className="h2 h2--inv">일하는 방식</h1>
              <p className="section__lead section__lead--inv">저희는 정답을 제시하지 않습니다. 각 조직의 맥락에 맞는 방식으로, 현장에서 실제로 작동하는 구조를 설계합니다. 설득보다 구조 설계를 중시하며, 완벽함보다 실행 가능성을 우선합니다.</p>
              <div className="ways">
                <section className="wc wc--5">
                  <h3>프로젝트 접근 방식</h3><p className="wc__sub">정답은 없고, 맥락만 있다</p>
                  <ul><li>정답은 없다, 맥락만 있을 뿐이다</li><li>문제는 현상이 아니라 구조에 있다</li><li>과정은 진단에서 운영 검증까지 이어져야 한다</li></ul>
                </section>
                <section className="wc wc--7">
                  <h3>철학과 가치관</h3><p className="wc__sub">설득보다 구조 설계</p>
                  <ul><li>HR은 설득이 아니라 설계다</li><li>채용은 성과 구조에 사람을 연결하는 일이다</li><li>구조조정은 감원이 아니라 남은 사람을 위한 재편이다</li><li>제도는 완벽함보다 실행 가능성이 우선이다</li></ul>
                </section>
                <section className="wc wc--7">
                  <h3>차별성</h3><p className="wc__sub">복제가 아닌 실행 가능한 해법</p>
                  <ul><li>복제된 모델이 아니라 맥락에 맞춘 설계다</li><li>실행 가능성이 없는 제도는 무의미하다</li><li>조직은 외부 도움 없이도 굴러가야 한다</li><li>HR은 비즈니스 언어로 말해야 한다</li></ul>
                </section>
                <section className="wc wc--5">
                  <h3>실제 운영 포인트</h3><p className="wc__sub">문제 정의와 실행 중심</p>
                  <ul><li>문제 정의가 해답을 결정한다</li><li>실행되지 않는 제도는 존재하지 않는 것과 같다</li><li>조율이 설계의 본질이다</li><li>단기와 장기의 균형 없이는 조직은 흔들린다</li></ul>
                </section>
              </div>
              <dl className="stats" aria-label="숫자로 보는 이드">
                <div><dt>글 · 영상</dt><dd><b>278</b>편</dd></div>
                <div><dt>칼럼 · 강연 · 기사</dt><dd><b>23</b>건</dd></div>
                <div><dt>자문 레퍼런스</dt><dd><b>7</b>곳</dd></div>
                <div><dt>자문 · 컨설팅 영역</dt><dd><b>8</b>개</dd></div>
              </dl>
            </div>
          </div>
      </div>
      <SiteFooter />
    </div>
  );
}
