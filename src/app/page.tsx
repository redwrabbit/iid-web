import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Problem Solver iid · 조직과 사람에 대한 의사결정을 도와줍니다",
  description: "이드(iid)의 HR 자문·컨설팅. 서비스, HR 아티클/자료, 질문/상담.",
};

const NEXT_STEPS = [
  { href: "/ask", label: "질문/문의" },
  { href: "/services", label: "서비스 소개" },
  { href: "/about", label: "이드 소개" },
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

const CONTACT_LINKS = [
  { href: "mailto:iid.solutor@gmail.com", label: "이메일", variant: "mail", icon: <MailIcon /> },
  { href: "https://www.instagram.com/iid_hrer", label: "Instagram", variant: "instagram", icon: <InstagramIcon /> },
  { href: "https://www.youtube.com/@iid_story", label: "YouTube", variant: "youtube", icon: <YoutubeIcon /> },
  {
    href: "https://brunch.co.kr/@iid-hr",
    label: "Brunch",
    variant: "brunch",
    icon: <Image src="/brunch-logo.png" alt="" width={46} height={46} />,
  },
  { href: "https://www.linkedin.com/in/shineastkim/", label: "LinkedIn", variant: "linkedin", icon: <LinkedinIcon /> },
];

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

        <div className="wrap home__bottom">
          <div className="home__bottom-col">
            <div className="home__next-grid" aria-label="어디서부터 시작할까요">
              {NEXT_STEPS.map((s) => (
                <Link key={s.href} href={s.href} className="home__next-item">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="home__bottom-col">
            <div className="home__contact" aria-label="연락하기">
              {CONTACT_LINKS.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener" : undefined}
                  aria-label={c.label}
                  className={`home__contact-item home__contact-item--${c.variant}`}
                >
                  {c.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
