"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SECTIONS, cleanRows, sectionOf, type Field, type Row, type SectionKey } from "@/lib/site-sections";

const INPUT =
  "border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103] w-full";

const SIZE_LABEL: Record<string, string> = { s: "s · 작게", m: "m · 중간", l: "l · 크게", half: "half · 추가 서비스(반폭)" };

export default function SiteContentTab({ stored }: { stored: Partial<Record<SectionKey, unknown>> }) {
  const [key, setKey] = useState<SectionKey>("plans");
  // 섹션마다 편집 중인 행과 저장 여부를 따로 들고 있는다
  const [rowsByKey, setRowsByKey] = useState<Partial<Record<SectionKey, Row[]>>>({});
  const [savedKeys, setSavedKeys] = useState<Set<SectionKey>>(() => new Set((Object.keys(stored) as SectionKey[]).filter((k) => cleanRows(k, stored[k]))));
  const [dirty, setDirty] = useState<Set<SectionKey>>(new Set());
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const sec = sectionOf(key);
  const rows = rowsByKey[key] ?? cleanRows(key, stored[key]) ?? sec.defaults;

  function setRows(next: Row[]) {
    setRowsByKey((p) => ({ ...p, [key]: next }));
    setDirty((p) => new Set(p).add(key));
    setMsg("");
  }
  function edit(i: number, f: Field, v: string | boolean) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [f.key]: v } : r)));
  }
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  }
  function add() {
    const blank: Row = {};
    for (const f of sec.fields) blank[f.key] = f.type === "check" ? false : f.type === "select" ? f.options![0] : "";
    setRows([...rows, blank]);
  }

  async function save() {
    const clean = rows.filter((r) => String(r[sec.titleKey] ?? "").trim());
    if (clean.length === 0) {
      setMsg("항목이 하나도 없어요. 기본값으로 되돌리려면 ‘기본값으로 되돌리기’를 눌러주세요.");
      return;
    }
    setBusy(true);
    const { error } = await createClient()
      .from("site_content")
      .upsert({ key, data: clean, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      setMsg("저장하지 못했어요: " + error.message);
      return;
    }
    setRowsByKey((p) => ({ ...p, [key]: clean }));
    setSavedKeys((p) => new Set(p).add(key));
    setDirty((p) => {
      const n = new Set(p);
      n.delete(key);
      return n;
    });
    setMsg("저장했어요. 사이트에 바로 반영돼요.");
  }

  async function reset() {
    if (!confirm("이 섹션을 처음 기본 문구로 되돌릴까요? 지금까지 고친 내용은 사라져요.")) return;
    setBusy(true);
    const { error } = await createClient().from("site_content").delete().eq("key", key);
    setBusy(false);
    if (error) {
      setMsg("되돌리지 못했어요: " + error.message);
      return;
    }
    setRowsByKey((p) => ({ ...p, [key]: sec.defaults }));
    setSavedKeys((p) => {
      const n = new Set(p);
      n.delete(key);
      return n;
    });
    setDirty((p) => {
      const n = new Set(p);
      n.delete(key);
      return n;
    });
    setMsg("기본 문구로 되돌렸어요.");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[#9A9A9A]">
        사이트에 보이는 문구를 코드 수정 없이 고쳐요. 저장하면 바로 반영되고, 고치지 않은 섹션은 기본 문구가 그대로 보여요.
      </p>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setKey(s.key);
              setMsg("");
            }}
            className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${
              key === s.key ? "bg-[#FF4103] text-white border-[#FF4103]" : "bg-white text-[#555555] border-black/15"
            }`}
          >
            {s.label}
            {dirty.has(s.key) ? " •" : savedKeys.has(s.key) ? " ✓" : ""}
          </button>
        ))}
      </div>
      <p className="text-xs text-[#6B6B6B]">
        노출 위치: <b>{sec.where}</b> · {rows.length}개
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={i} className="bg-[#FAFAF9] border border-black/8 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#9A9A9A]">
                {i + 1}. {String(r[sec.titleKey] || "새 항목")}
              </span>
              <div className="flex">
                <button type="button" aria-label="위로" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-[#9A9A9A] hover:text-[#111111] disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" aria-label="아래로" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-1.5 text-[#9A9A9A] hover:text-[#111111] disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-[#9A9A9A] hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sec.fields.map((f) => (
                <label key={f.key} className={`flex flex-col gap-1 text-[11px] text-[#6B6B6B] ${f.wide ? "sm:col-span-2" : ""}`}>
                  {f.type !== "check" && f.label}
                  {f.type === "text" && <input value={String(r[f.key] ?? "")} onChange={(e) => edit(i, f, e.target.value)} className={INPUT} />}
                  {f.type === "textarea" && <textarea rows={2} value={String(r[f.key] ?? "")} onChange={(e) => edit(i, f, e.target.value)} className={`${INPUT} resize-y`} />}
                  {f.type === "select" && (
                    <select value={String(r[f.key] ?? "")} onChange={(e) => edit(i, f, e.target.value)} className={INPUT}>
                      {f.options!.map((o) => (
                        <option key={o} value={o}>
                          {SIZE_LABEL[o] || o}
                        </option>
                      ))}
                    </select>
                  )}
                  {f.type === "check" && (
                    <span className="inline-flex items-center gap-2 text-sm text-[#333333]">
                      <input type="checkbox" checked={r[f.key] === true} onChange={(e) => edit(i, f, e.target.checked)} />
                      {f.label}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-black/15 rounded-lg px-3 py-2 text-[#333333] hover:text-[#FF4103]">
          <Plus className="w-4 h-4" strokeWidth={2.25} />
          항목 추가
        </button>
        <div className="flex-1" />
        {savedKeys.has(key) && (
          <button type="button" disabled={busy} onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 text-[#6B6B6B] hover:text-red-600">
            <RotateCcw className="w-4 h-4" />
            기본값으로 되돌리기
          </button>
        )}
        <button
          type="button"
          disabled={busy || !dirty.has(key)}
          onClick={save}
          className="inline-flex items-center gap-1.5 bg-[#FF4103] text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" strokeWidth={2.25} />
          {busy ? "저장하는 중…" : "저장"}
        </button>
      </div>
      {msg && <p className="text-xs text-[#6B6B6B]">{msg}</p>}
    </div>
  );
}
