"use client";

import { useRef, useState } from "react";
import { ArrowUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Question = {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

export default function AskThread({ initialQuestions, userId }: { initialQuestions: Question[]; userId: string }) {
  const [items, setItems] = useState<Question[]>(initialQuestions);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setText("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .insert({ user_id: userId, question: q })
      .select("id, question, answer, answered_at, created_at")
      .single();
    setBusy(false);
    if (!error && data) {
      setItems((prev) => [...prev, data as Question]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 pb-2 text-[12.5px] text-[#6B6B6B]">
        이드에게 직접 궁금한 걸 물어보세요. AI가 아니라 <strong className="text-[#444444]">이드 본인이 직접 확인하고 답변</strong>합니다 — 그래서
        답변까지 시간이 걸릴 수 있어요. 이 질문/답변은 본인만 볼 수 있습니다.
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 flex flex-col gap-4">
          {items.length === 0 && (
            <p className="text-sm text-[#9A9A9A] text-center py-10">아직 남긴 질문이 없어요. 아래에 궁금한 걸 적어보세요.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="flex flex-col gap-2 items-end">
              <div className="max-w-[85%] bg-[#FF4103] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap font-medium">
                {it.question}
              </div>
              {it.answer ? (
                <div className="max-w-[92%] self-end w-full bg-[#FAFAF9] border border-[rgba(255,65,3,0.35)] rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap text-[#111111]">
                  <div className="text-[10.5px] font-bold text-[#FF4103] mb-1">이드의 답변</div>
                  {it.answer}
                </div>
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
        <div className="mx-auto w-full max-w-2xl flex gap-2">
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
      </form>
    </div>
  );
}
