"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/", label: "Home", match: /^\/$/ },
  { href: "/services", label: "자문/컨설팅", match: /^\/services/ },
  { href: "/about", label: "이드 소개", match: /^\/about/ },
  { href: "/search", label: "HR 아티클/자료", match: /^\/(search|library)/ },
  { href: "/ask", label: "질문/상담", match: /^\/ask/ },
];

export default function HeaderTabs() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 경로가 바뀌면(탭 클릭으로 이동) 모바일 메뉴를 닫는다
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <nav className="tabs" aria-label="주요 메뉴">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.match.test(pathname) ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-toggle__bar" />
        <span className="nav-toggle__bar" />
        <span className="nav-toggle__bar" />
      </button>

      {open && (
        <nav id="mobile-nav" className="mnav" aria-label="주요 메뉴 (모바일)">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} aria-current={t.match.test(pathname) ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
