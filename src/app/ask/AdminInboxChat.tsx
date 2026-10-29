"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, EyeOff, Eye, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AttachmentView, ReactionTrigger, type Question } from "./AskThread";

type Profile = { id: string; email: string; name: string; company: string | null; role: string | null };
export type AdminQuestion = Question & { user_id: string };

type ChatMsg = {
  key: string;
  questionId: string;
  field: "question" | "answer";
  sender: "user" | "admin";
  text: string;
  attachments?: Question["attachments"];
  reaction?: string | null;
  time: string;
};

const LAST_VIEWED_KEY = "iid_admin_inbox_last_viewed";
const HIDDEN_KEY = "iid_admin_inbox_hidden";

function fmt(t: string) {
  return new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function loadLastViewed(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_VIEWED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadHidden(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lastActivityAt(q: AdminQuestion): string {
  return q.answered_at && q.answered_at > q.created_at ? q.answered_at : q.created_at;
}

// 처음 열었을 때 가장 눈에 띄어야 할 쓰레드: 아직 답변 안 한 것 중 가장 최근, 없으면 가장 최근 쓰레드
function topQuestionId(list: AdminQuestion[]): string | null {
  const sorted = [...list].sort((a, b) => lastActivityAt(b).localeCompare(lastActivityAt(a)));
  return sorted.find((q) => !q.answer)?.id ?? sorted[0]?.id ?? null;
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
  // Starts empty on both server and client so the first client render matches
  // the server-rendered HTML; localStorage is only readable after mount.
  const [lastViewed, setLastViewed] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  function markSeen(questionId: string) {
    const now = new Date().toISOString();
    setLastViewed((prev) => {
      const next = { ...prev, [questionId]: now };
      try {
        localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function toggleHidden(questionId: string) {
    setHidden((prev) => {
      const next = prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId];
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  useEffect(() => {
    const loaded = loadLastViewed();
    const top = topQuestionId(initialQuestions);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external store
    setLastViewed(top ? { ...loaded, [top]: new Date().toISOString() } : loaded);
    setHidden(loadHidden());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 쓰레드 = 질문 1건. 사람별로 뭉치지 않고, 질문마다 각자의 쓰레드로 나눕니다.
  const threads = useMemo(() => {
    return questions
      .map((q) => {
        const hasQuestionBubble = Boolean(q.question) || (q.attachments && q.attachments.length > 0);
        const msgCount = (hasQuestionBubble ? 1 : 0) + (q.answer ? 1 : 0);
        const lastAt = lastActivityAt(q);
        const seenAt = lastViewed[q.id];
        const pending = !q.answer;
        const unseen = pending && (!seenAt || q.created_at > seenAt);
        return { questionId: q.id, userId: q.user_id, question: q, lastAt, msgCount, pending, unseen, hidden: hidden.includes(q.id) };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [questions, lastViewed, hidden]);

  const visibleThreads = useMemo(() => threads.filter((t) => showHidden || !t.hidden), [threads, showHidden]);
  const hiddenCount = threads.length - threads.filter((t) => !t.hidden).length;
  const pendingCount = threads.filter((t) => t.pending).length;

  const [selected, setSelected] = useState<string | null>(null);
  const [composeProfile, setComposeProfile] = useState<Profile | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeQuery, setComposeQuery] = useState("");
  const [composeText, setComposeText] = useState("");
  const [composeBusy, setComposeBusy] = useState(false);
  const [composeError, setComposeError] = useState("");

  const activeId =
    composeProfile ? null : selected ?? visibleThreads.find((t) => t.pending)?.questionId ?? visibleThreads[0]?.questionId ?? threads[0]?.questionId ?? null;
  const active = threads.find((t) => t.questionId === activeId);
  const activeProfile = active ? profileMap.get(active.userId) : undefined;

  function selectThread(questionId: string) {
    setComposeProfile(null);
    setSelected(questionId);
    markSeen(questionId);
    setReply("");
    setError("");
  }

  function startCompose(p: Profile) {
    setComposeProfile(p);
    setComposeOpen(false);
    setComposeQuery("");
    setComposeError("");
    setSelected(null);
    setReply("");
    setError("");
  }

  const filteredProfiles = useMemo(() => {
    const q = composeQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => [p.name, p.email, p.company].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
  }, [profiles, composeQuery]);

  const chatMsgs = useMemo<ChatMsg[]>(() => {
    if (!active) return [];
    const q = active.question;
    const msgs: ChatMsg[] = [];
    if (q.question || (q.attachments && q.attachments.length > 0)) {
      msgs.push({
        key: q.id + "-q",
        questionId: q.id,
        field: "question",
        sender: "user",
        text: q.question,
        attachments: q.attachments,
        reaction: q.question_reaction,
        time: q.created_at,
      });
    }
    if (q.answer) {
      msgs.push({
        key: q.id + "-a",
        questionId: q.id,
        field: "answer",
        sender: "admin",
        text: q.answer,
        reaction: q.answer_reaction,
        time: q.answered_at || q.created_at,
      });
    }
    return msgs;
  }, [active]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeId]);

  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);

  async function setReaction(questionId: string, field: "question" | "answer", emoji: string | null) {
    setOpenReactionFor(null);
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [field === "question" ? "question_reaction" : "answer_reaction"]: emoji } : q))
    );
    const supabase = createClient();
    await supabase.rpc("set_question_reaction", { p_question_id: questionId, p_field: field, p_emoji: emoji });
  }

  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendReply() {
    const text = reply.trim();
    if (!text || !active) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const now = new Date().toISOString();
    const { error: err } = await supabase.from("questions").update({ answer: text, answered_at: now }).eq("id", active.questionId);
    setBusy(false);
    if (err) {
      setError("답변을 보내지 못했어요: " + err.message);
      return;
    }
    setQuestions((prev) => prev.map((q) => (q.id === active.questionId ? { ...q, answer: text, answered_at: now } : q)));
    fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "answer", userId: active.userId }) }).catch(
      () => {}
    );
    setReply("");
  }

  async function sendComposeMessage() {
    const text = composeText.trim();
    if (!text || !composeProfile) return;
    setComposeBusy(true);
    setComposeError("");
    const supabase = createClient();
    const now = new Date().toISOString();
    // 대기 중인 질문이 없어도 채팅처럼 먼저 메시지를 보낼 수 있다 (질문 칸이 빈 행으로 저장 = 새 쓰레드)
    const { data, error: err } = await supabase
      .from("questions")
      .insert({ user_id: composeProfile.id, question: "", answer: text, answered_at: now })
      .select("id, user_id, question, answer, answered_at, created_at, attachments, question_reaction, answer_reaction")
      .single();
    setComposeBusy(false);
    if (err || !data) {
      setComposeError("메시지를 보내지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    setQuestions((prev) => [...prev, data as AdminQuestion]);
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "answer", userId: composeProfile.id }),
    }).catch(() => {});
    setSelected(data.id);
    setComposeProfile(null);
    setComposeText("");
  }

  if (threads.length === 0 && profiles.length === 0) {
    return <p className="text-sm text-[#9A9A9A] text-center py-10">아직 들어온 질문이 없어요.</p>;
  }

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr]">
      <aside className="border-r border-black/10 overflow-y-auto flex flex-col">
        <div className="shrink-0 border-b border-black/8 px-4 py-3 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#6B6B6B]">
              전체 <strong className="text-[#111111]">{threads.length}</strong>건
              {pendingCount > 0 && <span className="text-[#FF4103] font-semibold"> · 대기중 {pendingCount}건</span>}
            </div>
            <button
              type="button"
              onClick={() => setComposeOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)] rounded-full px-2 py-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              새 메시지
            </button>
          </div>
          {composeOpen && (
            <div className="absolute z-20 top-full left-2 right-2 mt-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-2 border-b border-black/8">
                <input
                  autoFocus
                  value={composeQuery}
                  onChange={(e) => setComposeQuery(e.target.value)}
                  placeholder="이름/이메일로 찾기"
                  className="flex-1 text-xs px-2 py-1 outline-none"
                />
                <button type="button" onClick={() => setComposeOpen(false)} className="p-1 text-[#B0B0B0] hover:text-[#111111]">
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredProfiles.length === 0 && <p className="text-xs text-[#9A9A9A] px-3 py-3">일치하는 사람이 없어요.</p>}
                {filteredProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => startCompose(p)}
                    className="w-full text-left px-3 py-2 hover:bg-[#F4F4F2]"
                  >
                    <div className="text-xs font-semibold text-[#111111]">{p.name}</div>
                    <div className="text-[11px] text-[#9A9A9A] truncate">{p.company || p.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {visibleThreads.map((t) => {
          const p = profileMap.get(t.userId);
          const activeThread = t.questionId === activeId;
          return (
            <div
              key={t.questionId}
              role="button"
              tabIndex={0}
              onClick={() => selectThread(t.questionId)}
              onKeyDown={(e) => e.key === "Enter" && selectThread(t.questionId)}
              className={`group relative w-full text-left px-4 py-3 border-b border-black/8 cursor-pointer ${
                t.hidden ? "opacity-50" : ""
              } ${activeThread ? "bg-[rgba(255,65,3,0.08)]" : "hover:bg-[#F4F4F2]"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5 pr-6">
                <span className="text-sm font-bold text-[#111111] truncate">{p?.name || "알 수 없음"}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-semibold text-[#9A9A9A] bg-[#F4F4F2] rounded-full px-1.5 py-0.5">{t.msgCount}</span>
                  {t.unseen && <span className="w-2 h-2 rounded-full bg-[#FF4103]" />}
                </div>
              </div>
              <div className="text-xs text-[#9A9A9A] truncate pr-6">{t.question.question || "메시지"}</div>
              <div className="text-[11px] text-[#B0B0B0] mt-0.5">{fmt(t.lastAt)}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHidden(t.questionId);
                }}
                aria-label={t.hidden ? "다시 보이기" : "숨기기"}
                className={`absolute top-3 right-2 p-1 rounded-md text-[#B0B0B0] hover:text-[#FF4103] hover:bg-white ${
                  t.hidden ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {t.hidden ? <Eye className="w-3.5 h-3.5" strokeWidth={2} /> : <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />}
              </button>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="w-full text-center text-xs text-[#9A9A9A] hover:text-[#FF4103] py-2.5 border-b border-black/8"
          >
            {showHidden ? "숨긴 쓰레드 숨기기" : `숨긴 쓰레드 ${hiddenCount}개 보기`}
          </button>
        )}
      </aside>

      <div className="flex flex-col min-h-0">
        {composeProfile && (
          <>
            <div className="border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#9A9A9A]">받는 사람</div>
                <div className="text-sm font-bold text-[#111111]">{composeProfile.name}</div>
                <div className="text-xs text-[#9A9A9A]">
                  {[composeProfile.email, composeProfile.company, composeProfile.role].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComposeProfile(null)}
                aria-label="취소"
                className="p-1.5 rounded-md text-[#B0B0B0] hover:text-[#111111] hover:bg-[#F4F4F2]"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center px-5">
              <p className="text-sm text-[#9A9A9A] text-center">
                대기 중인 질문이 없어도 언제든 먼저 메시지를 보낼 수 있어요.
                <br />새 쓰레드로 만들어져요.
              </p>
            </div>
            <div className="border-t border-black/10 px-5 py-3">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        sendComposeMessage();
                      }
                    }}
                    rows={2}
                    placeholder="메시지를 입력하세요…"
                    className="flex-1 border border-black/15 rounded-xl px-4 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
                  />
                  <button
                    type="button"
                    disabled={composeBusy || !composeText.trim()}
                    onClick={sendComposeMessage}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#FF4103] text-white flex items-center justify-center disabled:opacity-60"
                  >
                    <Send className="w-4.5 h-4.5" strokeWidth={2.25} />
                  </button>
                </div>
                {composeError && <p className="text-xs text-red-600">{composeError}</p>}
              </div>
            </div>
          </>
        )}

        {!composeProfile && active && (
          <>
            <div className="border-b border-black/10 px-5 py-3">
              <div className="text-sm font-bold text-[#111111]">{activeProfile?.name || "알 수 없음"}</div>
              <div className="text-xs text-[#9A9A9A]">
                {[activeProfile?.email, activeProfile?.company, activeProfile?.role].filter(Boolean).join(" · ")}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-1.5" onClick={() => setOpenReactionFor(null)}>
              <div className="text-center text-[10.5px] text-[#B0B0B0] py-1">{fmt(active.question.created_at)}</div>
              {chatMsgs.map((m) => {
                const align = m.sender === "admin" ? "end" : "start";
                return (
                  <div key={m.key} className="flex flex-col gap-1">
                    <div className={`flex flex-col gap-1.5 max-w-[85%] ${m.sender === "admin" ? "self-end items-end" : "items-start"}`}>
                      {m.text && (
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                            m.sender === "admin"
                              ? "bg-[#FF4103] text-white rounded-br-md"
                              : "bg-[#F4F4F2] text-[#111111] rounded-bl-md"
                          }`}
                        >
                          {m.text}
                        </div>
                      )}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {m.attachments.map((a, j) => (
                            <div key={j} className="bg-[#F4F4F2] rounded-xl px-2.5 py-2 text-[#111111]">
                              <AttachmentView a={a} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <ReactionTrigger
                      reaction={m.reaction}
                      align={align}
                      open={openReactionFor === m.key}
                      onToggle={() => setOpenReactionFor((k) => (k === m.key ? null : m.key))}
                      onPick={(emoji) => setReaction(m.questionId, m.field, emoji)}
                    />
                  </div>
                );
              })}
              {chatMsgs.length === 0 && <p className="text-sm text-[#9A9A9A] text-center py-6">내용이 없는 쓰레드예요.</p>}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-black/10 px-5 py-3">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-[#9A9A9A]">
                  {active.question.answer
                    ? "이미 답변한 쓰레드예요. 다시 보내면 답변 내용이 수정돼요."
                    : `이 질문에 대한 답변을 ${activeProfile?.name || "이 분"}에게 보냅니다.`}
                </p>
                <div className="flex gap-2 items-end">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={2}
                    placeholder={active.question.answer ? "답변을 수정하세요…" : "답변을 입력하세요…"}
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
            </div>
          </>
        )}

        {!composeProfile && !active && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#9A9A9A]">왼쪽에서 쓰레드를 선택하거나 새 메시지를 보내보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
