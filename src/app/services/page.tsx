import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import { approach, concerns, cycle, extAreas, hrAreas, plans } from "@/content/services";

export const metadata: Metadata = {
  title: "자문/컨설팅 · iid",
  description: "이드 컨설팅이 함께하는 조직, 자문·컨설팅 서비스, 서비스 플랜, 일하는 방식.",
};

const TONES = ["black", "orange", "cream", "cream", "soft"];
const SPANS = ["s3", "s3", "s2", "s2", "s2"];

export default function Page() {
  return (
    <div className="site-root site-page">
      <div className="panel">
        <div className="wrap page-head">
          <h1 className="h1-sm">자문 / 컨설팅</h1>
          <p className="lead">조직의 규모 · 상황 · 니즈에 맞춰 HR 자문과 컨설팅을 설계합니다. 궁금한 부분을 열어 보세요.</p>
          <nav className="anav" aria-label="이 페이지의 내용">
            <a href="#orgs">함께하는 조직</a>
            <a href="#services">서비스</a>
            <a href="#plans">플랜</a>
            <a href="#approach">일하는 방식</a>
          </nav>
        </div>

        {/* 1. 함께하는 조직 */}
        <section id="orgs" className="wrap sec">
          <h2 className="h2">이드 컨설팅이 함께하는 조직</h2>
          <p className="sec__lead">조직 성장과 변화 과정에서 자주 마주치는 여섯 가지 상황입니다. 해당하는 상황을 열어 보세요.</p>
          <div className="ob-grid">
            {concerns.map((c) => (
              <details key={c.title} className="ob" name="orgs">
                <summary>{c.title}</summary>
                <div className="ob__body">
                  <p className="ob__label">이런 신호가 나타납니다</p>
                  {c.items.map(([head, body]) => (
                    <div key={head} className="ob__item">
                      <h3>{head}</h3>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 2. 서비스 */}
        <section id="services" className="sec">
          <div className="wrap">
            <h2 className="h2">자문 · 컨설팅 서비스</h2>
            <p className="sec__lead">위 상황을 풀기 위해, 이드 컨설팅은 다음과 같은 서비스를 제공합니다.</p>
          </div>
          <div className="wrap areas">
            {hrAreas.map((a, i) => (
              <article key={a.name} className={`at at--${TONES[i]} at--${SPANS[i]}`}>
                <p className="at__meta">{a.meta}</p>
                <h3>{a.name}</h3>
                <p>{a.desc}</p>
              </article>
            ))}
          </div>
          <div className="wrap ext">
            <div className="ext__band">
              <h3>기타 · 확장 <small>개별 논의</small></h3>
              <div className="ext__cols">
                {extAreas.map((a) => (
                  <div key={a.name}>
                    <h4>{a.name}</h4>
                    <p>{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. 플랜 */}
        <section id="plans" className="wrap sec">
          <h2 className="h2">서비스 플랜 (예시)</h2>
          <p className="sec__lead">조직의 규모 · 상황 · 니즈에 따라 맞춤형 패키지를 제공합니다. 모든 플랜은 기본 프레임워크를 기반으로 하되, 기업 상황에 맞게 조정됩니다. 제도 수립 등은 별도로 진행하며, 비용은 모두 별도 문의입니다.</p>
          <ul className="plan-cards">
            {plans.map((p) => (
              <li key={p.name} className={`pc pc--${p.size}${p.dark ? " pc--dark" : ""}`}>
                <h3>{p.name}</h3>
                {p.sub && <p className="pc__sub">{p.sub}</p>}
                {p.period && <p className="pc__meta">{p.period}</p>}
                <p>{p.body}</p>
                <p className="pc__price">별도 문의</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. 일하는 방식 */}
        <section id="approach" className="band">
          <div className="wrap">
            <h2 className="h2 h2--inv">이드 컨설팅이 일하는 방식</h2>
            <p className="section__lead--inv sec__lead">
              위 자문 · 컨설팅은 아래 원칙과 순서로 진행됩니다. 이드 컨설팅은 정답을 제시하지 않습니다. 각 조직의 맥락에 맞는 방식으로, 현장에서 실제로 작동하는 구조를 설계합니다. 설득보다 구조 설계를 중시하며, 완벽함보다 실행 가능성을 우선합니다.
            </p>
            <h3 className="proc__title">프로젝트는 이렇게 진행됩니다</h3>
            <ol className="proc">
              {cycle.map((c, i) => (
                <li key={c}>
                  <span className="proc__n" aria-hidden="true">{i + 1}</span>
                  <b>{c}</b>
                </li>
              ))}
            </ol>
            <h3 className="proc__title">네 가지 원칙</h3>
            <div className="grp-grid">
              {approach.map((g) => (
                <div key={g.name} className="grp">
                  <h4>{g.name}</h4>
                  <p className="grp__tag">{g.tagline}</p>
                  {g.items.map((it) => (
                    <details key={it.title} className="ob ob--in" name={`grp-${g.name}`}>
                      <summary>{it.title}</summary>
                      <div className="ob__body">
                        <p>{it.body}</p>
                      </div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="wrap bento-foot">
          <p>상담 · 미팅 · 강연 문의는 <Link href="/ask">질문/상담</Link>에서 남겨주세요.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
