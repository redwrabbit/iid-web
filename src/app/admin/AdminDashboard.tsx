"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Users, History, FileUp, Trash2, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LIST, SUBCATEGORY_LIST } from "@/lib/search";

type Question = {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};
type SearchLog = { id: string; user_id: string; query: string; created_at: string };
type Profile = { id: string; email: string; name: string; company: string | null; role: string | null; created_at: string };
type Resource = {
  id: string;
  title: string;
  url: string | null;
  category: string;
  subcategory: string;
  content: string;
  created_at: string;
};

const RESOURCE_CATEGORIES = CATEGORY_LIST.filter((c) => c !== "전체");

function fmt(t: string) {
  return new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STOP = new Set(["이드", "뭐", "어떻게", "어떤", "왜", "하나요", "있나요", "인가요", "무엇", "대해", "관련"]);
function keywordCounts(texts: string[]) {
  const counts = new Map<string, number>();
  for (const t of texts) {
    const words = (t.match(/[가-힣a-zA-Z0-9]+/g) || []).filter((w) => w.length >= 2 && !STOP.has(w));
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
}

export default function AdminDashboard({
  initialQuestions,
  initialSearchLogs,
  profiles,
  initialResources,
}: {
  initialQuestions: Question[];
  initialSearchLogs: SearchLog[];
  profiles: Profile[];
  initialResources: Resource[];
}) {
  const [tab, setTab] = useState<"analytics" | "resources" | "members" | "logs">("analytics");
  const [questions] = useState(initialQuestions);
  const [resources, setResources] = useState(initialResources);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const pendingCount = questions.filter((q) => !q.answer).length;

  const topKeywords = useMemo(
    () => keywordCounts([...initialSearchLogs.map((l) => l.query), ...questions.map((q) => q.question)]),
    [initialSearchLogs, questions]
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex-1">
      <h1 className="text-xl font-bold mb-2 text-[#111111]">관리자 페이지</h1>

      <Link
        href="/ask"
        className="flex items-center justify-between gap-3 mb-5 bg-[rgba(255,65,3,0.06)] border border-[rgba(255,65,3,0.25)] rounded-xl px-4 py-3 hover:bg-[rgba(255,65,3,0.1)]"
      >
        <span className="text-sm font-semibold text-[#111111]">
          질문함은 이드에게 질문하기 탭에서 확인·답변해요
          {pendingCount > 0 && <span className="ml-2 text-[11px] font-bold text-white bg-[#FF4103] rounded-full px-2 py-0.5">답변 대기 {pendingCount}</span>}
        </span>
        <ArrowRight className="w-4 h-4 text-[#FF4103] shrink-0" strokeWidth={2.25} />
      </Link>

      <div className="flex gap-1 mb-5 border-b border-black/10">
        {[
          { k: "analytics", label: "질문 분석", Icon: BarChart3 },
          { k: "resources", label: "자료 추가", Icon: FileUp },
          { k: "members", label: "회원", Icon: Users },
          { k: "logs", label: "검색 로그", Icon: History },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-t-lg border border-b-0 ${
              tab === t.k ? "bg-[#FAFAF9] border-black/10 text-[#FF4103]" : "bg-transparent border-transparent text-[#9A9A9A]"
            }`}
          >
            <t.Icon className="w-4 h-4" strokeWidth={2.25} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (
        <div>
          <p className="text-sm text-[#6B6B6B] mb-3">
            총 검색 {initialSearchLogs.length}건 · 질문하기 {questions.length}건에서 추출한 자주 등장한 키워드예요.
          </p>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([w, c]) => (
              <span key={w} className="text-xs px-3 py-1.5 rounded-full bg-[#F4F4F2] text-[#333333] border border-black/8">
                {w} <span className="text-[#9A9A9A]">({c})</span>
              </span>
            ))}
            {topKeywords.length === 0 && <p className="text-sm text-[#9A9A9A]">아직 분석할 데이터가 없어요.</p>}
          </div>
        </div>
      )}

      {tab === "resources" && (
        <ResourcesTab
          resources={resources}
          onAdd={(r) => setResources((prev) => [r, ...prev])}
          onDelete={(id) => setResources((prev) => prev.filter((r) => r.id !== id))}
        />
      )}

      {tab === "members" && (
        <div className="flex flex-col gap-2">
          {profiles.length === 0 && <p className="text-sm text-[#9A9A9A]">아직 가입한 회원이 없어요.</p>}
          {profiles.map((p) => (
            <div key={p.id} className="bg-[#FAFAF9] border border-black/8 rounded-xl p-3.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-bold text-[#111111]">{p.name}</span>
                <span className="text-xs text-[#9A9A9A]">{fmt(p.created_at)} 가입</span>
              </div>
              <div className="text-xs text-[#6B6B6B] mt-1">
                {[p.email, p.company, p.role].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="flex flex-col gap-2">
          {initialSearchLogs.length === 0 && <p className="text-sm text-[#9A9A9A]">아직 검색 기록이 없어요.</p>}
          {initialSearchLogs.map((l) => {
            const p = profileMap.get(l.user_id);
            return (
              <div key={l.id} className="bg-[#FAFAF9] border border-black/8 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#333333]">{l.query}</span>
                </div>
                <div className="text-xs text-[#9A9A9A]">
                  {p?.name || "알 수 없음"} · {fmt(l.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResourcesTab({
  resources,
  onAdd,
  onDelete,
}: {
  resources: Resource[];
  onAdd: (r: Resource) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(RESOURCE_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subs = SUBCATEGORY_LIST[category] || [];

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setError("텍스트 파일(.txt, .md)만 읽어올 수 있어요. 다른 형식은 내용을 복사해서 붙여넣어 주세요.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setContent((reader.result as string) || "");
    reader.readAsText(file, "utf-8");
  }

  async function submit() {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용은 꼭 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from("resources")
      .insert({
        title: title.trim(),
        url: url.trim() || null,
        category,
        subcategory,
        content: content.trim(),
        created_by: userData.user?.id,
      })
      .select("id, title, url, category, subcategory, content, created_at")
      .single();
    setBusy(false);
    if (err || !data) {
      setError("저장하지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onAdd(data);
    setTitle("");
    setUrl("");
    setSubcategory("");
    setContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function remove(id: string) {
    if (!confirm("이 자료를 삭제할까요? HR 지식 검색에서도 바로 사라져요.")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("resources").delete().eq("id", id);
    if (err) {
      alert("삭제하지 못했어요: " + err.message);
      return;
    }
    onDelete(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#FAFAF9] border border-black/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-[#111111]">새 자료 추가</p>
        <p className="text-xs text-[#9A9A9A] -mt-1">
          여기서 추가한 자료는 바로 HR 지식 검색에 노출돼요. 링크만 남기거나, 본문 내용을 붙여넣거나 텍스트 파일(.txt, .md)을 불러와 검색되게 할 수 있어요.
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 *"
          className="border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="원문 링크 (선택)"
          className="border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            className="border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
          >
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {subs.length > 0 && (
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
            >
              <option value="">중분류 선택 안 함</option>
              {subs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="본문 내용 * (검색과 요약에 사용돼요)"
          rows={6}
          className="border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] resize-y focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#555555] cursor-pointer hover:text-[#FF4103]">
            <FileUp className="w-4 h-4" strokeWidth={2.25} />
            텍스트 파일 불러오기
            <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFile} className="hidden" />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="inline-flex items-center gap-1.5 bg-[#FF4103] text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            {busy ? "추가하는 중…" : "자료 추가"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-[#111111]">추가된 자료 ({resources.length})</p>
        {resources.length === 0 && <p className="text-sm text-[#9A9A9A]">아직 추가한 자료가 없어요.</p>}
        {resources.map((r) => (
          <div key={r.id} className="bg-[#FAFAF9] border border-black/8 rounded-xl p-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-bold text-[#111111]">{r.title}</span>
                <span className="text-[10.5px] text-[#9A9A9A] px-2 py-0.5 rounded-full bg-[#F4F4F2] border border-black/8">
                  {r.category}{r.subcategory ? ` · ${r.subcategory}` : ""}
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] line-clamp-2">{r.content}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF4103] hover:underline">
                  {r.url}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              aria-label="삭제"
              className="shrink-0 p-2 rounded-md text-[#9A9A9A] hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

