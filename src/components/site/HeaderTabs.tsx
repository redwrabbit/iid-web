"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/services", label: "서비스", match: /^\/services/ },
  { href: "/search", label: "이드 콘텐츠", match: /^\/(search|library)/ },
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
