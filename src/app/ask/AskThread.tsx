"use client";

import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import { ArrowUp, Bold, Clock, Link2, List, ListOrdered, Paperclip, Pencil, Underline as UnderlineIcon, X, FileText, SmilePlus, Send } from "lucide-react";
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

function isBulletLine(line: string) {
  return line.startsWith("- ") || line.startsWith("* ");
}

const NUMBERED_PREFIX_RE = /^\d+\.\s+/;

function isEditableEmpty(el: HTMLDivElement | null) {
  if (!el) return true;
  return (el.textContent || "").trim().length === 0;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtmlAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function toggleBold(el: HTMLDivElement) {
  el.focus();
  document.execCommand("bold");
}
function toggleUnderline(el: HTMLDivElement) {
  el.focus();
  document.execCommand("underline");
}
function toggleBulletList(el: HTMLDivElement) {
  el.focus();
  document.execCommand("insertUnorderedList");
}
function toggleNumberedList(el: HTMLDivElement) {
  el.focus();
  document.execCommand("insertOrderedList");
}
// 선택한 글을 링크로 감싼다. 선택이 없으면 주소 자체를 글자로 끼워 넣는다.
function insertLinkCmd(el: HTMLDivElement) {
  el.focus();
  const hasSelection = !!window.getSelection()?.toString();
  const url = window.prompt("링크 주소를 입력하세요", "https://");
  if (!url) return;
  if (hasSelection) {
    document.execCommand("createLink", false, url);
  } else {
    document.execCommand("insertHTML", false, `<a href="${escapeHtmlAttr(url)}">${escapeHtml(url)}</a>&nbsp;`);
  }
}

// 굵게/밑줄/목록/링크 서식 버튼 한 줄. 입력창 위에 올려서 쓴다.
// onMouseDown에서 버튼 자체의 포커스를 막아야, 클릭해도 입력창의 선택 영역이 풀리지 않는다.
export function FormatToolbar({ editableRef }: { editableRef: RefObject<HTMLDivElement | null> }) {
  const btnCls = "w-7 h-7 rounded-md flex items-center justify-center text-[#6B6B6B] hover:text-[#FF4103] hover:bg-[#F4F4F2]";
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div className="flex items-center gap-0.5 mb-1">
      <button type="button" aria-label="굵게" title="굵게" className={btnCls} onMouseDown={keepFocus} onClick={() => editableRef.current && toggleBold(editableRef.current)}>
        <Bold className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label="밑줄" title="밑줄" className={btnCls} onMouseDown={keepFocus} onClick={() => editableRef.current && toggleUnderline(editableRef.current)}>
        <UnderlineIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label="글머리 기호" title="글머리 기호" className={btnCls} onMouseDown={keepFocus} onClick={() => editableRef.current && toggleBulletList(editableRef.current)}>
        <List className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label="번호 매기기" title="번호 매기기" className={btnCls} onMouseDown={keepFocus} onClick={() => editableRef.current && toggleNumberedList(editableRef.current)}>
        <ListOrdered className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label="링크" title="링크" className={btnCls} onMouseDown={keepFocus} onClick={() => editableRef.current && insertLinkCmd(editableRef.current)}>
        <Link2 className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}

// contentEditable 안의 실제 목록/굵게/밑줄/링크 DOM을 저장용 평문(마크다운 비슷한 표기)으로 바꾼다.
// renderRichText가 그 평문을 다시 읽어 똑같은 서식으로 그려준다.
// 같은 서식(markers)이 적용된 인접한 글자 조각들을 하나로 합친 뒤에 마커를 씌운다 — 안 그러면
// 브라우저가 서식을 여러 조각(span/text node)으로 쪼개놨을 때 마커가 중복돼서 찍힌다.
export function serializeEditable(root: HTMLDivElement): string {
  type Run = { markers: readonly string[]; text: string };
  const lines: string[] = [];
  let runs: Run[] = [];

  function sameMarkers(a: readonly string[], b: readonly string[]) {
    return a.length === b.length && a.every((m, i) => m === b[i]);
  }
  function pushRun(text: string, markers: readonly string[]) {
    if (!text) return;
    const last = runs[runs.length - 1];
    if (last && sameMarkers(last.markers, markers)) last.text += text;
    else runs.push({ markers, text });
  }
  function renderRuns() {
    return runs.map((r) => r.markers.reduce((s, m) => `${m}${s}${m}`, r.text)).join("");
  }
  function flushLine() {
    lines.push(renderRuns());
    runs = [];
  }

  // insideLi: 목록 항목(li) 안을 걷는 중인지. 우리 저장 형식은 글머리 기호 한 줄에 내용 한 줄만 담을 수
  // 있어서, li 안에서 줄바꿈(Shift+Enter로 생긴 <br>)을 그대로 줄바꿈 처리하면 그 줄이 목록 밖으로
  // 튀어나가 버린다 — 그래서 li 안에서는 <br>을 공백으로 뭉갠다.
  function walk(node: Node, markers: readonly string[], insideLi = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      pushRun(node.textContent || "", markers);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      if (runs.length) flushLine();
      let n = 1;
      el.querySelectorAll(":scope > li").forEach((li) => {
        const prefix = tag === "ul" ? "- " : `${n++}. `;
        runs = [];
        li.childNodes.forEach((c) => walk(c, markers, true));
        lines.push(prefix + renderRuns().trimEnd());
        runs = [];
      });
      return;
    }
    if (tag === "div" || tag === "p") {
      if (insideLi) {
        el.childNodes.forEach((c) => walk(c, markers, true));
        return;
      }
      if (runs.length) flushLine();
      el.childNodes.forEach((c) => walk(c, markers));
      flushLine();
      return;
    }
    if (tag === "br") {
      if (insideLi) pushRun(" ", []);
      else flushLine();
      return;
    }
    if (tag === "b" || tag === "strong") {
      const next = markers.includes("**") ? markers : [...markers, "**"];
      el.childNodes.forEach((c) => walk(c, next, insideLi));
      return;
    }
    if (tag === "u") {
      const next = markers.includes("__") ? markers : [...markers, "__"];
      el.childNodes.forEach((c) => walk(c, next, insideLi));
      return;
    }
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      if (href) pushRun(`[${el.textContent || ""}](${href})`, []);
      else el.childNodes.forEach((c) => walk(c, markers, insideLi));
      return;
    }
    el.childNodes.forEach((c) => walk(c, markers, insideLi));
  }
  root.childNodes.forEach((c) => walk(c, []));
  if (runs.length) flushLine();
  while (lines.length && lines[0] === "") lines.shift();
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

