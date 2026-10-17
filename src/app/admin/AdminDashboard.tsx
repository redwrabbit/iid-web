"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, FileText, Users, History, FileUp, Trash2, Plus, ArrowRight, Pencil, Download, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RESOURCE_CATEGORIES } from "@/lib/resource-fields";
import { SUBCATEGORY_LIST } from "@/lib/search";
import type { SectionKey } from "@/lib/site-sections";
import SiteContentTab from "./SiteContentTab";

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
  summary: string;
  created_at: string;
};

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
  siteContent,
}: {
  initialQuestions: Question[];
  initialSearchLogs: SearchLog[];
  profiles: Profile[];
  initialResources: Resource[];
  siteContent: Partial<Record<SectionKey, unknown>>;
}) {
  const [tab, setTab] = useState<"analytics" | "resources" | "site" | "members" | "logs">("analytics");
  const [questions] = useState(initialQuestions);
  const [resources, setResources] = useState(initialResources);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const pendingCount = questions.filter((q) => !q.answer).length;
  const [now] = useState(() => Date.now());
  const recentJoined = profiles.filter((p) => now - new Date(p.created_at).getTime() < 7 * 86400000).length;

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: "전체 회원", value: profiles.length },
          { label: "최근 7일 가입", value: recentJoined },
          { label: "등록 자료", value: resources.length },
          { label: "답변 대기", value: pendingCount },
        ].map((c) => (
          <div key={c.label} className="bg-[#FAFAF9] border border-black/8 rounded-xl px-4 py-3">
            <div className="text-[11px] text-[#9A9A9A]">{c.label}</div>
            <div className="text-xl font-bold text-[#111111]">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 border-b border-black/10">
        {[
          { k: "analytics", label: "질문 분석", Icon: BarChart3 },
          { k: "resources", label: "자료 관리", Icon: FileUp },
          { k: "site", label: "사이트 콘텐츠", Icon: FileText },
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
          onUpdate={(r) => setResources((prev) => prev.map((x) => (x.id === r.id ? r : x)))}
        />
      )}

      {tab === "site" && <SiteContentTab stored={siteContent} />}

      {tab === "members" && <MembersTab profiles={profiles} />}

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

const INPUT =
  "border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]";

function csvCell(v: string | null) {
  const t = (v ?? "").replace(/"/g, '""');
  return `"${/^[=+\-@]/.test(t) ? "'" + t : t}"`;
}

function MembersTab({ profiles }: { profiles: Profile[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return profiles;
    return profiles.filter((p) => [p.name, p.email, p.company, p.role].some((v) => (v || "").toLowerCase().includes(k)));
  }, [profiles, q]);

  function exportCsv() {
    const rows = [["이름", "이메일", "회사", "직무", "가입일"], ...list.map((p) => [p.name, p.email, p.company, p.role, p.created_at.slice(0, 10)])];
    const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·이메일·회사·직무 검색" className={`${INPUT} w-full pl-9`} />
        </div>
        <span className="text-xs text-[#9A9A9A]">{list.length}명</span>
        <button
          type="button"
          onClick={exportCsv}
          disabled={list.length === 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold border border-black/15 rounded-lg px-3 py-2 text-[#333333] hover:text-[#FF4103] disabled:opacity-50"
        >
          <Download className="w-4 h-4" strokeWidth={2.25} />
          CSV 내보내기
        </button>
      </div>
      {list.length === 0 && <p className="text-sm text-[#9A9A9A]">{profiles.length === 0 ? "아직 가입한 회원이 없어요." : "검색 결과가 없어요."}</p>}
      {list.map((p) => (
        <div key={p.id} className="bg-[#FAFAF9] border border-black/8 rounded-xl p-3.5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span className="text-sm font-bold text-[#111111]">{p.name}</span>
            <span className="text-xs text-[#9A9A9A]">{fmt(p.created_at)} 가입</span>
          </div>
          <div className="text-xs text-[#6B6B6B] mt-1">{[p.email, p.company, p.role].filter(Boolean).join(" · ")}</div>
        </div>
      ))}
    </div>
  );
}

function CategoryFields({
  category,
  subcategory,
  onChange,
}: {
  category: string;
  subcategory: string;
  onChange: (c: string, s: string) => void;
}) {
  const subs = SUBCATEGORY_LIST[category] || [];
  return (
    <div className="flex gap-2 flex-wrap">
      <select value={category} onChange={(e) => onChange(e.target.value, "")} className={`${INPUT} flex-1 min-w-[140px]`} aria-label="분류">
        {RESOURCE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={subcategory}
        onChange={(e) => onChange(category, e.target.value)}
        disabled={subs.length === 0}
        className={`${INPUT} flex-1 min-w-[140px]`}
        aria-label="세부 분류"
      >
        <option value="">세부 분류 없음</option>
        {subs.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResourcesTab({
  resources,
  onAdd,
  onDelete,
  onUpdate,
}: {
  resources: Resource[];
  onAdd: (r: Resource) => void;
  onDelete: (id: string) => void;
  onUpdate: (r: Resource) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("기타");
  const [subcategory, setSubcategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Resource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const k = filter.trim().toLowerCase();
    return k ? resources.filter((r) => [r.title, r.category, r.url].some((v) => (v || "").toLowerCase().includes(k))) : resources;
  }, [resources, filter]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setError("워드(.docx) 또는 PDF 파일만 올릴 수 있어요.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function submit() {
    if (!url.trim() && !file) {
      setError("링크나 파일 중 하나는 올려주세요.");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    if (title.trim()) fd.set("title", title.trim());
    if (url.trim()) fd.set("url", url.trim());
    if (summary.trim()) fd.set("summary", summary.trim());
    fd.set("category", category);
    fd.set("subcategory", subcategory);
    if (file) fd.set("file", file);

    try {
      const res = await fetch("/api/admin/resources", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "분석에 실패했어요.");
      onAdd(json.resource);
      setTitle("");
      setUrl("");
      setSummary("");
      setCategory("기타");
      setSubcategory("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류예요.");
    } finally {
      setBusy(false);
    }
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
          링크나 워드/PDF 파일을 올리면 본문을 추출해 HR 지식 검색에 바로 추가해요. 제목을 비우면 문서 제목을 써요.
        </p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (선택)" className={INPUT} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="원문 링크 (예: https://...)" className={INPUT} />
        <p className="text-center text-xs text-[#B0B0B0]">또는</p>
        <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#555555] cursor-pointer hover:text-[#FF4103] border border-dashed border-black/20 rounded-lg px-3 py-2.5 justify-center">
          <FileUp className="w-4 h-4" strokeWidth={2.25} />
          {file ? file.name : "워드(.docx) 또는 PDF 파일 선택"}
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFile} className="hidden" />
        </label>
        <CategoryFields
          category={category}
          subcategory={subcategory}
          onChange={(c, sub) => {
            setCategory(c);
            setSubcategory(sub);
          }}
        />
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="요약 (선택)" className={`${INPUT} resize-none`} />
        <div className="flex items-center justify-end gap-3 flex-wrap">
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-[#111111]">추가된 자료 ({resources.length})</p>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="제목·분류·링크 검색" className={`${INPUT} w-56`} />
        </div>
        {shown.length === 0 && <p className="text-sm text-[#9A9A9A]">{resources.length === 0 ? "아직 추가한 자료가 없어요." : "검색 결과가 없어요."}</p>}
        {shown.map((r) => (
          <div key={r.id} className="bg-[#FAFAF9] border border-black/8 rounded-xl p-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-bold text-[#111111]">{r.title}</span>
                <span className="text-[10.5px] text-[#9A9A9A] px-2 py-0.5 rounded-full bg-[#F4F4F2] border border-black/8">
                  {r.category}
                  {r.subcategory ? ` · ${r.subcategory}` : ""}
                </span>
                {!r.summary && (
                  <span className="text-[10.5px] font-bold text-[#FF4103] px-2 py-0.5 rounded-full bg-[rgba(255,65,3,0.08)] border border-[rgba(255,65,3,0.25)]">
                    요약 없음
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B] line-clamp-2">{r.summary || r.content}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF4103] hover:underline break-all">
                  {r.url}
                </a>
              )}
            </div>
            <div className="shrink-0 flex">
              <button
                type="button"
                onClick={() => setEditing(r)}
                aria-label="편집"
                className="p-2 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
              >
                <Pencil className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="삭제"
                className="p-2 rounded-md text-[#9A9A9A] hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditDialog
          key={editing.id}
          resource={editing}
          onClose={() => setEditing(null)}
          onSaved={(r) => {
            onUpdate(r);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ resource, onClose, onSaved }: { resource: Resource; onClose: () => void; onSaved: (r: Resource) => void }) {
  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url || "");
  const [summary, setSummary] = useState(resource.summary);
  const [content, setContent] = useState(resource.content);
  const [category, setCategory] = useState(resource.category);
  const [subcategory, setSubcategory] = useState(resource.subcategory);
  const [file, setFile] = useState<File | null>(null);
  const [reextract, setReextract] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!title.trim()) {
      setError("제목은 비워둘 수 없어요.");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("url", url.trim());
    fd.set("summary", summary);
    fd.set("category", category);
    fd.set("subcategory", subcategory);
    if (file) fd.set("file", file);
    else if (reextract) fd.set("reextract", "1");
    else fd.set("content", content);
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, { method: "PATCH", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장하지 못했어요.");
      onSaved(json.resource);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류예요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="자료 편집"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-[#111111]">자료 편집</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1.5 text-[#9A9A9A] hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={INPUT} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="원문 링크" className={INPUT} />
        <CategoryFields
          category={category}
          subcategory={subcategory}
          onChange={(c, sub) => {
            setCategory(c);
            setSubcategory(sub);
          }}
        />
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="요약" className={`${INPUT} resize-none`} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          disabled={!!file || reextract}
          placeholder="본문 (검색에 쓰여요)"
          className={`${INPUT} resize-y disabled:opacity-50`}
        />
        <div className="flex flex-col gap-2 text-xs text-[#6B6B6B]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={reextract} disabled={!!file} onChange={(e) => setReextract(e.target.checked)} />
            링크에서 본문 다시 가져오기
          </label>
          <label className="inline-flex items-center gap-2">
            파일 교체:
            <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-black/15 text-[#555555]">
            취소
          </button>
          <button type="button" disabled={busy} onClick={save} className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#FF4103] text-white disabled:opacity-60">
            {busy ? "저장하는 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
