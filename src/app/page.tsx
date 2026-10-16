import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "HR Problem Solver iid · 조직과 사람에 대한 의사결정을 도와줍니다",
  description: "이드(iid)의 HR 자문·컨설팅. 서비스, 이드 콘텐츠, 질문/상담.",
};

export default function Home() {
  return (
    <div className="site-root site-flex">
      <div className="home">
        <div className="wrap home__grid">
          <div className="home__main">
            <p className="eyebrow">HR Problem Solver, 이드</p>
            <h1>조직과 사람에 대한<br />의사결정을 <em>도와줍니다</em></h1>
            <p className="lead">이드 컨설팅은 그 머뭇거림을 실행으로 바꾸는 파트너입니다. 대기업부터 스타트업, 채용부터 구조조정과 M&amp;A까지 조직의 전 주기에 걸친 의사결정 현장을 경험해왔습니다.</p>
          </div>
          <div className="home__side">
            <Image className="home__logo" src="/iid-character-cutout.png" alt="이드(iid) 캐릭터: 빨간 안경을 쓴 얼굴과 iid 말풍선" width={447} height={401} priority />
            <ul className="home__quotes">
            <li>“나 없어도 잘 굴러가게 만들고 싶은데…”</li>
            <li>“지금 뭘 바꿔야 할지 모르겠다. 감이 없다.”</li>
            <li>“운영은 하고 있는데… 잘하고 있는 걸까?”</li>
            <li>“잘 뽑은 것 같은데, 왜 자꾸 떠나는 걸까?”</li>
          </ul>
          </div>
        </div>
        <div className="wrap home__foot">
          <a href="mailto:iid.solutor@gmail.com">iid.solutor@gmail.com</a>
          <a href="https://www.instagram.com/iid_hrer" target="_blank" rel="noopener">Instagram</a>
          <a href="https://www.youtube.com/@iid_story" target="_blank" rel="noopener">YouTube</a>
          <a href="https://brunch.co.kr/@iid-hr" target="_blank" rel="noopener">Brunch</a>
          <a href="https://www.linkedin.com/in/shineastkim/" target="_blank" rel="noopener">LinkedIn</a>
        </div>
      </div>
    </div>
  );
}
