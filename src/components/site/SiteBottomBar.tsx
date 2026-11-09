import Image from "next/image";
import Link from "next/link";

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

// 흰 사각 배지 위에 파란 "in" 글자 — 참고 이미지의 링크드인 아이콘 그대로.
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="#ffffff" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-0.5" fill="#007BB6">
        in
      </text>
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

// 홈 화면 맨 아래와 똑같은 하단 바: 질문/문의·서비스·소개 바로가기 + 연락 아이콘.
// 사이트 전체(자문/컨설팅, 이드 소개, HR 아티클/자료 등)에서 공통으로 쓴다.
export default function SiteBottomBar() {
  return (
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
  );
}
