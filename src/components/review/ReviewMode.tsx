"use client";

import { useEffect, useRef, useState } from "react";

// 임시 디자인 리뷰 도구. ?review=1 로 한 번 켜면 localStorage에 켜짐 상태가 남아
// 사이트 안 아무 페이지를 돌아다니며 클릭 → 메모를 남길 수 있다. 실제 방문자에게는
// 평소 아무 흔적도 남기지 않는다(마운트 후에만 조건부로 렌더링).

type Pin = { id: string; pageX: number; pageY: number; snippet: string; note: string; ts: number };

const ACTIVE_KEY = "iid-review-active";
const PREFIX = "iid-review:";

function keyFor(pathname: string) {
  return PREFIX + pathname;
}

function loadPins(pathname: string): Pin[] {
  try {
    const raw = localStorage.getItem(keyFor(pathname));
    return raw ? (JSON.parse(raw) as Pin[]) : [];
  } catch {
    return [];
  }
}

function savePins(pathname: string, pins: Pin[]) {
  try {
    localStorage.setItem(keyFor(pathname), JSON.stringify(pins));
  } catch {
    // 저장 공간이 꽉 찬 경우 등은 조용히 무시 — 임시 도구라 치명적이지 않음
  }
}

function exportAll(): string {
  const lines: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const path = key.slice(PREFIX.length);
    let pins: Pin[] = [];
    try {
      pins = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      continue;
    }
    if (!pins.length) continue;
    lines.push(`## ${path}`);
    pins
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .forEach((p, idx) => lines.push(`${idx + 1}. "${p.snippet}" → ${p.note}`));
    lines.push("");
  }
  return lines.join("\n").trim() || "(남긴 피드백이 아직 없어요)";
}

export default function ReviewMode() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [pathname, setPathname] = useState("/");
  const [pins, setPins] = useState<Pin[]>([]);
  const [draft, setDraft] = useState<{ pageX: number; pageY: number; snippet: string } | null>(null);
  const [draftText, setDraftText] = useState("");
  const draftInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // window/localStorage는 서버 렌더에는 없으므로, 마운트된 뒤 클라이언트에서만 동기화한다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const urlWantsOn = params.get("review") === "1";
    const stored = localStorage.getItem(ACTIVE_KEY) === "1";
    if (urlWantsOn) localStorage.setItem(ACTIVE_KEY, "1");
    setActive(urlWantsOn || stored);
    setPathname(window.location.pathname);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPins(loadPins(pathname));
  }, [mounted, pathname]);

  // Next.js 클라이언트 네비게이션(History API)도 따라가도록 경로를 폴링
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      if (window.location.pathname !== pathname) setPathname(window.location.pathname);
    }, 400);
    return () => clearInterval(id);
  }, [mounted, pathname]);

  useEffect(() => {
    if (!active) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-review-ui]")) return;
      e.preventDefault();
      e.stopPropagation();
      const snippet = (target.innerText || target.getAttribute("aria-label") || target.tagName).trim().slice(0, 60);
      setDraft({ pageX: e.pageX, pageY: e.pageY, snippet });
      setDraftText("");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  useEffect(() => {
    if (draft) draftInputRef.current?.focus();
  }, [draft]);

  if (!mounted || !active) return null;

  function commitDraft() {
    if (!draft || !draftText.trim()) {
      setDraft(null);
      return;
    }
    const next = [...pins, { id: crypto.randomUUID(), pageX: draft.pageX, pageY: draft.pageY, snippet: draft.snippet, note: draftText.trim(), ts: Date.now() }];
    setPins(next);
    savePins(pathname, next);
    setDraft(null);
  }

  function removePin(id: string) {
    const next = pins.filter((p) => p.id !== id);
    setPins(next);
    savePins(pathname, next);
  }

  function clearPage() {
    if (!confirm("이 페이지에 남긴 메모를 모두 지울까요?")) return;
    setPins([]);
    savePins(pathname, []);
  }

  async function copyAll() {
    const text = exportAll();
    try {
      await navigator.clipboard.writeText(text);
      alert("전체 피드백을 복사했어요. 클로드와의 대화창에 붙여넣어 주세요.");
    } catch {
      prompt("복사가 자동으로 안 되면 아래 내용을 직접 복사해 주세요", text);
    }
  }

  function turnOff() {
    localStorage.removeItem(ACTIVE_KEY);
    window.location.reload();
  }

  return (
    <div data-review-ui>
      {pins.map((p, i) => (
        <div key={p.id} data-review-ui style={{ position: "absolute", left: p.pageX, top: p.pageY, transform: "translate(-50%,-50%)", zIndex: 2147483000 }}>
          <button
            type="button"
            onClick={() => removePin(p.id)}
            title={`${p.note}\n(눌러서 지우기)`}
            className="w-7 h-7 rounded-full bg-[#8B2E3C] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,.35)] border-2 border-white hover:scale-110 transition-transform cursor-pointer"
          >
            {i + 1}
          </button>
        </div>
      ))}

      {draft && (
        <div
          data-review-ui
          style={{ position: "absolute", left: draft.pageX, top: draft.pageY, zIndex: 2147483001 }}
          className="w-64 -translate-x-1/2 bg-white border border-black/15 rounded-xl shadow-2xl p-3"
        >
          <p className="text-[11px] text-[#9A9A9A] mb-1.5 truncate">“{draft.snippet}”</p>
          <textarea
            ref={draftInputRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Escape") setDraft(null);
            }}
            placeholder="여기에 수정 요청을 적어주세요…"
            rows={2}
            className="w-full text-sm border border-black/15 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C] resize-none"
          />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <button type="button" onClick={() => setDraft(null)} className="text-xs px-2 py-1 text-[#6B6B6B]">
              취소
            </button>
            <button type="button" onClick={commitDraft} className="text-xs font-semibold px-2.5 py-1 bg-[#8B2E3C] text-white rounded-md">
              남기기
            </button>
          </div>
        </div>
      )}

      <div
        data-review-ui
        style={{ position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 2147483002 }}
        className="flex items-center gap-2 bg-[#111111] text-white rounded-full pl-4 pr-2 py-2 shadow-2xl text-sm whitespace-nowrap"
      >
        <span className="font-semibold">피드백 모드</span>
        <span className="text-white/50 hidden sm:inline">· 화면을 클릭해서 메모를 남기세요</span>
        <span className="text-white/70 text-xs ml-1">{pins.length}개</span>
        <button type="button" onClick={clearPage} className="ml-1 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 font-semibold">
          비우기
        </button>
        <button type="button" onClick={copyAll} className="bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 font-semibold">
          전체 복사
        </button>
        <button type="button" onClick={turnOff} className="bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 font-semibold">
          끄기
        </button>
      </div>
    </div>
  );
}