const EDITABLE_MAX_H = 240;

// 입력창 자체: contentEditable이라 굵게/밑줄/목록 들여쓰기가 타이핑하는 동안 바로 보인다.
// initialHtml을 주면(기존 메시지 수정 등) 마운트 시 그 내용으로 미리 채워 넣는다.
export function RichEditable({
  editableRef,
  placeholder,
  minHeight,
  padClassName = "px-4 py-3",
  initialHtml,
  onEmptyChange,
  onEnterSubmit,
}: {
  editableRef: RefObject<HTMLDivElement | null>;
  placeholder: string;
  minHeight: number;
  padClassName?: string;
  initialHtml?: string;
  onEmptyChange?: (empty: boolean) => void;
  onEnterSubmit: () => void;
}) {
  const [empty, setEmpty] = useState(!initialHtml);
  useEffect(() => {
    if (initialHtml && editableRef.current) {
      editableRef.current.innerHTML = initialHtml;
      const isEmpty = isEditableEmpty(editableRef.current);
      setEmpty(isEmpty);
      onEmptyChange?.(isEmpty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="relative flex-1 border border-black/15 rounded-xl bg-[#FAFAF9] focus-within:ring-2 focus-within:ring-[#FF4103]">
      {empty && <div className={`pointer-events-none absolute inset-0 text-sm text-[#9A9A9A] ${padClassName}`}>{placeholder}</div>}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          const isEmpty = isEditableEmpty(editableRef.current);
          setEmpty(isEmpty);
          onEmptyChange?.(isEmpty);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onEnterSubmit();
          }
        }}
        style={{ minHeight, maxHeight: EDITABLE_MAX_H }}
        className={`text-sm text-[#111111] outline-none overflow-y-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${padClassName}`}
      />
    </div>
  );
}

