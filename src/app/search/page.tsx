"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { CATEGORY_LIST, SUBCATEGORY_LIST, makeSnippet, Post, SearchIndex } from "@/lib/search";
import { createClient } from "@/lib/supabase/client";
import SourceIcon from "@/components/SourceIcon";

function year(date: string) {
  return (date.match(/\d{4}/) || [""])[0];
}

export default function SearchPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [subcategory, setSubcategory] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/corpus.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const index = useMemo(() => (posts ? new SearchIndex(posts) : null), [posts]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (posts || []).forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return counts;
  }, [posts]);

  const subcategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (posts || []).filter((p) => p.category === category).forEach((p) => counts.set(p.subcategory, (counts.get(p.subcategory) || 0) + 1));
    return counts;
  }, [posts, category]);

  const results = useMemo(() => {
    if (!posts || !index) return [];
    if (submitted) {
      return index.search(submitted, 30, category, subcategory);
    }
    let pool = category === "전체" ? posts : posts.filter((p) => p.category === category);
    if (subcategory) pool = pool.filter((p) => p.subcategory === subcategory);
    return [...pool]
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .map((post) => ({ post, score: 0, qTokens: [] as string[] }));
  }, [posts, index, submitted, category, subcategory]);

  function runSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    setSubmitted(trimmed);
    if (trimmed && userId) {
      const supabase = createClient();
      supabase.from("search_logs").insert({ user_id: userId, query: trimmed }).then();
    }
  }

  function selectCategory(c: string) {
    setCategory(c);
    setSubcategory("");
    setSubmitted("");
    setQuery("");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-black/10 bg-white px-4 sm:px-6 py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="mx-auto max-w-3xl flex gap-2"
        >
          <div className="flex-1 relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9A9A]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이드의 글/영상에 대해 물어보세요… (예: 스톡옵션은 왜 나눠갖는 거라고 했나요?)"
              className="w-full border border-black/15 rounded-full pl-11 pr-5 py-3 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
            />
          </div>
          <button
            type="submit"
            className="w-12 h-12 shrink-0 rounded-full bg-[#FF4103] text-white flex items-center justify-center"
            aria-label="검색"
          >
            <ArrowRight className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </form>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[210px_1fr] sm:grid-cols-[240px_1fr]">
        <aside className="border-r border-black/10 overflow-y-auto py-4">
          {CATEGORY_LIST.map((c) => {
            const count = c === "전체" ? posts?.length ?? 0 : categoryCounts.get(c) ?? 0;
            const active = category === c;
            const subs = SUBCATEGORY_LIST[c] || [];
            return (
              <div key={c}>
                <button
                  type="button"
                  onClick={() => selectCategory(c)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left border-l-2 ${
                    active
                      ? "border-l-[#FF4103] bg-[rgba(255,65,3,0.08)] text-[#FF4103] font-semibold"
                      : "border-l-transparent text-[#555555] hover:bg-[#F4F4F2] hover:text-[#111111]"
                  }`}
                >
                  <span>{c}</span>
                  <span className="text-[11px] text-[#9A9A9A] tabular-nums">{count}</span>
                </button>
                {active && c !== "전체" && subs.length > 0 && (
                  <div className="pb-1.5">
                    {subs.map((s) => {
                      const sCount = subcategoryCounts.get(s) ?? 0;
                      if (sCount === 0) return null;
                      const sActive = subcategory === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSubcategory(sActive ? "" : s);
                            setSubmitted("");
                            setQuery("");
                          }}
                          className={`w-full flex items-center justify-between gap-2 pl-8 pr-4 py-1.5 text-[12.5px] text-left ${
                            sActive ? "text-[#FF4103] font-semibold" : "text-[#8A8A8A] hover:text-[#111111]"
                          }`}
                        >
                          <span className="truncate">{s}</span>
                          <span className="text-[10.5px] text-[#B0B0B0] tabular-nums shrink-0">{sCount}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <div className="min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-3xl">
            {!posts ? (
              <p className="text-sm text-[#9A9A9A]">이드의 글을 불러오는 중…</p>
            ) : (
              <>
                <p className="text-xs text-[#9A9A9A] mb-4">
                  {submitted ? `"${submitted}" 검색 결과` : subcategory || category} · {results.length}건
                </p>
                {results.length === 0 ? (
                  <p className="text-sm text-[#555555] p-2">관련된 글을 찾지 못했어요. 다른 단어로 다시 물어봐 주세요.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-black/8 border-y border-black/8">
                    {results.map((r) => (
                      <li key={r.post.id} className="flex flex-wrap sm:flex-nowrap items-baseline gap-x-4 gap-y-1 py-3.5">
                        <span className="shrink-0 w-[68px] inline-flex items-center gap-1 text-xs font-semibold text-[#FF4103]">
                          <SourceIcon source={r.post.source} />
                          {r.post.source}
                        </span>
                        <span className="shrink-0 w-10 text-xs text-[#9A9A9A] tabular-nums">{year(r.post.date)}</span>
                        <a
                          href={r.post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 max-w-full sm:max-w-[260px] truncate font-serif font-semibold text-[14.5px] text-[#111111] hover:text-[#FF4103] hover:underline"
                        >
                          {r.post.title}
                        </a>
                        <p
                          className="flex-1 min-w-0 basis-full sm:basis-0 truncate text-[13px] text-[#6B6B6B]"
                          dangerouslySetInnerHTML={{
                            __html: r.qTokens.length ? makeSnippet(r.post, r.qTokens) : (r.post.text || "").slice(0, 90) + "…",
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
