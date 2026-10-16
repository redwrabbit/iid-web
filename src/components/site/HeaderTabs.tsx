"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", match: /^\/$/ },
  { href: "/services", label: "자문/컨설팅", match: /^\/services/ },
  { href: "/about", label: "이드 소개", match: /^\/about/ },
  { href: "/search", label: "HR 아티클/자료", match: /^\/(search|library)/ },
  { href: "/ask", label: "질문/상담", match: /^\/ask/ },
];

export default function HeaderTabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs" aria-label="주요 메뉴">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.match.test(pathname) ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