// g 플래그 정규식은 lastIndex를 자기 안에 들고 있어서, 재귀 호출(굵게 안의 밑줄 등 중첩 서식) 사이에
// 하나를 공유하면 바깥 루프의 위치가 안쪽 호출 때문에 망가진다 — 그래서 호출마다 새로 만든다.
function makeInlineRe() {
  return /\*\*(.+?)\*\*|__(.+?)__|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  const re = makeInlineRe();
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={`${keyPrefix}-${i}`}>{renderInline(m[1], `${keyPrefix}-${i++}b`)}</strong>);
    else if (m[2] !== undefined) nodes.push(<u key={`${keyPrefix}-${i}`}>{renderInline(m[2], `${keyPrefix}-${i++}u`)}</u>);
    else if (m[3] !== undefined)
      nodes.push(
        <a key={`${keyPrefix}-${i++}`} href={m[4]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {m[3]}
        </a>
      );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// 저장된 평문에서 **굵게**, __밑줄__, [글](링크), "1. 소제목" 줄, "- "/"* " 글머리 기호를 실제 서식으로 그려준다.
// "1. " 줄이 연달아 두 줄 이상 나오면 번호 매기기 목록으로, 혼자 나오면(소제목처럼 쓰인 것으로 보고) 굵은 제목으로 그린다.
export function renderRichText(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    if (isBulletLine(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={`ul-${key}`} className={`list-disc pl-5 ${blocks.length ? "mt-1" : ""}`}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `li-${key}-${j}`)}</li>
          ))}
        </ul>
      );
      key++;
    } else if (NUMBERED_PREFIX_RE.test(lines[i])) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && NUMBERED_PREFIX_RE.test(lines[j])) {
        items.push(lines[j].replace(NUMBERED_PREFIX_RE, ""));
        j++;
      }
      if (items.length >= 2) {
        blocks.push(
          <ol key={`ol-${key}`} className={`list-decimal pl-5 ${blocks.length ? "mt-1" : ""}`}>
            {items.map((it, j2) => (
              <li key={j2}>{renderInline(it, `oli-${key}-${j2}`)}</li>
            ))}
          </ol>
        );
        key++;
        i = j;
      } else {
        blocks.push(
          <div key={`h-${key}`} className={`font-bold ${blocks.length ? "mt-3" : ""}`}>
            {renderInline(lines[i], `h-${key}`)}
          </div>
        );
        key++;
        i++;
      }
    } else {
      const isLast = i === lines.length - 1;
      blocks.push(
        <span key={`ln-${key}`}>
          {renderInline(lines[i], `ln-${key}`)}
          {!isLast && <br />}
        </span>
      );
      key++;
      i++;
    }
  }
  return blocks;
}

function inlineToHtml(text: string): string {
  let out = "";
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = makeInlineRe();
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) out += escapeHtml(text.slice(lastIndex, m.index));
    if (m[1] !== undefined) out += `<b>${inlineToHtml(m[1])}</b>`;
    else if (m[2] !== undefined) out += `<u>${inlineToHtml(m[2])}</u>`;
    else if (m[3] !== undefined) out += `<a href="${escapeHtmlAttr(m[4])}">${escapeHtml(m[3])}</a>`;
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) out += escapeHtml(text.slice(lastIndex));
  return out;
}

