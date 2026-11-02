import type { Metadata } from "next";
import Image from "next/image";
import SiteBottomBar from "@/components/site/SiteBottomBar";

export const metadata: Metadata = {
  title: "HR Problem Solver iid · 조직과 사람에 대한 의사결정을 도와줍니다",
  description: "이드(iid)의 HR 자문·컨설팅. 서비스, HR 아티클/자료, 질문/상담.",
};

export default function Home() {
  return (
    <div className="site-root site-flex">
      <div className="home">
        <div className="wrap home__grid">
          <div className="home__main">
            <h1>조직과 사람에<br />대한 의사결정을<br /><em>도와줍니다</em></h1>
            <p className="lead">이드 컨설팅은 그 머뭇거림을 실행으로 바꾸는 파트너입니다. 대기업부터 스타트업, 채용부터 구조조정과 M&amp;A까지 조직의 전 주기에 걸친 의사결정 현장을 경험해왔습니다.</p>
            <p className="home__credit">현 티오더 HR Director · 전 토스 · 야놀자 · 클래스101 · 휴이노</p>
          </div>
          <div className="home__side">
            <div className="home__id">
              <Image className="home__mark" src="/iid-character.png" alt="이드(iid) 캐릭터" width={600} height={600} priority />
              <span className="home__brand">HR Problem Solver</span>
            </div>
            <ul className="home__quotes">
            <li>“나 없어도 잘 굴러가게 만들고 싶은데…”</li>
            <li>“지금 뭘 바꿔야 할지 모르겠다. 감이 없다.”</li>
            <li>“운영은 하고 있는데… 잘하고 있는 걸까?”</li>
            <li>“잘 뽑은 것 같은데, 왜 자꾸 떠나는 걸까?”</li>
          </ul>
          </div>
        </div>

        <SiteBottomBar />
      </div>
    </div>
  );
}
