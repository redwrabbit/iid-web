"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_LIST, makeSnippet, Post, SearchIndex } from "@/lib/search";
import { createClient } from "@/lib/supabase/client";
import SourceIcon from "@/components/SourceIcon";

const EXAMPLES = [
  "스톡옵션은 왜 나눠주는 게 아니라 나눠갖는 거라고 했나요?",
  "수습 기간에 리더가 챙겨야 할 것은?",
  "이드라는 이름은 어떻게 만들어졌나요?",
  "조직문화를 직원만족도로 평가하면 왜 안 되나요?",
];

export default function SearchPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [submitted, setSubmitted] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const results = useMemo(() => {
    if (!index || !submitted) return [];
    return index.search(submitted, 10, category);
  }, [index, submitted, category]);

  function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmitted(trimmed);
    if (userId) {
      const supabase = createClient();
      supabase.from("search_logs").insert({ user_id: userId, query: trimmed }).then();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 flex-1 min-h-0 flex flex-col">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex gap-2 mb-4"
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이드의 글/영상에 대해 물어보세요… (예: 스톡옵션은 왜 나눠갖는 거라고 했나요?)"
            className="flex-1 border border-[#1B3A4B29] rounded-xl px-4 py-3 text-sm bg-[#FBF9F2] focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]"
          />
          <button
            type="submit"
            className="w-12 h-12 shrink-0 rounded-xl bg-[#1B3A4B] text-[#FBF9F2] flex items-center justify-center text-lg"
          >
            →
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_LIST.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                category === c
                  ? "bg-[#1B3A4B] text-[#FBF9F2] border-[#1B3A4B]"
                  : "bg-[#FBF9F2] text-[#5B6B72] border-[#1B3A4B29] hover:border-[#1B3A4B]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {!posts ? (
            <p className="text-sm text-[#8B968E]">이드의 글을 불러오는 중…</p>
          ) : !submitted ? (
            <div className="bg-[#FBF9F2] border border-[#1B3A4B14] rounded-2xl p-5">
              <p className="text-sm text-[#5B6B72] mb-3">이런 질문들을 예로 눌러볼 수 있어요.</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => runSearch(ex)}
                    className="text-xs px-3 py-2 rounded-full bg-[#F1EEE4] border border-[#1B3A4B14] hover:border-[#1B3A4B]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-[#5B6B72] p-2">관련된 글을 찾지 못했어요. 다른 단어로 다시 물어봐 주세요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((r) => (
                <li key={r.post.id} className="bg-[#FBF9F2] border border-[#1B3A4B14] rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs text-[#8B968E] mb-1.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#B8791E]">
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
                    className="font-serif font-semibold text-[15px] text-[#12262F] hover:text-[#1B3A4B] hover:underline"
                  >
                    {r.post.title}
                  </a>
                  <p
                    className="text-[13px] leading-relaxed text-[#5B6B72] mt-1.5"
                    dangerouslySetInnerHTML={{ __html: makeSnippet(r.post, r.qTokens) }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
