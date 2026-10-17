import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import { approach, concerns, cycle, experience } from "@/content/services";
import { getSiteData } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "자문/컨설팅 · iid",
  description: "이드 컨설팅이 함께하는 조직, 자문·컨설팅 서비스와 플랜, 이드 컨설팅의 차별성.",
};

function SecHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="sec-head">
      <h2 className="h2 h2--xl">{title}</h2>
      <p className="sec__lead">{lead}</p>
    </div>
  );
}

export default async function Page() {
  const { plans, hrAreas, extAreas } = await getSiteData();
  const mainPlans = plans.filter((p) => p.size !== "half");
  const addons = plans.filter((p) => p.size === "half");
  return (
    <div className="site-root site-page">
      <div className="panel">
        <div className="wrap page-head">
          <h1 className="h1-sm">자문 / 컨설팅</h1>
          <p className="lead">조직의 규모 · 상황 · 니즈에 맞춰 HR 자문과 컨설팅을 설계합니다. 궁금한 부분을 열어 보세요.</p>
          <nav className="anav" aria-label="이 페이지의 내용">
            <a href="#orgs">함께하는 조직</a>
            <a href="#services">서비스 · 플랜</a>
            <a href="#approach">차별성</a>
          </nav>
        </div>

        {/* 1. 함께하는 조직 */}
        <section id="orgs" className="wrap sec">
          <SecHead
            title="이드 컨설팅이 함께하는 조직"
            lead="조직 성장과 변화 과정에서 자주 마주치는 여섯 가지 상황입니다. 해당하는 상황을 열어 보세요."
          />
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

        {/* 2. 서비스 + 플랜 */}
        <section id="services" className="wrap sec">
          <SecHead
            title="자문 · 컨설팅 서비스"
            lead="위 상황을 풀기 위해, 이드 컨설팅은 다음과 같은 서비스와 플랜을 제공합니다."
          />

          <div className="exp">
            <p className="exp__label">경험과 전문 영역</p>
            <p className="exp__text">{experience.text}</p>
            <ul className="exp__chips">
              {experience.areas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <h3 className="sub">서비스 영역</h3>
          <div className="svc-grid">
            {hrAreas.map((a) => (
              <article key={a.name} className="sc">
                <p className="sc__meta">{a.meta}</p>
                <h4>{a.name}</h4>
                <p>{a.desc}</p>
              </article>
            ))}
            <article className="sc sc--ext">
              <p className="sc__meta">개별 논의</p>
              <h4>기타 · 확장</h4>
              <ul>
                {extAreas.map((a) => (
                  <li key={a.name}>
                    <b>{a.name}</b>
                    <span>{a.desc}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <h3 className="sub">서비스 플랜 (예시)</h3>
          <p className="sub__lead">
            조직의 규모 · 상황 · 니즈에 따라 맞춤형 패키지를 제공합니다. 모든 플랜은 기본 프레임워크를 기반으로 하되, 기업 상황에 맞게 조정됩니다. 제도 수립 등은 별도로 진행하며, 비용은 모두 별도 문의입니다.
          </p>
          <table className="ptable">
            <caption className="sr">서비스 플랜</caption>
            <thead>
              <tr>
                <th scope="col">플랜</th>
                <th scope="col">구성</th>
                <th scope="col">기간</th>
                <th scope="col">비용</th>
              </tr>
            </thead>
            <tbody>
              {mainPlans.map((p) => (
                <tr key={p.name} className={p.dark ? "is-key" : undefined}>
                  <th scope="row">
                    {p.name}
                    {p.sub && <small>{p.sub}</small>}
                  </th>
                  <td>{p.body}</td>
                  <td>{p.period}</td>
                  <td className="ptable__price">별도 문의</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="ptable ptable--add">
            <caption className="ptable__cap">추가 서비스</caption>
            <tbody>
              {addons.map((p) => (
                <tr key={p.name}>
                  <th scope="row">{p.name}</th>
                  <td>{p.body}</td>
                  <td>{p.period || "—"}</td>
                  <td className="ptable__price">별도 문의</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. 차별성 */}
        <section id="approach" className="wrap sec">
          <SecHead
            title="차별성"
            lead="이드 컨설팅은 정답을 제시하지 않습니다. 각 조직의 맥락에 맞는 방식으로, 현장에서 실제로 작동하는 구조를 설계합니다. 설득보다 구조 설계를 중시하며, 완벽함보다 실행 가능성을 우선합니다."
          />
          <h3 className="sub">프로젝트는 이렇게 진행됩니다</h3>
          <ol className="proc">
            {cycle.map((c, i) => (
              <li key={c}>
                <span className="proc__n" aria-hidden="true">{i + 1}</span>
                <b>{c}</b>
              </li>
            ))}
          </ol>
          <h3 className="sub">네 가지 원칙</h3>
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
        </section>

        <div className="wrap bento-foot">
          <p>상담 · 미팅 · 강연 문의는 <Link href="/ask">질문/상담</Link>에서 남겨주세요.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