// 저장된 평문을 다시 고칠 수 있게 contentEditable에 넣을 HTML로 바꾼다 — renderRichText와 같은 규칙으로 읽는다.
// "1. 소제목" 처럼 혼자 나온 번호줄은 화면에선 굵게 보이지만, 그 굵기는 마커가 아니라 규칙에서 나오는
// 것이라 여기서도 그대로 <b>로 감싸지 않는다 — 감싸면 저장할 때 "**1. ...**"로 실제 마커가 붙어버린다.
function richTextToHtml(text: string): string {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isBulletLine(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(`<ul>${items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ul>`);
    } else if (NUMBERED_PREFIX_RE.test(lines[i])) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && NUMBERED_PREFIX_RE.test(lines[j])) {
        items.push(lines[j].replace(NUMBERED_PREFIX_RE, ""));
        j++;
      }
      if (items.length >= 2) {
        blocks.push(`<ol>${items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ol>`);
        i = j;
      } else {
        blocks.push(`<div>${inlineToHtml(lines[i])}</div>`);
        i++;
      }
    } else {
      blocks.push(`<div>${inlineToHtml(lines[i]) || "<br>"}</div>`);
      i++;
    }
  }
  return blocks.join("");
}

// 말풍선 하나를 "고치기" 모드로 바꿔서 보여주는 공용 상자 — 질문/답변/스레드 답글에서 똑같이 쓴다.
export function InlineEditBox({
  initialText,
  busy,
  onSave,
  onCancel,
}: {
  initialText: string;
  busy?: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!initialText.trim());
  function save() {
    const el = editableRef.current;
    if (!el || busy) return;
    const v = serializeEditable(el).trim();
    if (!v) return;
    onSave(v);
  }
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <FormatToolbar editableRef={editableRef} />
      <RichEditable
        editableRef={editableRef}
        placeholder=""
        minHeight={40}
        padClassName="px-3 py-2"
        initialHtml={richTextToHtml(initialText)}
        onEmptyChange={setIsEmpty}
        onEnterSubmit={save}
      />
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-[#9A9A9A] hover:text-[#111111] px-2 py-1">
          취소
        </button>
        <button
          type="button"
          disabled={busy || isEmpty}
          onClick={save}
          className="text-xs font-semibold text-white bg-[#FF4103] rounded-lg px-3 py-1.5 disabled:opacity-60"
        >
          저장
        </button>
      </div>
    </div>
  );
}

