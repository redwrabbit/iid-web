import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ContentTabs from "@/components/site/ContentTabs";
import { getSiteData } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "HR 아티클/자료 · iid",
  description: "자문 레퍼런스, 자료 라이브러리, 칼럼·강연·기사, 『이드의 HR 모험기』.",
};

function group<T>(rows: T[], key: (r: T) => string, order?: string[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const k = key(r);
    map.set(k, [...(map.get(k) || []), r]);
  });
  const keys = order ? order.filter((k) => map.has(k)) : [...map.keys()];
  return keys.map((k) => [k, map.get(k)!]);
}

export default async function LibraryPage() {
  const { libs, press, refs } = await getSiteData();
  const libGroups: [string, string[]][] = group(libs, ([g]) => g).map(([g, rows]) => [g, rows.map(([, t]) => t)]);
  const pressGroups = group(press, ([, kind]) => (kind === "칼럼" ? "칼럼" : kind === "강연" ? "강연" : "기사 · 인터뷰"), ["칼럼", "강연", "기사 · 인터뷰"]);
  return (
    <div className="site-root site-page">
      <div className="panel">
<div className="wrap page-head">
          <h1 className="h1-sm">HR 아티클 / 자료</h1>
          <p className="lead">이드가 쓰고 말한 글과 영상, 함께한 프로젝트, 정리해 둔 자료, 칼럼·강연·기사, 그리고 책을 한곳에 모았습니다.</p>
        </div>
        <ContentTabs />
        <section className="wrap sec" id="cases">
          <div className="sec-head">
            <h2 className="h2 h2--xl">케이스 · 자료</h2>
            <p className="sec__lead">이드가 실제로 다룬 문제와 정리해 둔 자료입니다. 스타트업부터 중소·중견기업까지, 채용·보상·노무·조직문화 등 HR 전 영역에서 실제 문제를 진단하고 해결한 사례입니다. 산업별 특성과 기업의 성장 단계에 맞춘 맞춤형 자문을 진행했습니다.</p>
          </div>
          <h3 className="sub">자문 레퍼런스</h3>
          <ul className="refs">
            {refs.map(([size, industry, area], i) => (
              <li key={i}>
                <b>{size} · {industry}</b>
                <span>{area}</span>
              </li>
            ))}
          </ul>
          <h3 className="sub">자료 라이브러리</h3>
          <p className="sub__lead">공개 자료 링크는 준비되는 대로 연결됩니다.</p>
          <div className="libs">
            {libGroups.map(([group, items]) => (
              <div key={group}>
                <h3>{group}</h3>
                <ul>
                  {items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <section className="wrap sec" id="press">
          <div className="sec-head">
            <h2 className="h2 h2--xl">칼럼 · 강연 · 기사</h2>
            <p className="sec__lead">스타트업부터 대기업까지, HR 의사결정의 현장에서 얻은 통찰을 글과 강연으로 나누어왔습니다. 제목을 누르면 원문으로 이동합니다.</p>
          </div>
          <div className="press">
            {pressGroups.map(([group, items]) => (
              <div key={group}>
                <h3>{group}</h3>
                <ul>
                  {items.map(([media, , title, url]) => (
                    <li key={url + title}>
                      <a className="pcard" href={url} target="_blank" rel="noopener">
                        <span className="media">{media}</span>
                        <span className="title">{title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <section className="wrap sec book" id="book">
          <div className="sec-head">
            <h2 className="h2 h2--xl">도서</h2>
            <p className="sec__lead">『이드의 HR 모험기』 — 출판사 서평</p>
          </div>
          <div className="review">
          <p>이 책은 HR을 설명하는 책이 아니다. 오히려 우리가 익숙하게 믿어온 HR에 대한 정의를 하나씩 해체해나가는 기록에 가깝다. 사람을 이해하는 일, 조직을 더 좋은 방향으로 이끄는 일이라는 말은 이 책 안에서 점차 힘을 잃는다. 대신 그 자리에 남는 것은 선택과 책임이다. 정답이 없는 상황 속에서 매번 결정을 내려야 하고, 그 결과를 끝까지 감당해야 하는 자리. 저자는 HR을 그렇게 정의한다.</p>
          <p>저자의 시선은 처음부터 끝까지 일관되게 냉정하다. 그러나 그 냉정함은 거리를 두기 위한 태도가 아니라, 너무 가까이에서 오래 들여다본 사람만이 가질 수 있는 체온을 품고 있다. 대기업과 스타트업이라는 서로 다른 구조를 오가며 조직이 성장하고 균열이 생기고 다시 봉합되는 과정을 통과해온 경험은 이 책의 문장 곳곳에 스며 있다. 그래서 이 책은 이론을 설명하지 않는다. 대신 실제로 작동했던 것과 끝내 무너졌던 것, 그리고 그 사이에서 겨우 버텨낸 선택들을 담담하게 풀어낸다. 특히 인상적인 지점은 HR을 ‘정치’에 비유하는 대목이다. 정치는 하나의 정답으로 수렴되지 않는 영역이며 끊임없이 변하는 상황 속에서 관계와 힘, 타이밍을 읽어야 하는 종합적인 행위다. 저자는 HR 역시 그러하다고 말한다. 이 정의는 단순한 비유를 넘어 HR이라는 직무를 완전히 다른 층위로 끌어올린다. 동시에 그 안에 포함된 피로와 모순 그리고 때로는 감당해야 하는 불합리까지도 숨기지 않는다. “일은 잘했는데 욕은 먹는다”는 문장은 그래서 이 책 전체를 관통하는 하나의 정서로 남는다.</p>
          <p>이 책의 또 다른 미덕은 ‘성공’에 대한 태도다. 우리는 흔히 성공한 기업의 조직문화와 HR 제도를 하나의 공식처럼 받아들이려 한다. 그러나 저자는 그 공식을 의심한다. 성공한 이유와 성공 이후에 정리된 서사는 다르며 많은 경우 우리는 결과를 원인으로 착각한다는 것이다. 이 지점에서 이 책은 단순한 HR 서적을 넘어 조직과 경영을 바라보는 시선 자체를 다시 점검하게 만든다. HR은 성공을 만드는 충분조건이 아니라 단지 하나의 필요조건일 뿐이라는 문장은 그 착각을 정확히 짚어낸다. 읽는 내내 느껴지는 것은 이 책이 어떤 해답을 제시하려 하지 않는다는 점이다. 대신 질문을 남긴다. 그리고 그 질문은 가볍지 않다. 왜 같은 제도가 어떤 조직에서는 실패하는가, 왜 HR은 늘 비판받으면서도 사라지지 않는가, 왜 우리는 옳은 선택보다 버틸 수 있는 선택을 하게 되는가. 이 질문들은 독자에게 판단을 요구하기보다, 스스로의 경험과 겹쳐보게 만든다. 그래서 이 책은 읽고 끝나는 책이 아니라, 읽은 이후에 더 오래 남는 책에 가깝다.</p>
          <p>이 책은 HR을 꿈꾸는 사람에게 친절하지 않다. 오히려 경고에 가깝다. 그러나 그 경고는 배척이 아니라, 선택 이전에 반드시 알아야 할 현실에 대한 안내다. 이미 HR을 하고 있는 사람에게는 자신의 언어를 발견하게 해주고 조직을 이끄는 사람에게는 자신이 믿어왔던 방식들을 다시 돌아보게 만드는 거울이 된다. 그리고 조직 안에서 일하는 모든 사람에게는, 내가 속한 조직이 어떤 논리로 움직이고 있는지를 이해하게 해주는 창이 된다.</p>
          </div>
          <a className="link" href="https://product.kyobobook.co.kr/detail/S000219799863" target="_blank" rel="noopener">교보문고에서 보기 →</a>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
