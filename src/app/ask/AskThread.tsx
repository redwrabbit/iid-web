"use client";

import { useRef, useState } from "react";
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
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 pb-2 text-[12.5px] text-[#8B968E]">
        이드에게 직접 궁금한 걸 물어보세요. AI가 아니라 <strong>이드 본인이 직접 확인하고 답변</strong>합니다 — 그래서
        답변까지 시간이 걸릴 수 있어요. 이 질문/답변은 본인만 볼 수 있습니다.
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 flex flex-col gap-4">
          {items.length === 0 && (
            <p className="text-sm text-[#8B968E] text-center py-10">아직 남긴 질문이 없어요. 아래에 궁금한 걸 적어보세요.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="flex flex-col gap-2 items-end">
              <div className="max-w-[85%] bg-[#1B3A4B] text-[#F5F1E4] rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                {it.question}
              </div>
              {it.answer ? (
                <div className="max-w-[92%] self-end w-full bg-[#EFE7D2] border border-[#B8791E59] rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap">
                  <div className="text-[10.5px] font-bold text-[#B8791E] mb-1">이드의 답변</div>
                  {it.answer}
                </div>
              ) : (
                <div className="text-xs text-[#8B968E]">⏳ 이드가 확인하고 답변할 예정이에요</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-[#1B3A4B1F] bg-[#FBF9F2] px-4 sm:px-6 py-3">
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
            className="flex-1 border border-[#1B3A4B29] rounded-xl px-4 py-3 text-sm bg-[#F1EEE4] resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-12 h-12 shrink-0 rounded-xl bg-[#1B3A4B] text-[#FBF9F2] flex items-center justify-center text-lg disabled:opacity-60"
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}
