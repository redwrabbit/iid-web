"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/services", label: "자문/컨설팅 전체" },
  { href: "/services/concerns", label: "고민" },
  { href: "/services/areas", label: "컨설팅 영역" },
  { href: "/services/plans", label: "서비스 플랜" },
  { href: "/services/ways", label: "일하는 방식" },
];

export default function ServiceSubbar() {
  const pathname = usePathname();
  return (
    <nav className="subbar" aria-label="자문/컨설팅 하위 메뉴">
      <div className="wrap subbar__in">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={pathname === i.href ? "page" : undefined}>
            {i.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
