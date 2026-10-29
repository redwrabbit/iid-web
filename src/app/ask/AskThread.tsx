"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Clock, Paperclip, X, FileText, SmilePlus, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Attachment = { url: string; name: string; type: string };

export type MessageReply = {
  id: string;
  question_id: string;
  field: "question" | "answer";
  sender: "user" | "admin";
  text: string;
  attachments?: Attachment[];
  created_at: string;
};

function fmtThreadTime(t: string) {
  return new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 칸 사이 경계선을 드래그로 당기면 폭이 바뀝니다. onDrag는 마우스가 움직인 만큼(px)을 넘겨줍니다.
export function DragHandle({ onDrag }: { onDrag: (deltaPx: number) => void }) {
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      if (!draggingRef.current) return;
      const delta = ev.clientX - lastXRef.current;
      lastXRef.current = ev.clientX;
      onDrag(delta);
    }
    function onMouseUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      className="w-1 shrink-0 cursor-col-resize bg-black/5 hover:bg-[#FF4103]/40 active:bg-[#FF4103]/60 transition-colors"
    />
  );
}

export function useResizableWidth(storageKey: string, initial: number, min: number, max: number) {
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external store
          setWidth(Math.min(max, Math.max(min, n)));
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDrag(deltaPx: number, sign: 1 | -1 = 1) {
    setWidth((w) => {
      const next = Math.min(max, Math.max(min, w + sign * deltaPx));
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return [width, onDrag] as const;
}

// 질문/답변 말풍선 하나에 슬랙처럼 달리는 쓰레드 답글 패널. 관리자/질문자 화면에서 공용으로 씁니다.
export function ThreadPanel({
  viewerRole,
  parent,
  replies,
  busy,
  error,
  onSend,
  onClose,
  width = 380,
}: {
  viewerRole: "admin" | "user";
  parent: { label: string; text: string; attachments?: Attachment[]; time: string };
  replies: MessageReply[];
  busy: boolean;
  error: string;
  onSend: (text: string) => void;
  onClose: () => void;
  width?: number;
}) {
  const [text, setText] = useState("");
  function submit() {
    const v = text.trim();
    if (!v || busy) return;
    onSend(v);
    setText("");
  }
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [replies.length]);
  return (
    <div style={{ width }} className="shrink-0 border-l border-black/10 flex flex-col min-h-0 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
        <div className="text-sm font-bold text-[#111111]">스레드</div>
        <button type="button" onClick={onClose} aria-label="닫기" className="p-1 rounded-md text-[#B0B0B0] hover:text-[#111111] hover:bg-[#F4F4F2]">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        <div className="pb-3 border-b border-black/8">
          <div className="text-[11px] text-[#9A9A9A] mb-1">
            {parent.label} · {fmtThreadTime(parent.time)}
          </div>
          {parent.text && <div className="text-sm whitespace-pre-wrap text-[#111111]">{parent.text}</div>}
          {parent.attachments && parent.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {parent.attachments.map((a, i) => (
                <div key={i} className="bg-[#F4F4F2] rounded-xl px-2.5 py-2 text-[#111111]">
                  <AttachmentView a={a} />
                </div>
              ))}
            </div>
          )}
        </div>
        {replies.length === 0 && <p className="text-xs text-[#9A9A9A] text-center py-4">아직 답글이 없어요.</p>}
        {replies.map((r) => (
          <div key={r.id} className={`flex flex-col gap-1 ${r.sender === viewerRole ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                r.sender === viewerRole ? "bg-[#FF4103] text-white rounded-br-md" : "bg-[#F4F4F2] text-[#111111] rounded-bl-md"
              }`}
            >
              {r.text}
            </div>
            <div className="text-[10px] text-[#B0B0B0]">{fmtThreadTime(r.created_at)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-black/10 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="답글 남기기…"
            className="flex-1 border border-black/15 rounded-xl px-3 py-2 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
          />
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={submit}
            className="w-10 h-10 shrink-0 rounded-xl bg-[#FF4103] text-white flex items-center justify-center disabled:opacity-60"
          >
            <Send className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}

export type Question = {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  attachments?: Attachment[];
  question_reaction?: string | null;
  answer_reaction?: string | null;
};

export const REACTIONS: { value: string; kind: "emoji" | "text" }[] = [
  { value: "👍", kind: "emoji" },
  { value: "❤️", kind: "emoji" },
  { value: "😂", kind: "emoji" },
  { value: "😮", kind: "emoji" },
  { value: "🙏", kind: "emoji" },
  { value: "✅", kind: "emoji" },
  { value: "⭕", kind: "emoji" },
  { value: "❌", kind: "emoji" },
  { value: "확인중", kind: "text" },
  { value: "완료", kind: "text" },
];

const TEXT_REACTION_COLORS: Record<string, string> = {
  확인중: "bg-[#F59E0B] text-white",
  완료: "bg-[#10B981] text-white",
};

export function ReactionTrigger({
  reaction,
  open,
  align,
  onToggle,
  onPick,
}: {
  reaction: string | null | undefined;
  open: boolean;
  align: "start" | "end";
  onToggle: () => void;
  onPick: (emoji: string | null) => void;
}) {
  return (
    <div className={`relative flex ${align === "end" ? "justify-end" : "justify-start"}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label="반응 남기기"
        className={`text-xs rounded-full px-1.5 py-0.5 ${
          reaction
            ? `font-semibold ${TEXT_REACTION_COLORS[reaction] || "bg-[#F4F4F2] text-[#333333]"}`
            : "text-[#C4C4C4] hover:text-[#FF4103] hover:bg-[#F4F4F2]"
        } ${reaction && TEXT_REACTION_COLORS[reaction] ? "px-2.5" : ""}`}
      >
        {reaction || <SmilePlus className="w-3.5 h-3.5" strokeWidth={2} />}
      </button>
      {open && (
        <div
          className={`absolute z-20 bottom-full mb-1 ${align === "end" ? "right-0" : "left-0"} flex flex-wrap gap-1 w-[164px] bg-white border border-black/10 rounded-2xl px-2 py-2 shadow-md`}
          onClick={(e) => e.stopPropagation()}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onPick(reaction === r.value ? null : r.value)}
              className={
                r.kind === "emoji"
                  ? "text-lg leading-none hover:scale-125 transition-transform p-0.5"
                  : `text-[11px] font-semibold rounded-full px-2 py-1 ${TEXT_REACTION_COLORS[r.value]} hover:opacity-85`
              }
            >
              {r.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MAX_FILES = 3;
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export function AttachmentView({ a }: { a: Attachment }) {
  if (a.type.startsWith("image/")) {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} className="max-w-[200px] max-h-[200px] rounded-lg border border-black/10 object-cover" />
      </a>
    );
  }
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs underline underline-offset-2 opacity-90"
    >
      <FileText className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      {a.name}
    </a>
  );
}

type ChatMsg = {
  key: string;
  kind: "question" | "answer" | "pending";
  questionId: string;
  text: string;
  attachments?: Attachment[];
  reaction?: string | null;
  time: string;
};

export default function AskThread({
  initialQuestions,
  initialReplies = [],
  userId,
  notifyEmail = true,
}: {
  initialQuestions: Question[];
  initialReplies?: MessageReply[];
  userId: string;
  notifyEmail?: boolean;
}) {
  const [notify, setNotify] = useState(notifyEmail);
  const [items, setItems] = useState<Question[]>(initialQuestions);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);

  async function setReaction(questionId: string, field: "question" | "answer", emoji: string | null) {
    setOpenReactionFor(null);
    setItems((prev) =>
      prev.map((it) => (it.id === questionId ? { ...it, [field === "question" ? "question_reaction" : "answer_reaction"]: emoji } : it))
    );
    const supabase = createClient();
    await supabase.rpc("set_question_reaction", { p_question_id: questionId, p_field: field, p_emoji: emoji });
  }

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
      .insert({ question_id: openThread.questionId, field: openThread.field, sender: "user", text: value })
      .select("id, question_id, field, sender, text, attachments, created_at")
      .single();
    setThreadBusy(false);
    if (err || !data) {
      setThreadError("답글을 보내지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    setReplies((prev) => [...prev, data as MessageReply]);
  }

  const chatMsgs = useMemo<ChatMsg[]>(() => {
    const msgs: ChatMsg[] = [];
    const seenAnswers = new Set<string>();
    for (const it of items) {
      if (it.question || (it.attachments && it.attachments.length > 0)) {
        msgs.push({
          key: it.id + "-q",
          kind: "question",
          questionId: it.id,
          text: it.question,
          attachments: it.attachments,
          reaction: it.question_reaction,
          time: it.created_at,
        });
      }
      if (it.answer) {
        // 관리자가 한 번에 여러 질문에 같은 답변을 보내면 answer/answered_at이 동일하므로 하나로 합침
        const dedupeKey = `${it.answered_at || it.created_at}__${it.answer}`;
        if (!seenAnswers.has(dedupeKey)) {
          seenAnswers.add(dedupeKey);
          msgs.push({
            key: it.id + "-a",
            kind: "answer",
            questionId: it.id,
            text: it.answer,
            reaction: it.answer_reaction,
            time: it.answered_at || it.created_at,
          });
        }
      } else {
        msgs.push({ key: it.id + "-p", kind: "pending", questionId: it.id, text: "", time: it.created_at });
      }
    }
    return msgs.sort((a, b) => a.time.localeCompare(b.time));
  }, [items]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) break;
      if (f.size > MAX_SIZE) {
        setError(`${f.name}은(는) 8MB를 넘어서 첨부할 수 없어요.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if ((!q && files.length === 0) || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();

    let attachments: Attachment[] = [];
    try {
      attachments = await Promise.all(
        files.map(async (f) => {
          const path = `${userId}/${Date.now()}-${f.name}`;
          const { error: upErr } = await supabase.storage.from("attachments").upload(path, f);
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
          return { url: pub.publicUrl, name: f.name, type: f.type || "application/octet-stream" };
        })
      );
    } catch (err) {
      setBusy(false);
      setError("파일을 올리지 못했어요: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
      return;
    }

    const { data, error: insErr } = await supabase
      .from("questions")
      .insert({ user_id: userId, question: q, attachments })
      .select("id, question, answer, answered_at, created_at, attachments, question_reaction, answer_reaction")
      .single();
    setBusy(false);
    if (!insErr && data) {
      setItems((prev) => [...prev, data as Question]);
      fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "question" }) }).catch(() => {});
      setText("");
      setFiles([]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } else if (insErr) {
      setError("질문을 보내지 못했어요: " + insErr.message);
    }
  }

  function replyTrigger(questionId: string, field: "question" | "answer", align: "start" | "end") {
    const count = repliesFor(questionId, field).length;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenReactionFor(null);
          setOpenThread({ questionId, field });
        }}
        className={`text-[11px] text-[#9A9A9A] hover:text-[#FF4103] hover:underline ${align === "end" ? "self-end" : "self-start"}`}
      >
        {count > 0 ? `${count}개의 댓글` : "답글달기"}
      </button>
    );
  }

  const openThreadParent = useMemo(() => {
    if (!openThread) return null;
    const m = chatMsgs.find((c) => c.questionId === openThread.questionId && c.kind === openThread.field);
    if (!m) return null;
    return { label: openThread.field === "question" ? "내 질문" : "이드의 답변", text: m.text, attachments: m.attachments, time: m.time };
  }, [openThread, chatMsgs]);

  const [threadW, dragThreadW] = useResizableWidth("iid_ask_thread_w", 380, 300, Infinity);

  return (
    <div className="flex-1 min-h-0 flex">
    <div className="flex-1 min-w-[300px] flex flex-col min-h-0">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 pb-2 text-[12.5px] text-[#6B6B6B]">
        이드에게 직접 궁금한 걸 물어보세요. AI가 아니라 <strong className="text-[#444444]">이드 본인이 직접 확인하고 답변</strong>합니다 — 그래서
        답변까지 시간이 걸릴 수 있어요. 이 질문/답변은 본인만 볼 수 있습니다.
        <label className="mt-2 flex items-center gap-2 text-[12px] text-[#555555] cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={notify}
            onChange={async (e) => {
              const next = e.target.checked;
              setNotify(next);
              const { error: err } = await createClient().from("profiles").update({ notify_email: next }).eq("id", userId);
              if (err) setNotify(!next);
            }}
          />
          답변이 달리면 이메일로 알려주세요
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" onClick={() => setOpenReactionFor(null)}>
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 flex flex-col gap-4">
          {chatMsgs.length === 0 && (
            <p className="text-sm text-[#9A9A9A] text-center py-10">아직 남긴 질문이 없어요. 아래에 궁금한 걸 적어보세요.</p>
          )}
          {chatMsgs.map((m) => {
            if (m.kind === "question") {
              return (
                <div key={m.key} className="flex flex-col gap-1 items-end">
                  <div className="max-w-[85%] flex flex-col gap-2 items-end">
                    {m.text && (
                      <div className="bg-[#FF4103] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap font-medium">
                        {m.text}
                      </div>
                    )}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {m.attachments.map((a, i) => (
                          <div key={i} className="bg-[#FF4103] text-white rounded-xl px-2.5 py-2">
                            <AttachmentView a={a} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ReactionTrigger
                    reaction={m.reaction}
                    align="end"
                    open={openReactionFor === m.key}
                    onToggle={() => setOpenReactionFor((k) => (k === m.key ? null : m.key))}
                    onPick={(emoji) => setReaction(m.questionId, "question", emoji)}
                  />
                  {replyTrigger(m.questionId, "question", "end")}
                </div>
              );
            }
            if (m.kind === "answer") {
              return (
                <div key={m.key} className="flex flex-col gap-1 items-start">
                  <div className="max-w-[92%] w-full bg-[#FAFAF9] border border-[rgba(255,65,3,0.35)] rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap text-[#111111]">
                    <div className="text-[10.5px] font-bold text-[#FF4103] mb-1">이드의 답변</div>
                    {m.text}
                  </div>
                  <ReactionTrigger
                    reaction={m.reaction}
                    align="start"
                    open={openReactionFor === m.key}
                    onToggle={() => setOpenReactionFor((k) => (k === m.key ? null : m.key))}
                    onPick={(emoji) => setReaction(m.questionId, "answer", emoji)}
                  />
                  {replyTrigger(m.questionId, "answer", "start")}
                </div>
              );
            }
            return (
              <div key={m.key} className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                이드가 확인하고 답변할 예정이에요
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-black/10 bg-white px-4 sm:px-6 py-3">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-2">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#F4F4F2] border border-black/10 rounded-full pl-3 pr-1.5 py-1 text-[#333333]"
                >
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="첨부 제거"
                    className="p-0.5 rounded-full hover:bg-black/10"
                  >
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 items-end">
            <label className="w-12 h-12 shrink-0 rounded-xl border border-black/15 flex items-center justify-center text-[#6B6B6B] hover:bg-[#F4F4F2] cursor-pointer">
              <Paperclip className="w-5 h-5" strokeWidth={2} />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.hwp"
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              rows={1}
              placeholder="이드에게 궁금한 걸 남겨보세요…"
              className="flex-1 border border-black/15 rounded-xl px-4 py-3 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-12 h-12 shrink-0 rounded-xl bg-[#FF4103] text-white flex items-center justify-center disabled:opacity-60"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </form>
    </div>
    {openThread && openThreadParent && (
      <>
      <DragHandle onDrag={(d) => dragThreadW(d, -1)} />
      <ThreadPanel
        viewerRole="user"
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
