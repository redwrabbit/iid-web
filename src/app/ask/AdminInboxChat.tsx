"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, EyeOff, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AttachmentView, ReactionTrigger, ThreadPanel, DragHandle, useResizableWidth, type Question, type MessageReply } from "./AskThread";

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

const GROUP_GAP_MS = 10 * 60 * 1000;
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

function topUserId(list: AdminQuestion[]): string | null {
  const byUser = new Map<string, number>();
  for (const q of list) byUser.set(q.user_id, (byUser.get(q.user_id) || 0) + (q.answer ? 0 : 1));
  let best: string | null = null;
  let bestPending = -1;
  for (const [userId, pending] of byUser) {
    if (pending > bestPending) {
      best = userId;
      bestPending = pending;
    }
  }
  return best;
}

export default function AdminInboxChat({
  initialQuestions,
  initialReplies = [],
  profiles,
}: {
  initialQuestions: AdminQuestion[];
  initialReplies?: MessageReply[];
  profiles: Profile[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  // Starts empty on both server and client so the first client render matches
  // the server-rendered HTML; localStorage is only readable after mount.
  const [lastViewed, setLastViewed] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  function markSeen(userId: string) {
    const now = new Date().toISOString();
    setLastViewed((prev) => {
      const next = { ...prev, [userId]: now };
      try {
        localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function toggleHidden(userId: string) {
    setHidden((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
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
    const top = topUserId(initialQuestions);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external store
    setLastViewed(top ? { ...loaded, [top]: new Date().toISOString() } : loaded);
    setHidden(loadHidden());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const seenAt = lastViewed[userId];
        const unseenPending = sorted.filter((q) => !q.answer && (!seenAt || q.created_at > seenAt)).length;
        // 질문/답변 중 가장 최근 활동 시각 (답변이 질문보다 나중일 수 있으므로 둘 다 본다)
        const lastAt = sorted.reduce((max, q) => {
          const t = q.answered_at && q.answered_at > q.created_at ? q.answered_at : q.created_at;
          return t > max ? t : max;
        }, "");
        return { userId, items: sorted, pending, unseenPending, lastAt, hidden: hidden.includes(userId) };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [questions, lastViewed, hidden]);

  const visibleThreads = useMemo(() => threads.filter((t) => showHidden || !t.hidden), [threads, showHidden]);
  const hiddenCount = threads.length - threads.filter((t) => !t.hidden).length;

  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? visibleThreads[0]?.userId ?? threads[0]?.userId ?? null;
  const active = threads.find((t) => t.userId === activeId);
  const activeProfile = activeId ? profileMap.get(activeId) : undefined;

  function selectThread(userId: string) {
    setSelected(userId);
    markSeen(userId);
    setOpenThread(null);
  }

  const chatMsgs = useMemo<ChatMsg[]>(() => {
    if (!active) return [];
    const msgs: ChatMsg[] = [];
    const seenAnswers = new Set<string>();
    for (const it of active.items) {
      if (it.question || (it.attachments && it.attachments.length > 0)) {
        msgs.push({
          key: it.id + "-q",
          questionId: it.id,
          field: "question",
          sender: "user",
          text: it.question,
          attachments: it.attachments,
          reaction: it.question_reaction,
          time: it.created_at,
        });
      }
      if (it.answer) {
        // 한 번에 여러 건에 같은 답변을 보내면 answer/answered_at이 동일하므로 하나로 합침
        const dedupeKey = `${it.answered_at || it.created_at}__${it.answer}`;
        if (!seenAnswers.has(dedupeKey)) {
          seenAnswers.add(dedupeKey);
          msgs.push({
            key: it.id + "-a",
            questionId: it.id,
            field: "answer",
            sender: "admin",
            text: it.answer,
            reaction: it.answer_reaction,
            time: it.answered_at || it.created_at,
          });
        }
      }
    }
    return msgs.sort((a, b) => a.time.localeCompare(b.time));
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
    if (!text || !activeId || !active) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const now = new Date().toISOString();
    if (active.pending > 0) {
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
    } else {
      // 대기 중인 질문이 없어도 채팅처럼 먼저 메시지를 보낼 수 있다 (질문 칸이 빈 행으로 저장)
      const { data, error: err } = await supabase
        .from("questions")
        .insert({ user_id: activeId, question: "", answer: text, answered_at: now })
        .select("id, user_id, question, answer, answered_at, created_at, attachments, question_reaction, answer_reaction")
        .single();
      setBusy(false);
      if (err || !data) {
        setError("메시지를 보내지 못했어요: " + (err?.message || "알 수 없는 오류"));
        return;
      }
      setQuestions((prev) => [...prev, data as (typeof prev)[number]]);
    }
    fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "answer", userId: activeId }) }).catch(() => {});
    setReply("");
  }

  // 질문/답변 말풍선 하나하나에 슬랙처럼 달 수 있는 쓰레드 답글
  const [replies, setReplies] = useState<MessageReply[]>(initialReplies);
  const [openThread, setOpenThread] = useState<{ questionId: string; field: "question" | "answer" } | null>(null);
  const [threadBusy, setThreadBusy] = useState(false);
  const [threadError, setThreadError] = useState("");

  function repliesFor(questionId: string, field: "question" | "answer") {
    return replies
      .filter((r) => r.question_id === questionId && r.field === field)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async function sendThreadReply(value: string) {
    if (!openThread) return;
    setThreadBusy(true);
    setThreadError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("message_replies")
      .insert({ question_id: openThread.questionId, field: openThread.field, sender: "admin", text: value })
      .select("id, question_id, field, sender, text, attachments, created_at")
      .single();
    setThreadBusy(false);
    if (err || !data) {
      setThreadError("답글을 보내지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    setReplies((prev) => [...prev, data as MessageReply]);
  }

  const openThreadParent = useMemo(() => {
    if (!openThread) return null;
    const m = chatMsgs.find((c) => c.questionId === openThread.questionId && c.field === openThread.field);
    if (!m) return null;
    return { label: openThread.field === "question" ? "질문자" : "이드", text: m.text, attachments: m.attachments, time: m.time };
  }, [openThread, chatMsgs]);

  const [sidebarW, dragSidebarW] = useResizableWidth("iid_admin_inbox_sidebar_w", 260, 220, Infinity);
  const [threadW, dragThreadW] = useResizableWidth("iid_admin_inbox_thread_w", 380, 300, Infinity);

  if (threads.length === 0) {
    return <p className="text-sm text-[#9A9A9A] text-center py-10">아직 들어온 질문이 없어요.</p>;
  }

  return (
    <div className="flex-1 min-h-0 flex">
      <aside style={{ width: sidebarW }} className="shrink-0 border-r border-black/10 overflow-y-auto flex flex-col">
        {visibleThreads.map((t) => {
          const p = profileMap.get(t.userId);
          const activeThread = t.userId === activeId;
          return (
            <div
              key={t.userId}
              role="button"
              tabIndex={0}
              onClick={() => selectThread(t.userId)}
              onKeyDown={(e) => e.key === "Enter" && selectThread(t.userId)}
              className={`group relative w-full text-left px-4 py-3 border-b border-black/8 cursor-pointer ${
                t.hidden ? "opacity-50" : ""
              } ${activeThread ? "bg-[rgba(255,65,3,0.08)]" : "hover:bg-[#F4F4F2]"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5 pr-6">
                <span className="text-sm font-bold text-[#111111] truncate">{p?.name || "알 수 없음"}</span>
                {t.unseenPending > 0 && (
                  <span className="shrink-0 text-[10px] font-bold text-white bg-[#FF4103] rounded-full px-1.5 py-0.5">
                    {t.unseenPending}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#9A9A9A] truncate pr-6">{p?.company || p?.email}</div>
              <div className="text-[11px] text-[#B0B0B0] mt-0.5">{fmt(t.lastAt)}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHidden(t.userId);
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
            {showHidden ? "숨긴 대화 숨기기" : `숨긴 대화 ${hiddenCount}개 보기`}
          </button>
        )}
      </aside>

      <DragHandle onDrag={dragSidebarW} />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {active && (
          <>
            <div className="border-b border-black/10 px-5 py-3">
              <div className="text-sm font-bold text-[#111111]">{activeProfile?.name || "알 수 없음"}</div>
              <div className="text-xs text-[#9A9A9A]">
                {[activeProfile?.email, activeProfile?.company, activeProfile?.role].filter(Boolean).join(" · ")}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-1.5" onClick={() => setOpenReactionFor(null)}>
              {chatMsgs.map((m, i) => {
                const prev = chatMsgs[i - 1];
                const showTime = !prev || new Date(m.time).getTime() - new Date(prev.time).getTime() > GROUP_GAP_MS;
                const align = m.sender === "admin" ? "end" : "start";
                const replyCount = repliesFor(m.questionId, m.field).length;
                return (
                  <div key={m.key} className="flex flex-col gap-1">
                    {showTime && <div className="text-center text-[10.5px] text-[#B0B0B0] py-1">{fmt(m.time)}</div>}
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
                    <div className={`flex items-center gap-3 ${align === "end" ? "justify-end" : "justify-start"}`}>
                      <ReactionTrigger
                        reaction={m.reaction}
                        align={align}
                        open={openReactionFor === m.key}
                        onToggle={() => setOpenReactionFor((k) => (k === m.key ? null : m.key))}
                        onPick={(emoji) => setReaction(m.questionId, m.field, emoji)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenReactionFor(null);
                          setOpenThread({ questionId: m.questionId, field: m.field });
                        }}
                        className="text-[11px] text-[#9A9A9A] hover:text-[#FF4103] hover:underline"
                      >
                        {replyCount > 0 ? `${replyCount}개의 댓글` : "답글달기"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-black/10 px-5 py-3">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-[#9A9A9A]">
                  {active.pending > 0
                    ? `보내는 답변은 ${activeProfile?.name || "이 분"}의 대기 중인 질문 ${active.pending}건에 함께 전달돼요.`
                    : "대기 중인 질문이 없어도 언제든 메시지를 보낼 수 있어요."}
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
                    placeholder="메시지를 입력하세요…"
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
      </div>

      {openThread && openThreadParent && (
        <>
        <DragHandle onDrag={(d) => dragThreadW(d, -1)} />
        <ThreadPanel
          viewerRole="admin"
          parent={openThreadParent}
          width={threadW}
          replies={repliesFor(openThread.questionId, openThread.field)}
          busy={threadBusy}
          error={threadError}
          onSend={sendThreadReply}
          onClose={() => setOpenThread(null)}
        />
        </>
      )}
    </div>
  );
}
