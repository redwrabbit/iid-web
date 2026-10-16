import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";
import { extAreas, hrAreas } from "@/content/services";

export const metadata: Metadata = {
  title: "자문 · 컨설팅 영역 · iid",
  description: "HR 자문 · 컨설팅 5개와 기타 · 확장 3개 영역.",
};

const TONES = ["black", "orange", "cream", "cream", "soft"];
const SPANS = ["s3", "s3", "s2", "s2", "s2"];

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
        <div className="wrap page-head">
          <h1 className="h1-sm">자문 · 컨설팅 영역</h1>
          <p className="lead">이런 고민을 해결하기 위해, 이드 컨설팅은 다음과 같은 자문/컨설팅 서비스를 제공합니다.</p>
        </div>
        <div className="wrap areas">
          {hrAreas.map((a, i) => (
            <article key={a.name} className={`at at--${TONES[i]} at--${SPANS[i]}`}>
              <p className="at__meta">{a.meta}</p>
              <h2>{a.name}</h2>
              <p>{a.desc}</p>
            </article>
          ))}
        </div>
        <div className="wrap ext">
          <div className="ext__band">
            <h2>기타 · 확장 <small>개별 논의</small></h2>
            <div className="ext__cols">
              {extAreas.map((a) => (
                <div key={a.name}>
                  <h3>{a.name}</h3>
                  <p>{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
