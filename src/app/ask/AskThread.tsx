"use client";

import { useRef, useState } from "react";
import { ArrowUp, Clock, Paperclip, X, FileText, SmilePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Attachment = { url: string; name: string; type: string };

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
          reaction ? "bg-[#F4F4F2] font-semibold text-[#333333]" : "text-[#C4C4C4] hover:text-[#FF4103] hover:bg-[#F4F4F2]"
        }`}
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
                  : "text-[11px] font-semibold text-[#555555] bg-[#F4F4F2] hover:bg-[#EDEDEA] rounded-full px-2 py-1"
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

export default function AskThread({ initialQuestions, userId }: { initialQuestions: Question[]; userId: string }) {
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
      setText("");
      setFiles([]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } else if (insErr) {
      setError("질문을 보내지 못했어요: " + insErr.message);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 pb-2 text-[12.5px] text-[#6B6B6B]">
        이드에게 직접 궁금한 걸 물어보세요. AI가 아니라 <strong className="text-[#444444]">이드 본인이 직접 확인하고 답변</strong>합니다 — 그래서
        답변까지 시간이 걸릴 수 있어요. 이 질문/답변은 본인만 볼 수 있습니다.
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" onClick={() => setOpenReactionFor(null)}>
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 flex flex-col gap-4">
          {items.length === 0 && (
            <p className="text-sm text-[#9A9A9A] text-center py-10">아직 남긴 질문이 없어요. 아래에 궁금한 걸 적어보세요.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="flex flex-col gap-1 items-end">
              <div className="max-w-[85%] flex flex-col gap-2 items-end">
                {it.question && (
                  <div className="bg-[#FF4103] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap font-medium">
                    {it.question}
                  </div>
                )}
                {it.attachments && it.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {it.attachments.map((a, i) => (
                      <div key={i} className="bg-[#FF4103] text-white rounded-xl px-2.5 py-2">
                        <AttachmentView a={a} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {it.question && (
                <ReactionTrigger
                  reaction={it.question_reaction}
                  align="end"
                  open={openReactionFor === it.id + "-q"}
                  onToggle={() => setOpenReactionFor((k) => (k === it.id + "-q" ? null : it.id + "-q"))}
                  onPick={(emoji) => setReaction(it.id, "question", emoji)}
                />
              )}
              {it.answer ? (
                <>
                  <div className="max-w-[92%] self-end w-full bg-[#FAFAF9] border border-[rgba(255,65,3,0.35)] rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap text-[#111111]">
                    <div className="text-[10.5px] font-bold text-[#FF4103] mb-1">이드의 답변</div>
                    {it.answer}
                  </div>
                  <ReactionTrigger
                    reaction={it.answer_reaction}
                    align="start"
                    open={openReactionFor === it.id + "-a"}
                    onToggle={() => setOpenReactionFor((k) => (k === it.id + "-a" ? null : it.id + "-a"))}
                    onPick={(emoji) => setReaction(it.id, "answer", emoji)}
                  />
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                  이드가 확인하고 답변할 예정이에요
                </div>
              )}
            </div>
          ))}
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
                if (e.key === "Enter" && !e.shiftKey) {
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
  );
}
