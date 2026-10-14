"use client";

import { useMemo, useState } from "react";
import { Send, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AttachmentView, type Question } from "./AskThread";

type Profile = { id: string; email: string; name: string; company: string | null; role: string | null };
export type AdminQuestion = Question & { user_id: string };

function fmt(t: string) {
  return new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminInboxChat({
  initialQuestions,
  profiles,
}: {
  initialQuestions: AdminQuestion[];
  profiles: Profile[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const threads = useMemo(() => {
    const byUser = new Map<string, AdminQuestion[]>();
    for (const q of questions) {
      const list = byUser.get(q.user_id) || [];
      list.push(q);
      byUser.set(q.user_id, list);
    }
    return Array.from(byUser.entries())
      .map(([userId, list]) => {
        const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
        const pending = sorted.filter((q) => !q.answer).length;
        const last = sorted[sorted.length - 1];
        return { userId, items: sorted, pending, lastAt: last?.created_at || "" };
      })
      .sort((a, b) => (a.pending !== b.pending ? b.pending - a.pending : b.lastAt.localeCompare(a.lastAt)));
  }, [questions]);

  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? threads[0]?.userId ?? null;
  const active = threads.find((t) => t.userId === activeId);
  const activeProfile = activeId ? profileMap.get(activeId) : undefined;

  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendReply() {
    const text = reply.trim();
    if (!text || !activeId || !active || active.pending === 0) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from("questions")
      .update({ answer: text, answered_at: now })
      .eq("user_id", activeId)
      .is("answer", null);
    setBusy(false);
    if (err) {
      setError("답변을 보내지 못했어요: " + err.message);
      return;
    }
    setQuestions((prev) =>
      prev.map((q) => (q.user_id === activeId && !q.answer ? { ...q, answer: text, answered_at: now } : q))
    );
    setReply("");
  }

  if (threads.length === 0) {
    return <p className="text-sm text-[#9A9A9A] text-center py-10">아직 들어온 질문이 없어요.</p>;
  }

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[260px_1fr]">
      <aside className="border-r border-black/10 overflow-y-auto">
        {threads.map((t) => {
          const p = profileMap.get(t.userId);
          const activeThread = t.userId === activeId;
          return (
            <button
              key={t.userId}
              type="button"
              onClick={() => setSelected(t.userId)}
              className={`w-full text-left px-4 py-3 border-b border-black/8 ${activeThread ? "bg-[rgba(255,65,3,0.08)]" : "hover:bg-[#F4F4F2]"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-bold text-[#111111] truncate">{p?.name || "알 수 없음"}</span>
                {t.pending > 0 && (
                  <span className="shrink-0 text-[10px] font-bold text-white bg-[#FF4103] rounded-full px-1.5 py-0.5">
                    {t.pending}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#9A9A9A] truncate">{p?.company || p?.email}</div>
              <div className="text-[11px] text-[#B0B0B0] mt-0.5">{fmt(t.lastAt)}</div>
            </button>
          );
        })}
      </aside>

      <div className="flex flex-col min-h-0">
        {active && (
          <>
            <div className="border-b border-black/10 px-5 py-3">
              <div className="text-sm font-bold text-[#111111]">{activeProfile?.name || "알 수 없음"}</div>
              <div className="text-xs text-[#9A9A9A]">
                {[activeProfile?.email, activeProfile?.company, activeProfile?.role].filter(Boolean).join(" · ")}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {active.items.map((it) => (
                <div key={it.id} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 items-start max-w-[85%]">
                    {it.question && (
                      <div className="bg-[#F4F4F2] text-[#111111] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                        {it.question}
                      </div>
                    )}
                    {it.attachments && it.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {it.attachments.map((a, i) => (
                          <div key={i} className="bg-[#F4F4F2] rounded-xl px-2.5 py-2 text-[#111111]">
                            <AttachmentView a={a} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[10.5px] text-[#B0B0B0]">{fmt(it.created_at)}</div>
                  </div>
                  {it.answer ? (
                    <div className="max-w-[85%] self-end bg-[#FF4103] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                      {it.answer}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
                      <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                      답변 대기 중
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 px-5 py-3">
              {active.pending === 0 ? (
                <p className="text-xs text-[#9A9A9A]">현재 답변 대기 중인 질문이 없어요.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-[#9A9A9A]">
                    보내는 답변은 {activeProfile?.name || "이 분"}의 대기 중인 질문 {active.pending}건에 함께 전달돼요.
                  </p>
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      rows={2}
                      placeholder="답변을 입력하세요…"
                      className="flex-1 border border-black/15 rounded-xl px-4 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
                    />
                    <button
                      type="button"
                      disabled={busy || !reply.trim()}
                      onClick={sendReply}
                      className="w-11 h-11 shrink-0 rounded-xl bg-[#FF4103] text-white flex items-center justify-center disabled:opacity-60"
                    >
                      <Send className="w-4.5 h-4.5" strokeWidth={2.25} />
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
