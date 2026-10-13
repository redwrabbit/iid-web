"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
}: {
  initialQuestions: Question[];
  initialSearchLogs: SearchLog[];
  profiles: Profile[];
}) {
  const [tab, setTab] = useState<"inbox" | "analytics" | "members" | "logs">("inbox");
  const [questions, setQuestions] = useState(initialQuestions);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const pending = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  async function sendReply(id: string, text: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("questions")
      .update({ answer: text, answered_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, answer: text, answered_at: new Date().toISOString() } : q)));
    } else {
      alert("답변을 저장하지 못했어요: " + error.message);
    }
  }

  const topKeywords = useMemo(
    () => keywordCounts([...initialSearchLogs.map((l) => l.query), ...questions.map((q) => q.question)]),
    [initialSearchLogs, questions]
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex-1">
      <h1 className="text-xl font-bold mb-5 text-[#F3EFE8]">관리자 페이지</h1>

      <div className="flex gap-1 mb-5 border-b border-[rgba(143,168,181,0.18)]">
        {[
          { k: "inbox", label: `질문함${pending.length ? ` (${pending.length})` : ""}` },
          { k: "analytics", label: "질문 분석" },
          { k: "members", label: "회원" },
          { k: "logs", label: "검색 로그" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`text-sm font-semibold px-4 py-2.5 rounded-t-lg border border-b-0 ${
              tab === t.k ? "bg-[#072431] border-[rgba(143,168,181,0.18)] text-[#FF6B3D]" : "bg-transparent border-transparent text-[#5B7483]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <div className="flex flex-col gap-4">
          {questions.length === 0 && <p className="text-sm text-[#5B7483]">아직 들어온 질문이 없어요.</p>}
          {[...pending, ...answered].map((q) => {
            const p = profileMap.get(q.user_id);
            return (
              <div key={q.id} className="bg-[#072431] border border-[rgba(143,168,181,0.14)] rounded-xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-[#F3EFE8]">{p?.name || "알 수 없음"}{p?.company ? ` · ${p.company}` : ""}</span>
                  <span className="text-xs text-[#5B7483]">{p?.email}</span>
                </div>
                {!q.answer && (
                  <span className="inline-block text-[10.5px] font-bold text-[#140800] bg-[#FF4103] rounded-full px-2.5 py-0.5 mb-2">
                    답변 대기
                  </span>
                )}
                <div className="text-[11px] text-[#5B7483] mb-1">{fmt(q.created_at)}</div>
                <div className="text-sm mb-2 text-[#D7E2E7]">{q.question}</div>
                {q.answer ? (
                  <div className="bg-[rgba(52,211,153,0.1)] border border-[#34D399] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap text-[#F3EFE8]">
                    <div className="text-[10.5px] font-bold text-[#34D399] mb-1">보낸 답변 · {fmt(q.answered_at!)}</div>
                    {q.answer}
                  </div>
                ) : (
                  <ReplyBox onSend={(text) => sendReply(q.id, text)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <p className="text-sm text-[#8FA8B5] mb-3">
            총 검색 {initialSearchLogs.length}건 · 질문하기 {questions.length}건에서 추출한 자주 등장한 키워드예요.
          </p>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([w, c]) => (
              <span key={w} className="text-xs px-3 py-1.5 rounded-full bg-[#0B2C3C] text-[#D7E2E7] border border-[rgba(143,168,181,0.14)]">
                {w} <span className="text-[#5B7483]">({c})</span>
              </span>
            ))}
            {topKeywords.length === 0 && <p className="text-sm text-[#5B7483]">아직 분석할 데이터가 없어요.</p>}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="flex flex-col gap-2">
          {profiles.length === 0 && <p className="text-sm text-[#5B7483]">아직 가입한 회원이 없어요.</p>}
          {profiles.map((p) => (
            <div key={p.id} className="bg-[#072431] border border-[rgba(143,168,181,0.14)] rounded-xl p-3.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-bold text-[#F3EFE8]">{p.name}</span>
                <span className="text-xs text-[#5B7483]">{fmt(p.created_at)} 가입</span>
              </div>
              <div className="text-xs text-[#8FA8B5] mt-1">
                {[p.email, p.company, p.role].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="flex flex-col gap-2">
          {initialSearchLogs.length === 0 && <p className="text-sm text-[#5B7483]">아직 검색 기록이 없어요.</p>}
          {initialSearchLogs.map((l) => {
            const p = profileMap.get(l.user_id);
            return (
              <div key={l.id} className="bg-[#072431] border border-[rgba(143,168,181,0.14)] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#D7E2E7]">{l.query}</span>
                </div>
                <div className="text-xs text-[#5B7483]">
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

function ReplyBox({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-2 mt-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="답변을 입력하세요…"
        rows={3}
        className="border border-[rgba(143,168,181,0.25)] rounded-lg px-3 py-2 text-sm bg-[#001621] text-[#F3EFE8] placeholder:text-[#5B7483] resize-y focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
      />
      <button
        type="button"
        disabled={busy || !text.trim()}
        onClick={async () => {
          setBusy(true);
          await onSend(text.trim());
          setBusy(false);
        }}
        className="self-start bg-[#FF4103] text-[#140800] text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
      >
        {busy ? "보내는 중…" : "답변 보내기"}
      </button>
    </div>
  );
}
