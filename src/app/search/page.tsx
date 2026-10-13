"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { CATEGORY_LIST, makeSnippet, Post, SearchIndex } from "@/lib/search";
import { createClient } from "@/lib/supabase/client";
import SourceIcon from "@/components/SourceIcon";

export default function SearchPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
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

  const results = useMemo(() => {
    if (!posts || !index) return [];
    if (submitted) {
      return index.search(submitted, 30, category);
    }
    const pool = category === "전체" ? posts : posts.filter((p) => p.category === category);
    return [...pool]
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .map((post) => ({ post, score: 0, qTokens: [] as string[] }));
  }, [posts, index, submitted, category]);

  function runSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    setSubmitted(trimmed);
    if (trimmed && userId) {
      const supabase = createClient();
      supabase.from("search_logs").insert({ user_id: userId, query: trimmed }).then();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-[rgba(143,168,181,0.18)] bg-[#072431] px-4 sm:px-6 py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="mx-auto max-w-3xl flex gap-2"
        >
          <div className="flex-1 relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B7483]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이드의 글/영상에 대해 물어보세요… (예: 스톡옵션은 왜 나눠갖는 거라고 했나요?)"
              className="w-full border border-[rgba(143,168,181,0.25)] rounded-full pl-11 pr-5 py-3 text-sm bg-[#001621] text-[#F3EFE8] placeholder:text-[#5B7483] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
            />
          </div>
          <button
            type="submit"
            className="w-12 h-12 shrink-0 rounded-full bg-[#FF4103] text-[#140800] flex items-center justify-center"
            aria-label="검색"
          >
            <ArrowRight className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </form>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr] sm:grid-cols-[220px_1fr]">
        <aside className="border-r border-[rgba(143,168,181,0.18)] overflow-y-auto py-4">
          {CATEGORY_LIST.map((c) => {
            const count = c === "전체" ? posts?.length ?? 0 : categoryCounts.get(c) ?? 0;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setSubmitted("");
                  setQuery("");
                }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left border-l-2 ${
                  active
                    ? "border-l-[#FF4103] bg-[rgba(255,65,3,0.1)] text-[#FF6B3D] font-semibold"
                    : "border-l-transparent text-[#8FA8B5] hover:bg-[#0B2C3C] hover:text-[#D7E2E7]"
                }`}
              >
                <span>{c}</span>
                <span className="text-[11px] text-[#5B7483] tabular-nums">{count}</span>
              </button>
            );
          })}
        </aside>

        <div className="min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-3xl">
            {!posts ? (
              <p className="text-sm text-[#5B7483]">이드의 글을 불러오는 중…</p>
            ) : (
              <>
                <p className="text-xs text-[#5B7483] mb-4">
                  {submitted ? `"${submitted}" 검색 결과` : category} · {results.length}건
                </p>
                {results.length === 0 ? (
                  <p className="text-sm text-[#8FA8B5] p-2">관련된 글을 찾지 못했어요. 다른 단어로 다시 물어봐 주세요.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {results.map((r) => (
                      <li key={r.post.id} className="bg-[#072431] border border-[rgba(143,168,181,0.14)] rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-xs text-[#5B7483] mb-1.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#FF6B3D]">
                            {r.post.source}
                            <SourceIcon source={r.post.source} />
                          </span>
                          <span>·</span>
                          <span>{r.post.category}</span>
                          <span>·</span>
                          <span>{r.post.date}</span>
                        </div>
                        <a
                          href={r.post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-serif font-semibold text-[15px] text-[#F3EFE8] hover:text-[#FF6B3D] hover:underline"
                        >
                          {r.post.title}
                        </a>
                        <p
                          className="text-[13px] leading-relaxed text-[#8FA8B5] mt-1.5"
                          dangerouslySetInnerHTML={{
                            __html: r.qTokens.length ? makeSnippet(r.post, r.qTokens) : (r.post.text || "").slice(0, 110) + "…",
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
