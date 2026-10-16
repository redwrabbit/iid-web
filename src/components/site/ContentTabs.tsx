"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { POSTS } from "@/content/stats";
import { press, refs } from "@/content/library";

type Item = { href: string; id: string; title: string; desc: string };

const ITEMS: Item[] = [
  { href: "/search", id: "search", title: "글 · 영상", desc: `브런치 글과 유튜브 ${POSTS}편을 검색` },
  { href: "/library#cases", id: "cases", title: "케이스 · 자료", desc: `자문 레퍼런스 ${refs.length}곳, 자료 라이브러리` },
  { href: "/library#press", id: "press", title: "칼럼 · 강연 · 기사", desc: `언론과 행사에서 나눈 이야기 ${press.length}건` },
  { href: "/library#book", id: "book", title: "도서", desc: "『이드의 HR 모험기』와 출판사 서평" },
];

// HR 아티클/자료 안의 하위 메뉴. 설명이 함께 보이는 큰 탭 바.
export default function ContentTabs() {
  const pathname = usePathname();
  // 검색 화면에서는 항상 첫 탭, 라이브러리에서는 보이는 구역을 따라간다
  const [section, setSection] = useState<string>("cases");
  const active = pathname === "/search" ? "search" : section;

  useEffect(() => {
    if (pathname === "/search") return;
    const ids = ["cases", "press", "book"];
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean) as HTMLElement[];
    const root = document.querySelector("main");
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setSection(vis.target.id);
      },
      { root, rootMargin: "-20% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return (
    <nav className="ct" aria-label="HR 아티클/자료 하위 메뉴">
      <ul className="wrap ct__in">
        {ITEMS.map((it) => (
          <li key={it.id}>
            <Link href={it.href} aria-current={active === it.id ? "page" : undefined} onClick={() => it.id !== "search" && setSection(it.id)}>
              <span className="ct__t">{it.title}</span>
              <span className="ct__d">{it.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
