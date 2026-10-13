"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Info, Search, X } from "lucide-react";
import { CATEGORY_LIST, SUBCATEGORY_LIST, Post, SearchIndex } from "@/lib/search";
import { createClient } from "@/lib/supabase/client";
import SourceIcon from "@/components/SourceIcon";

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function formatDate(date: string) {
  const ymd = date.match(/^(\d{4})\.\s*(\d{1,2})\.\s*\d{1,2}\.?$/);
  if (ymd) return `${ymd[1]}년 ${parseInt(ymd[2], 10)}월`;
  const mdy = date.match(/^([A-Za-z]{3})\s+\d{1,2}\.\s*(\d{4})$/);
  if (mdy && MONTHS[mdy[1]]) return `${mdy[2]}년 ${MONTHS[mdy[1]]}월`;
  const y = (date.match(/\d{4}/) || [""])[0];
  return y ? `${y}년` : "";
}

function cleanTitle(title: string) {
  return title.replace(/#[^\s#]+/g, "").trim().replace(/\s{2,}/g, " ");
}

export default function SearchPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [subcategory, setSubcategory] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ post: Post; qTokens: string[] } | null>(null);

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

  const subs = category !== "전체" ? SUBCATEGORY_LIST[category] || [] : [];
  const showSubColumn = subs.length > 0;

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

      <div className={`flex-1 min-h-0 grid ${showSubColumn ? "grid-cols-[190px_190px_1fr]" : "grid-cols-[190px_1fr]"}`}>
        <aside className="border-r border-black/10 overflow-y-auto py-4">
          {CATEGORY_LIST.map((c) => {
            const count = c === "전체" ? posts?.length ?? 0 : categoryCounts.get(c) ?? 0;
            const active = category === c;
            return (
              <button
                key={c}
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
            );
          })}
        </aside>

        {showSubColumn && (
          <aside className="border-r border-black/10 overflow-y-auto py-4">
            <div className="px-4 pb-2 text-[11px] font-semibold text-[#B0B0B0] uppercase tracking-wide">{category}</div>
            <button
              type="button"
              onClick={() => {
                setSubcategory("");
                setSubmitted("");
                setQuery("");
              }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left border-l-2 ${
                subcategory === ""
                  ? "border-l-[#FF4103] bg-[rgba(255,65,3,0.08)] text-[#FF4103] font-semibold"
                  : "border-l-transparent text-[#555555] hover:bg-[#F4F4F2] hover:text-[#111111]"
              }`}
            >
              <span>전체</span>
              <span className="text-[11px] text-[#9A9A9A] tabular-nums">{categoryCounts.get(category) ?? 0}</span>
            </button>
            {subs.map((s) => {
              const sCount = subcategoryCounts.get(s) ?? 0;
              if (sCount === 0) return null;
              const sActive = subcategory === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubcategory(s);
                    setSubmitted("");
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left border-l-2 ${
                    sActive
                      ? "border-l-[#FF4103] bg-[rgba(255,65,3,0.08)] text-[#FF4103] font-semibold"
                      : "border-l-transparent text-[#555555] hover:bg-[#F4F4F2] hover:text-[#111111]"
                  }`}
                >
                  <span className="truncate">{s}</span>
                  <span className="text-[11px] text-[#9A9A9A] tabular-nums shrink-0">{sCount}</span>
                </button>
              );
            })}
          </aside>
        )}

        <div className="min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-3xl">
            {!posts ? (
              <p className="text-sm text-[#9A9A9A]">이드의 글을 불러오는 중…</p>
            ) : (
              <>
                <p className="text-xs text-[#9A9A9A] mb-4">
                  {submitted ? `"${submitted}" 검색 결과` : `${category}${subcategory ? " · " + subcategory : ""}`} · {results.length}건
                </p>
                {results.length === 0 ? (
                  <p className="text-sm text-[#555555] p-2">관련된 글을 찾지 못했어요. 다른 단어로 다시 물어봐 주세요.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-black/8 border-y border-black/8">
                    {results.map((r) => (
                      <li key={r.post.id} className="flex items-start gap-3 py-3.5">
                        <span className="shrink-0 pt-0.5">
                          <SourceIcon source={r.post.source} />
                        </span>
                        <span className="shrink-0 w-[72px] pt-0.5 text-xs text-[#9A9A9A] tabular-nums whitespace-nowrap">
                          {formatDate(r.post.date)}
                        </span>
                        <span className="flex-1 min-w-0 font-sans font-semibold text-[14.5px] leading-snug text-[#111111] line-clamp-2">
                          {cleanTitle(r.post.title)}
                        </span>
                        <div className="shrink-0 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSummary({ post: r.post, qTokens: r.qTokens })}
                            aria-label="요약 보기"
                            className="p-2.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
                          >
                            <Info className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <a
                            href={r.post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="원문으로 이동"
                            className="p-2.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
                          >
                            <ExternalLink className="w-5 h-5" strokeWidth={2} />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {summary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSummary(null)}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF4103]">
                <SourceIcon source={summary.post.source} />
                {summary.post.source} · {formatDate(summary.post.date)} · {summary.post.category}
              </span>
              <button
                type="button"
                onClick={() => setSummary(null)}
                aria-label="닫기"
                className="shrink-0 text-[#9A9A9A] hover:text-[#111111]"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <h3 className="font-sans font-bold text-[16px] text-[#111111] mb-3 leading-snug">
              {cleanTitle(summary.post.title)}
            </h3>
            <p className="text-xs font-semibold text-[#9A9A9A] mb-1">요약</p>
            <p className="text-[13.5px] leading-relaxed text-[#555555] whitespace-pre-line">
              {(summary.post.text || "").slice(0, 300)}…
            </p>
            <a
              href={summary.post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF4103] hover:underline"
            >
              원문 보러가기
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
