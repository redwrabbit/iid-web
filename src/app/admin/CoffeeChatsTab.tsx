"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type CoffeeChat = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_format: string;
  scheduled_at: string | null;
  requested_at: string | null;
  status: "booked" | "cancelled" | "declined" | "completed";
  notes: string;
  created_at: string;
};

const FILTER_INPUT =
  "w-full border border-black/15 rounded-md px-2 py-1 text-xs bg-white text-[#111111] placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF4103]";

const FORM_INPUT =
  "border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103] w-full";

const STATUS_OPTIONS: { value: CoffeeChat["status"]; label: string }[] = [
  { value: "booked", label: "예정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소됨" },
  { value: "declined", label: "거절됨" },
];

function fmtDate(t: string | null) {
  if (!t) return "-";
  return new Date(t).toLocaleString("ko-KR", { year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// datetime-local/date input ↔ ISO 문자열(한국 시간 기준으로 왕복한다)
function isoToLocalInput(iso: string | null, withTime: boolean) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return withTime ? `${date}T${get("hour")}:${get("minute")}` : date;
}
function localInputToIso(v: string, withTime: boolean): string | null {
  if (!v) return null;
  return withTime ? `${v}:00+09:00` : `${v}T00:00:00+09:00`;
}

// 저장된 status(booked/cancelled/declined/completed)에, 지난 일정인데 취소/거절이 아니면 "완료"로 보이게 한다.
function displayStatus(c: CoffeeChat): { label: string; cls: string } {
  if (c.status === "cancelled") return { label: "취소됨", cls: "bg-[#F4F4F2] text-[#9A9A9A]" };
  if (c.status === "declined") return { label: "거절됨", cls: "bg-[#F4F4F2] text-[#9A9A9A]" };
  if (c.status === "completed") return { label: "완료", cls: "bg-[rgba(16,185,129,0.12)] text-[#10B981]" };
  if (c.scheduled_at && new Date(c.scheduled_at).getTime() < Date.now()) return { label: "완료", cls: "bg-[rgba(16,185,129,0.12)] text-[#10B981]" };
  return { label: "예정", cls: "bg-[rgba(255,65,3,0.1)] text-[#FF4103]" };
}

function csvCell(v: string | null) {
  const t = (v ?? "").replace(/"/g, '""');
  return `"${/^[=+\-@]/.test(t) ? "'" + t : t}"`;
}

type Filters = { name: string; email: string; phone: string; company: string; format: string; status: "all" | "upcoming" | "completed" | "cancelled" };
const EMPTY_FILTERS: Filters = { name: "", email: "", phone: "", company: "", format: "", status: "all" };

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_format: string;
  requested_date: string;
  scheduled_at: string;
  status: CoffeeChat["status"];
  notes: string;
};
const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  preferred_format: "",
  requested_date: "",
  scheduled_at: "",
  status: "booked",
  notes: "",
};

export default function CoffeeChatsTab({
  coffeeChats,
  onAdd,
  onUpdate,
  onDelete,
}: {
  coffeeChats: CoffeeChat[];
  onAdd: (c: CoffeeChat) => void;
  onUpdate: (c: CoffeeChat) => void;
  onDelete: (id: string) => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [editing, setEditing] = useState<CoffeeChat | null>(null);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitAdd() {
    if (!form.name.trim() || !form.email.trim()) {
      setAddError("이름과 이메일은 꼭 입력해주세요.");
      return;
    }
    setAddBusy(true);
    setAddError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("coffee_chats")
      .insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        preferred_format: form.preferred_format.trim(),
        requested_at: localInputToIso(form.requested_date, false),
        scheduled_at: localInputToIso(form.scheduled_at, true),
        status: form.status,
        notes: form.notes.trim(),
      })
      .select()
      .single();
    setAddBusy(false);
    if (err || !data) {
      setAddError("추가하지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onAdd(data as CoffeeChat);
    setForm(EMPTY_FORM);
  }

  async function remove(id: string) {
    if (!confirm("이 커피챗 기록을 삭제할까요?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("coffee_chats").delete().eq("id", id);
    if (err) {
      alert("삭제하지 못했어요: " + err.message);
      return;
    }
    onDelete(id);
  }

  const list = useMemo(() => {
    const nameK = filters.name.trim().toLowerCase();
    const emailK = filters.email.trim().toLowerCase();
    const phoneK = filters.phone.trim().toLowerCase();
    const companyK = filters.company.trim().toLowerCase();
    const formatK = filters.format.trim().toLowerCase();
    const rows = coffeeChats.filter((c) => {
      if (nameK && !c.name.toLowerCase().includes(nameK)) return false;
      if (emailK && !c.email.toLowerCase().includes(emailK)) return false;
      if (phoneK && !c.phone.toLowerCase().includes(phoneK)) return false;
      if (companyK && !c.company.toLowerCase().includes(companyK)) return false;
      if (formatK && !c.preferred_format.toLowerCase().includes(formatK)) return false;
      if (filters.status !== "all") {
        const label = displayStatus(c).label;
        if (filters.status === "upcoming" && label !== "예정") return false;
        if (filters.status === "completed" && label !== "완료") return false;
        if (filters.status === "cancelled" && label !== "취소됨" && label !== "거절됨") return false;
      }
      return true;
    });
    return rows.sort((a, b) => (b.requested_at || b.created_at).localeCompare(a.requested_at || a.created_at));
  }, [coffeeChats, filters]);

  function exportCsv() {
    const rows = [
      ["이름", "이메일", "전화", "소속", "희망 방식", "신청일자", "예정 일시", "상태", "비고"],
      ...list.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.company,
        c.preferred_format,
        c.requested_at ? c.requested_at.slice(0, 10) : "",
        c.scheduled_at ? fmtDate(c.scheduled_at) : "",
        displayStatus(c).label,
        c.notes,
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `coffee-chats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = useMemo(() => {
    let upcoming = 0,
      completed = 0,
      cancelled = 0;
    for (const c of coffeeChats) {
      const label = displayStatus(c).label;
      if (label === "예정") upcoming++;
      else if (label === "완료") completed++;
      else cancelled++;
    }
    return { upcoming, completed, cancelled };
  }, [coffeeChats]);

  const th = "text-left text-[11px] font-semibold text-[#9A9A9A] px-3 pt-2.5 pb-1.5 whitespace-nowrap";
  const td = "px-3 py-2 text-xs text-[#333333] align-top";

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#FAFAF9] border border-black/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-[#111111]">커피챗 직접 추가</p>
        <p className="text-xs text-[#9A9A9A] -mt-1">메일로 안 걸러지는 건은 여기서 직접 입력해요.</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="이름" className={FORM_INPUT} />
          <input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="이메일" className={FORM_INPUT} />
          <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="전화" className={FORM_INPUT} />
          <input value={form.company} onChange={(e) => setField("company", e.target.value)} placeholder="소속" className={FORM_INPUT} />
          <input
            value={form.preferred_format}
            onChange={(e) => setField("preferred_format", e.target.value)}
            placeholder="희망 방식 (선택)"
            className={FORM_INPUT}
          />
          <select value={form.status} onChange={(e) => setField("status", e.target.value as CoffeeChat["status"])} className={FORM_INPUT}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
            신청일자
            <input type="date" value={form.requested_date} onChange={(e) => setField("requested_date", e.target.value)} className={FORM_INPUT} />
          </label>
          <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
            예정 일시
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setField("scheduled_at", e.target.value)} className={FORM_INPUT} />
          </label>
        </div>
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          placeholder="비고 (선택)"
          className={`${FORM_INPUT} resize-none`}
        />
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <button
            type="button"
            disabled={addBusy}
            onClick={submitAdd}
            className="inline-flex items-center gap-1.5 bg-[#FF4103] text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            {addBusy ? "추가하는 중…" : "커피챗 추가"}
          </button>
        </div>
        {addError && <p className="text-xs text-red-600">{addError}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "예정", value: counts.upcoming },
          { label: "완료", value: counts.completed },
          { label: "취소/거절", value: counts.cancelled },
        ].map((c) => (
          <div key={c.label} className="bg-[#FAFAF9] border border-black/8 rounded-xl px-4 py-3">
            <div className="text-[11px] text-[#9A9A9A]">{c.label}</div>
            <div className="text-xl font-bold text-[#111111]">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-[#9A9A9A]">
          {list.length}건 / 전체 {coffeeChats.length}건
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-semibold text-[#9A9A9A] hover:text-[#FF4103] px-2 py-1"
          >
            필터 초기화
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={list.length === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold border border-black/15 rounded-lg px-3 py-2 text-[#333333] hover:text-[#FF4103] disabled:opacity-50"
          >
            <Download className="w-4 h-4" strokeWidth={2.25} />
            CSV 내보내기
          </button>
        </div>
      </div>

      {coffeeChats.length === 0 ? (
        <p className="text-sm text-[#9A9A9A]">아직 등록된 커피챗 내역이 없어요.</p>
      ) : (
        <div className="overflow-x-auto border border-black/8 rounded-xl">
          <table className="w-full border-collapse min-w-[940px]">
            <thead>
              <tr className="border-b border-black/8">
                <th className={th}>이름</th>
                <th className={th}>이메일</th>
                <th className={th}>전화</th>
                <th className={th}>소속</th>
                <th className={th}>희망 방식</th>
                <th className={th}>신청일자</th>
                <th className={th}>예정 일시</th>
                <th className={th}>상태</th>
                <th className={th}>비고</th>
                <th className={th}>관리</th>
              </tr>
              <tr className="border-b border-black/8 bg-[#FAFAF9]">
                <th className="px-3 pb-2">
                  <input value={filters.name} onChange={(e) => setFilter("name", e.target.value)} placeholder="검색" className={FILTER_INPUT} />
                </th>
                <th className="px-3 pb-2">
                  <input value={filters.email} onChange={(e) => setFilter("email", e.target.value)} placeholder="검색" className={FILTER_INPUT} />
                </th>
                <th className="px-3 pb-2">
                  <input value={filters.phone} onChange={(e) => setFilter("phone", e.target.value)} placeholder="검색" className={FILTER_INPUT} />
                </th>
                <th className="px-3 pb-2">
                  <input value={filters.company} onChange={(e) => setFilter("company", e.target.value)} placeholder="검색" className={FILTER_INPUT} />
                </th>
                <th className="px-3 pb-2">
                  <input value={filters.format} onChange={(e) => setFilter("format", e.target.value)} placeholder="검색" className={FILTER_INPUT} />
                </th>
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilter("status", e.target.value as Filters["status"])}
                    className={FILTER_INPUT}
                    aria-label="상태 필터"
                  >
                    <option value="all">전체</option>
                    <option value="upcoming">예정</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소/거절</option>
                  </select>
                </th>
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-sm text-[#9A9A9A]">
                    검색 결과가 없어요.
                  </td>
                </tr>
              )}
              {list.map((c) => {
                const status = displayStatus(c);
                return (
                  <tr key={c.id} className="border-b border-black/8 last:border-0 hover:bg-[#FAFAF9]">
                    <td className={`${td} font-bold text-[#111111] whitespace-nowrap`}>{c.name || "-"}</td>
                    <td className={td}>
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="hover:text-[#FF4103] hover:underline">
                          {c.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{c.phone || "-"}</td>
                    <td className={td}>{c.company || "-"}</td>
                    <td className={td}>{c.preferred_format || "-"}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(c.requested_at)}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(c.scheduled_at)}</td>
                    <td className={td}>
                      <span className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`${td} max-w-[160px] truncate`} title={c.notes}>
                      {c.notes || ""}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          aria-label="편집"
                          className="p-1.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          aria-label="삭제"
                          className="p-1.5 rounded-md text-[#9A9A9A] hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditDialog
          key={editing.id}
          coffeeChat={editing}
          onClose={() => setEditing(null)}
          onSaved={(c) => {
            onUpdate(c);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ coffeeChat, onClose, onSaved }: { coffeeChat: CoffeeChat; onClose: () => void; onSaved: (c: CoffeeChat) => void }) {
  const [name, setName] = useState(coffeeChat.name);
  const [email, setEmail] = useState(coffeeChat.email);
  const [phone, setPhone] = useState(coffeeChat.phone);
  const [company, setCompany] = useState(coffeeChat.company);
  const [format, setFormat] = useState(coffeeChat.preferred_format);
  const [requestedDate, setRequestedDate] = useState(isoToLocalInput(coffeeChat.requested_at, false));
  const [scheduledAt, setScheduledAt] = useState(isoToLocalInput(coffeeChat.scheduled_at, true));
  const [status, setStatus] = useState(coffeeChat.status);
  const [notes, setNotes] = useState(coffeeChat.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || !email.trim()) {
      setError("이름과 이메일은 꼭 입력해주세요.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("coffee_chats")
      .update({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        preferred_format: format.trim(),
        requested_at: localInputToIso(requestedDate, false),
        scheduled_at: localInputToIso(scheduledAt, true),
        status,
        notes: notes.trim(),
      })
      .eq("id", coffeeChat.id)
      .select()
      .single();
    setBusy(false);
    if (err || !data) {
      setError("저장하지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onSaved(data as CoffeeChat);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md flex flex-col gap-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#111111]">커피챗 수정</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 text-[#9A9A9A] hover:text-[#111111]">
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className={FORM_INPUT} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className={FORM_INPUT} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화" className={FORM_INPUT} />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="소속" className={FORM_INPUT} />
        <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="희망 방식" className={FORM_INPUT} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
            신청일자
            <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className={FORM_INPUT} />
          </label>
          <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
            예정 일시
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={FORM_INPUT} />
          </label>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as CoffeeChat["status"])} className={FORM_INPUT}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="비고" className={`${FORM_INPUT} resize-none`} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#9A9A9A] px-3 py-2">
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="bg-[#FF4103] text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {busy ? "저장하는 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