// 칸 사이 경계선을 드래그로 당기면 폭이 바뀝니다. onDrag는 마우스가 움직인 만큼(px)을 넘겨줍니다.
// 모바일에서는 칸이 하나씩만 보이므로 기본적으로 숨기고, lg 이상에서만 보여줍니다.
export function DragHandle({ onDrag, className = "hidden lg:block" }: { onDrag: (deltaPx: number) => void; className?: string }) {
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
      className={`w-1 shrink-0 cursor-col-resize bg-black/5 hover:bg-[#FF4103]/40 active:bg-[#FF4103]/60 transition-colors ${className}`}
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
  onEditReply,
  onClose,
  width = 380,
}: {
  viewerRole: "admin" | "user";
  parent: { label: string; text: string; attachments?: Attachment[]; time: string };
  replies: MessageReply[];
  busy: boolean;
  error: string;
  onSend: (text: string) => void;
  onEditReply?: (replyId: string, text: string) => void;
  onClose: () => void;
  width?: number;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  function submit() {
    const el = editableRef.current;
    if (!el || busy) return;
    const v = serializeEditable(el).trim();
    if (!v) return;
    onSend(v);
    el.innerHTML = "";
    setIsEmpty(true);
  }
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [replies.length]);
  return (
    <div
      style={{ "--thread-w": `${width}px` } as React.CSSProperties}
      className="flex w-full lg:w-[var(--thread-w)] lg:shrink-0 border-l border-black/10 flex-col min-h-0 bg-white"
    >
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
          {parent.text && <div className="text-sm whitespace-pre-wrap text-[#111111]">{renderRichText(parent.text)}</div>}
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
        {replies.map((r) => {
          const own = r.sender === viewerRole;
          if (editingReplyId === r.id) {
            return (
              <div key={r.id} className="flex flex-col gap-1 items-end">
                <InlineEditBox
                  initialText={r.text}
                  onSave={(text) => {
                    onEditReply?.(r.id, text);
                    setEditingReplyId(null);
                  }}
                  onCancel={() => setEditingReplyId(null)}
                />
              </div>
            );
          }
          return (
            <div key={r.id} className={`flex flex-col gap-1 ${own ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                  own ? "bg-[#FF4103] text-white rounded-br-md" : "bg-[#F4F4F2] text-[#111111] rounded-bl-md"
                }`}
              >
                {renderRichText(r.text)}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-[#B0B0B0]">{fmtThreadTime(r.created_at)}</div>
                {own && onEditReply && (
                  <button
                    type="button"
                    onClick={() => setEditingReplyId(r.id)}
                    aria-label="수정"
                    className="text-[#B0B0B0] hover:text-[#FF4103]"
                  >
                    <Pencil className="w-3 h-3" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-black/10 px-4 py-3">
        <FormatToolbar editableRef={editableRef} />
        <div className="flex gap-2 items-end">
          <RichEditable
            editableRef={editableRef}
            placeholder="답글 남기기…"
            minHeight={40}
            padClassName="px-3 py-2"
            onEmptyChange={setIsEmpty}
            onEnterSubmit={submit}
          />
          <button
            type="button"
            disabled={busy || isEmpty}
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
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

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

  async function editThreadReply(replyId: string, text: string) {
    const supabase = createClient();
    const { error: err } = await supabase.from("message_replies").update({ text }).eq("id", replyId);
    if (!err) setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, text } : r)));
  }

  async function editQuestion(questionId: string, text: string) {
    const supabase = createClient();
    const { error: err } = await supabase.from("questions").update({ question: text }).eq("id", questionId);
    if (!err) setItems((prev) => prev.map((it) => (it.id === questionId ? { ...it, question: text } : it)));
    setEditingQuestionId(null);
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

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = editableRef.current ? serializeEditable(editableRef.current).trim() : "";
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
      if (editableRef.current) editableRef.current.innerHTML = "";
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
    <div className={`${openThread ? "hidden" : "flex"} lg:flex flex-1 min-w-[300px] flex-col min-h-0`}>
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
              if (editingQuestionId === m.questionId) {
                return (
                  <div key={m.key} className="flex flex-col gap-1 items-end">
                    <div className="max-w-[85%] w-full">
                      <InlineEditBox
                        initialText={m.text}
                        onSave={(text) => editQuestion(m.questionId, text)}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.key} className="flex flex-col gap-1 items-end">
                  <div className="max-w-[85%] flex flex-col gap-2 items-end">
                    {m.text && (
                      <div className="bg-[#FF4103] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap font-medium">
                        {renderRichText(m.text)}
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
                  <div className="flex items-center gap-2">
                    <ReactionTrigger
                      reaction={m.reaction}
                      align="end"
                      open={openReactionFor === m.key}
                      onToggle={() => setOpenReactionFor((k) => (k === m.key ? null : m.key))}
                      onPick={(emoji) => setReaction(m.questionId, "question", emoji)}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingQuestionId(m.questionId)}
                      aria-label="수정"
                      className="text-[#C4C4C4] hover:text-[#FF4103]"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  {replyTrigger(m.questionId, "question", "end")}
                </div>
              );
            }
            if (m.kind === "answer") {
              return (
                <div key={m.key} className="flex flex-col gap-1 items-start">
                  <div className="max-w-[92%] w-full bg-[#FAFAF9] border border-[rgba(255,65,3,0.35)] rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap text-[#111111]">
                    <div className="text-[10.5px] font-bold text-[#FF4103] mb-1">이드의 답변</div>
                    {renderRichText(m.text)}
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
          <FormatToolbar editableRef={editableRef} />
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
            <RichEditable
              editableRef={editableRef}
              placeholder="이드에게 궁금한 걸 남겨보세요…"
              minHeight={24}
              padClassName="px-4 py-3"
              onEnterSubmit={() => submit()}
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
        onEditReply={editThreadReply}
        onClose={() => setOpenThread(null)}
      />
      </>
    )}
    </div>
  );
}
