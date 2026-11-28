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
            <h1>조직과 사람에 대한<br />의사결정을 <em>도와줍니다</em></h1>
            <p className="lead">이드 컨설팅은 그 머뭇거림을 실행으로 바꾸는 파트너입니다. 대기업부터 스타트업, 채용부터 구조조정과 M&amp;A까지 조직의 전 주기에 걸친 의사결정 현장을 경험해왔습니다.</p>
            <ul className="home__quotes">
              <li>“나 없어도 잘 굴러가게 만들고 싶은데…”</li>
              <li>“지금 뭘 바꿔야 할지 모르겠다. 감이 없다.”</li>
              <li>“운영은 하고 있는데… 잘하고 있는 걸까?”</li>
              <li>“잘 뽑은 것 같은데, 왜 자꾸 떠나는 걸까?”</li>
            </ul>
            <ul className="home__stats">
              <li><strong>14년</strong><span>HR 외길 경력</span></li>
              <li><strong>7곳</strong><span>대기업·스타트업 경험</span></li>
              <li><strong>전 주기</strong><span>채용·구조조정·M&amp;A</span></li>
            </ul>
          </div>
          <div className="home__side">
            <div className="home__author">
              <Image
                className="home__author-photo"
                src="/profile.jpg"
                alt="김동현(이드)"
                width={220}
                height={220}
                quality={100}
              />
              <div>
                <p className="home__author-name">김동현 · 이드</p>
                <p className="home__author-title">HR Problem Solver</p>
              </div>
            </div>
            <ul className="career home__career">
              <li className="muted">서울대학교 경영학과 졸업</li>
              <li><b>現</b> 티오더 HR Director</li>
              <li><b>前</b> 휴이노 HR 리드</li>
              <li><b>前</b> 클래스101 HR Head</li>
              <li><b>前</b> 야놀자 HRBP Team Lead</li>
              <li><b>前</b> 토스 People Operation Manager</li>
              <li><b>前</b> 현대자동차그룹 기획조정실 인사실</li>
              <li><b>前</b> 현대모비스 글로벌HR기획팀</li>
            </ul>
          </div>
        </div>

        <SiteBottomBar />
      </div>
    </div>
  );
}
