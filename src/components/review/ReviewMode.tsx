"use client";

import { useEffect, useRef, useState } from "react";

// 임시 디자인 리뷰 도구. ?review=1 로 한 번 켜면 localStorage에 켜짐 상태가 남아
// 사이트 안 아무 페이지를 돌아다니며 클릭(점) 또는 드래그(자유 영역)로 메모를 남길 수 있다.
// 실제 방문자에게는 평소 아무 흔적도 남기지 않는다(마운트 후에만 조건부로 렌더링).

type Point = { x: number; y: number };

type Pin =
  | { id: string; kind: "point"; pageX: number; pageY: number; snippet: string; note: string; ts: number }
  | { id: string; kind: "shape"; x: number; y: number; w: number; h: number; points: [number, number][]; note: string; ts: number };

type Draft =
  | { kind: "point"; pageX: number; pageY: number; snippet: string }
  | { kind: "shape"; x: number; y: number; w: number; h: number; points: [number, number][] };

const ACTIVE_KEY = "iid-review-active";
const PREFIX = "iid-review:";
const CLICK_THRESHOLD = 10; // 이보다 작게 움직이면 그냥 클릭(점)으로 취급

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
      .forEach((p, idx) => {
        const label = p.kind === "point" ? `"${p.snippet}"` : "[드래그로 표시한 영역]";
        lines.push(`${idx + 1}. ${label} → ${p.note}`);
      });
    lines.push("");
  }
  return lines.join("\n").trim() || "(남긴 피드백이 아직 없어요)";
}

function pathD(points: [number, number][] | Point[], closed: boolean) {
  const pts = points.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
  if (!pts.length) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + (closed ? " Z" : "");
}

function ShapeOutline({ x, y, w, h, points, draft }: { x: number; y: number; w: number; h: number; points: [number, number][]; draft?: boolean }) {
  return (
    <svg
      data-review-ui
      style={{ position: "absolute", left: x, top: y, width: Math.max(w, 1), height: Math.max(h, 1), overflow: "visible", pointerEvents: "none", zIndex: 2147482999 }}
    >
      <path
        d={pathD(points, !draft)}
        fill={draft ? "none" : "rgba(139,46,60,0.14)"}
        stroke="#8B2E3C"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={draft ? "6 4" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function ReviewMode() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [pathname, setPathname] = useState("/");
  const [pins, setPins] = useState<Pin[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftText, setDraftText] = useState("");
  const [livePoints, setLivePoints] = useState<Point[] | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);

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

  // 리뷰 모드 중에는 드래그로 텍스트가 선택되지 않도록
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [active]);

  // 실제 클릭/네비게이션은 항상 막는다(우리 오버레이 UI는 제외)
  useEffect(() => {
    if (!active) return;
    function onClick(e: MouseEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("[data-review-ui]")) return;
      e.preventDefault();
      e.stopPropagation();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  // 클릭(점) vs 드래그(자유 영역)를 pointerdown/move/up으로 직접 구분한다
  useEffect(() => {
    if (!active) return;

    function isReviewUi(t: EventTarget | null) {
      return t instanceof HTMLElement && !!t.closest("[data-review-ui]");
    }

    function onPointerDown(e: PointerEvent) {
      if (isReviewUi(e.target) || e.button !== 0) return;
      e.preventDefault();
      drawingRef.current = true;
      pointsRef.current = [{ x: e.pageX, y: e.pageY }];
      setLivePoints(pointsRef.current.slice());
    }

    function onPointerMove(e: PointerEvent) {
      if (!drawingRef.current) return;
      const last = pointsRef.current[pointsRef.current.length - 1];
      const dx = e.pageX - last.x;
      const dy = e.pageY - last.y;
      if (dx * dx + dy * dy < 9) return; // 3px 미만 이동은 점 폭주 방지를 위해 무시
      pointsRef.current.push({ x: e.pageX, y: e.pageY });
      setLivePoints(pointsRef.current.slice());
    }

    function onPointerUp(e: PointerEvent) {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const pts = pointsRef.current;
      setLivePoints(null);
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = maxX - minX;
      const h = maxY - minY;

      if (w < CLICK_THRESHOLD && h < CLICK_THRESHOLD) {
        const target = e.target as HTMLElement;
        const snippet = (target?.innerText || target?.getAttribute("aria-label") || target?.tagName || "").trim().slice(0, 60);
        setDraft({ kind: "point", pageX: e.pageX, pageY: e.pageY, snippet });
      } else {
        const rel: [number, number][] = pts.map((p) => [p.x - minX, p.y - minY]);
        setDraft({ kind: "shape", x: minX, y: minY, w, h, points: rel });
      }
      setDraftText("");
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
    };
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
    const base = { id: crypto.randomUUID(), note: draftText.trim(), ts: Date.now() };
    const pin: Pin =
      draft.kind === "point"
        ? { ...base, kind: "point", pageX: draft.pageX, pageY: draft.pageY, snippet: draft.snippet }
        : { ...base, kind: "shape", x: draft.x, y: draft.y, w: draft.w, h: draft.h, points: draft.points };
    const next = [...pins, pin];
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

  const draftAnchor =
    draft?.kind === "point" ? { x: draft.pageX, y: draft.pageY } : draft ? { x: draft.x + draft.w / 2, y: draft.y + draft.h } : null;

  return (
    <div data-review-ui>
      {pins.map((p, i) => {
        const center = p.kind === "point" ? { x: p.pageX, y: p.pageY } : { x: p.x + p.w / 2, y: p.y + p.h / 2 };
        return (
          <div key={p.id}>
            {p.kind === "shape" && <ShapeOutline x={p.x} y={p.y} w={p.w} h={p.h} points={p.points} />}
            <div data-review-ui style={{ position: "absolute", left: center.x, top: center.y, transform: "translate(-50%,-50%)", zIndex: 2147483000 }}>
              <button
                type="button"
                onClick={() => removePin(p.id)}
                title={`${p.note}\n(눌러서 지우기)`}
                className="w-7 h-7 rounded-full bg-[#8B2E3C] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,.35)] border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              >
                {i + 1}
              </button>
            </div>
          </div>
        );
      })}

      {livePoints &&
        livePoints.length > 1 &&
        (() => {
          const minX = Math.min(...livePoints.map((p) => p.x));
          const minY = Math.min(...livePoints.map((p) => p.y));
          const maxX = Math.max(...livePoints.map((p) => p.x));
          const maxY = Math.max(...livePoints.map((p) => p.y));
          return (
            <ShapeOutline
              x={minX}
              y={minY}
              w={maxX - minX}
              h={maxY - minY}
              points={livePoints.map((p) => [p.x - minX, p.y - minY])}
              draft
            />
          );
        })()}

      {draft?.kind === "shape" && <ShapeOutline x={draft.x} y={draft.y} w={draft.w} h={draft.h} points={draft.points} />}

      {draft && draftAnchor && (
        <div
          data-review-ui
          style={{ position: "absolute", left: draftAnchor.x, top: draftAnchor.y, zIndex: 2147483001 }}
          className="w-64 -translate-x-1/2 mt-2 bg-white border border-black/15 rounded-xl shadow-2xl p-3"
        >
          <p className="text-[11px] text-[#9A9A9A] mb-1.5 truncate">{draft.kind === "point" ? `“${draft.snippet}”` : "드래그로 표시한 영역"}</p>
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
        <span className="text-white/50 hidden sm:inline">· 클릭(점) 또는 드래그(영역)로 메모를 남기세요</span>
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
