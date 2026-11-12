"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, FileText, Pencil, Plus, StickyNote, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type CoffeeChatStatus = "booked" | "cancelled" | "declined" | "completed";

export type CoffeeChat = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_format: string;
  scheduled_at: string | null;
  requested_at: string | null;
  status: CoffeeChatStatus;
  notes: string;
  memo: string;
  confirmed: boolean;
  created_at: string;
};

const FILTER_INPUT =
  "w-full min-w-0 border border-black/15 rounded-md px-2 py-1 text-xs bg-white text-[#111111] placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF4103]";

const FORM_INPUT =
  "border border-black/15 rounded-lg px-3 py-2 text-sm bg-white text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103] w-full";

const STATUS_OPTIONS: { value: CoffeeChatStatus; label: string }[] = [
  { value: "booked", label: "예정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소됨" },
  { value: "declined", label: "거절됨" },
];

const STATUS_DISPLAY: Record<CoffeeChatStatus, { label: string; cls: string }> = {
  booked: { label: "예정", cls: "bg-[rgba(255,65,3,0.1)] text-[#FF4103]" },
  completed: { label: "완료", cls: "bg-[rgba(16,185,129,0.12)] text-[#10B981]" },
  cancelled: { label: "취소됨", cls: "bg-[#F4F4F2] text-[#9A9A9A]" },
  declined: { label: "거절됨", cls: "bg-[#F4F4F2] text-[#9A9A9A]" },
};

function fmtDateTime(t: string | null) {
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
function isoToTimeOnly(iso: string | null): string {
  if (!iso) return "-";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("hour")}:${get("minute")}`;
}
function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
function isPastDate(iso: string | null, today: string): boolean {
  const key = isoToLocalInput(iso, false);
  return !!key && key < today;
}
function localInputToIso(v: string, withTime: boolean): string | null {
  if (!v) return null;
  return withTime ? `${v}:00+09:00` : `${v}T00:00:00+09:00`;
}

function csvCell(v: string | null) {
  const t = (v ?? "").replace(/"/g, '""');
  return `"${/^[=+\-@]/.test(t) ? "'" + t : t}"`;
}

type Filters = {
  name: string;
  email: string;
  phone: string;
  company: string;
  format: string;
  status: "all" | "upcoming" | "completed" | "cancelled";
  confirmed: "all" | "yes" | "no";
};
const EMPTY_FILTERS: Filters = { name: "", email: "", phone: "", company: "", format: "", status: "all", confirmed: "all" };

type SortKey = "name" | "email" | "phone" | "company" | "format" | "scheduled" | "status" | "confirmed";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const TH = "text-left text-[11px] font-semibold text-[#9A9A9A] px-2.5 pt-2.5 pb-1.5 whitespace-nowrap";

function SortTh({ label, sortKey, sort, onToggle }: { label: string; sortKey: SortKey; sort: Sort | null; onToggle: (key: SortKey) => void }) {
  const active = sort?.key === sortKey;
  return (
    <th className={TH}>
      <button type="button" onClick={() => onToggle(sortKey)} className="inline-flex items-center gap-0.5 hover:text-[#FF4103]">
        {label}
        {active ? (
          sort!.dir === "asc" ? (
            <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
          )
        ) : (
          <ChevronDown className="w-3 h-3 text-black/15" strokeWidth={2.5} />
        )}
      </button>
    </th>
  );
}

function FilterSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={FILTER_INPUT} aria-label="필터">
      <option value="">전체</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

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
  const [today] = useState(todayKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CoffeeChat | null>(null);
  const [memoFor, setMemoFor] = useState<CoffeeChat | null>(null);
  const [notesFor, setNotesFor] = useState<CoffeeChat | null>(null);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  async function updateStatus(c: CoffeeChat, status: CoffeeChatStatus) {
    const supabase = createClient();
    const { data, error: err } = await supabase.from("coffee_chats").update({ status }).eq("id", c.id).select().single();
    if (err || !data) {
      alert("상태를 바꾸지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onUpdate(data as CoffeeChat);
  }

  async function updateConfirmed(c: CoffeeChat, confirmed: boolean) {
    const supabase = createClient();
    const { data, error: err } = await supabase.from("coffee_chats").update({ confirmed }).eq("id", c.id).select().single();
    if (err || !data) {
      alert("확인 상태를 바꾸지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onUpdate(data as CoffeeChat);
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
    const rows = coffeeChats.filter((c) => {
      if (filters.name && c.name !== filters.name) return false;
      if (filters.email && c.email !== filters.email) return false;
      if (filters.phone && c.phone !== filters.phone) return false;
      if (filters.company && c.company !== filters.company) return false;
      if (filters.format && c.preferred_format !== filters.format) return false;
      if (filters.status === "upcoming" && c.status !== "booked") return false;
      if (filters.status === "completed" && c.status !== "completed") return false;
      if (filters.status === "cancelled" && c.status !== "cancelled" && c.status !== "declined") return false;
      if (filters.confirmed === "yes" && !c.confirmed) return false;
      if (filters.confirmed === "no" && c.confirmed) return false;
      if (selectedDate && isoToLocalInput(c.scheduled_at, false) !== selectedDate) return false;
      return true;
    });
    if (!sort) {
      return rows.sort((a, b) => (b.requested_at || b.created_at).localeCompare(a.requested_at || a.created_at));
    }
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      switch (sort.key) {
        case "name":
          return a.name.localeCompare(b.name) * dirMul;
        case "email":
          return a.email.localeCompare(b.email) * dirMul;
        case "phone":
          return a.phone.localeCompare(b.phone) * dirMul;
        case "company":
          return a.company.localeCompare(b.company) * dirMul;
        case "format":
          return a.preferred_format.localeCompare(b.preferred_format) * dirMul;
        case "scheduled":
          return (a.scheduled_at || "").localeCompare(b.scheduled_at || "") * dirMul;
        case "status":
          return a.status.localeCompare(b.status) * dirMul;
        case "confirmed":
          return (Number(a.confirmed) - Number(b.confirmed)) * dirMul;
      }
    });
  }, [coffeeChats, filters, selectedDate, sort]);

  function exportCsv() {
    const rows = [
      ["이름", "이메일", "전화", "소속", "희망 방식", "신청일자", "예정 일시", "상태", "확인", "비고", "메모"],
      ...list.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.company,
        c.preferred_format,
        c.requested_at ? c.requested_at.slice(0, 10) : "",
        c.scheduled_at ? fmtDateTime(c.scheduled_at) : "",
        STATUS_DISPLAY[c.status].label,
        c.confirmed ? "확인됨" : "",
        c.notes,
        c.memo,
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
      if (c.status === "booked") upcoming++;
      else if (c.status === "completed") completed++;
      else cancelled++;
    }
    return { upcoming, completed, cancelled };
  }, [coffeeChats]);

  const options = useMemo(() => {
    const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return {
      name: uniq(coffeeChats.map((c) => c.name)),
      email: uniq(coffeeChats.map((c) => c.email)),
      phone: uniq(coffeeChats.map((c) => c.phone)),
      company: uniq(coffeeChats.map((c) => c.company)),
      format: uniq(coffeeChats.map((c) => c.preferred_format)),
    };
  }, [coffeeChats]);

  const th = "text-left text-[11px] font-semibold text-[#9A9A9A] px-2.5 pt-2.5 pb-1.5 whitespace-nowrap";
  const td = "px-2.5 py-2 text-xs text-[#333333] align-top";

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-3">
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
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSort(null);
              }}
              className="text-xs font-semibold text-[#9A9A9A] hover:text-[#FF4103] px-2 py-1"
            >
              필터 초기화
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#FF4103] text-white rounded-lg px-3 py-2"
            >
              <Plus className="w-4 h-4" strokeWidth={2.25} />
              수동입력
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
          <div className="border border-black/8 rounded-xl">
            <table className="border-collapse table-fixed w-full">
              <colgroup>
                <col className="w-[84px]" />
                <col className="w-[170px]" />
                <col className="w-[100px]" />
                <col className="w-[110px]" />
                <col className="w-[70px]" />
                <col className="w-[82px]" />
                <col className="w-[56px]" />
                <col className="w-[86px]" />
                <col className="w-[60px]" />
                <col className="w-[122px]" />
              </colgroup>
              <thead>
                <tr className="sticky top-20 z-10 bg-white border-b border-black/8">
                  <SortTh label="이름" sortKey="name" sort={sort} onToggle={toggleSort} />
                  <SortTh label="이메일" sortKey="email" sort={sort} onToggle={toggleSort} />
                  <SortTh label="전화" sortKey="phone" sort={sort} onToggle={toggleSort} />
                  <SortTh label="소속" sortKey="company" sort={sort} onToggle={toggleSort} />
                  <SortTh label="희망 방식" sortKey="format" sort={sort} onToggle={toggleSort} />
                  <SortTh label="예정일자" sortKey="scheduled" sort={sort} onToggle={toggleSort} />
                  <SortTh label="예정시간" sortKey="scheduled" sort={sort} onToggle={toggleSort} />
                  <SortTh label="상태" sortKey="status" sort={sort} onToggle={toggleSort} />
                  <SortTh label="확인" sortKey="confirmed" sort={sort} onToggle={toggleSort} />
                  <th className={th}>관리</th>
                </tr>
                <tr className="sticky top-[108px] z-10 border-b border-black/8 bg-[#FAFAF9]">
                  <th className="px-2.5 pb-2">
                    <FilterSelect value={filters.name} options={options.name} onChange={(v) => setFilter("name", v)} />
                  </th>
                  <th className="px-2.5 pb-2">
                    <FilterSelect value={filters.email} options={options.email} onChange={(v) => setFilter("email", v)} />
                  </th>
                  <th className="px-2.5 pb-2">
                    <FilterSelect value={filters.phone} options={options.phone} onChange={(v) => setFilter("phone", v)} />
                  </th>
                  <th className="px-2.5 pb-2">
                    <FilterSelect value={filters.company} options={options.company} onChange={(v) => setFilter("company", v)} />
                  </th>
                  <th className="px-2.5 pb-2">
                    <FilterSelect value={filters.format} options={options.format} onChange={(v) => setFilter("format", v)} />
                  </th>
                  <th className="px-2.5 pb-2" />
                  <th className="px-2.5 pb-2" />
                  <th className="px-2.5 pb-2">
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
                  <th className="px-2.5 pb-2">
                    <select
                      value={filters.confirmed}
                      onChange={(e) => setFilter("confirmed", e.target.value as Filters["confirmed"])}
                      className={FILTER_INPUT}
                      aria-label="확인 필터"
                    >
                      <option value="all">전체</option>
                      <option value="yes">확인됨</option>
                      <option value="no">미확인</option>
                    </select>
                  </th>
                  <th className="px-2.5 pb-2" />
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-2.5 py-6 text-center text-sm text-[#9A9A9A]">
                      검색 결과가 없어요.
                    </td>
                  </tr>
                )}
                {list.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-black/8 last:border-0 ${
                      isPastDate(c.scheduled_at, today) ? "bg-[#F4F4F2] hover:bg-[#ECECE9]" : "hover:bg-[#FAFAF9]"
                    }`}
                  >
                    <td className={`${td} whitespace-nowrap overflow-hidden`} title={c.name}>
                      <span className="inline-flex items-center gap-1 max-w-full">
                        <span className="truncate font-bold text-[#111111]">{c.name || "-"}</span>
                        {c.confirmed && <Check className="w-3 h-3 text-[#FF4103] shrink-0" strokeWidth={3} />}
                      </span>
                    </td>
                    <td className={`${td} truncate`} title={c.email}>
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="hover:text-[#FF4103] hover:underline">
                          {c.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={`${td} truncate`} title={c.phone}>
                      {c.phone || "-"}
                    </td>
                    <td className={`${td} truncate`} title={c.company}>
                      {c.company || "-"}
                    </td>
                    <td className={`${td} truncate`} title={c.preferred_format}>
                      {c.preferred_format || "-"}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{isoToLocalInput(c.scheduled_at, false) || "-"}</td>
                    <td className={`${td} whitespace-nowrap`}>{isoToTimeOnly(c.scheduled_at)}</td>
                    <td className={td}>
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c, e.target.value as CoffeeChatStatus)}
                        className={`w-full text-[10.5px] font-semibold rounded-full pl-2 pr-1 py-0.5 border-0 focus:outline-none focus:ring-2 focus:ring-[#FF4103] ${STATUS_DISPLAY[c.status].cls}`}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => updateConfirmed(c, !c.confirmed)}
                        aria-label="확인"
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          c.confirmed ? "bg-[#FF4103] border-[#FF4103]" : "border-black/20 hover:border-[#FF4103]"
                        }`}
                      >
                        {c.confirmed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setNotesFor(c)}
                          aria-label="비고"
                          className="relative p-1.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
                        >
                          <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                          {c.notes && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FF4103] rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemoFor(c)}
                          aria-label="메모"
                          className="relative p-1.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[rgba(255,65,3,0.08)]"
                        >
                          <StickyNote className="w-3.5 h-3.5" strokeWidth={2} />
                          {c.memo && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FF4103] rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[360px] shrink-0 xl:sticky xl:top-20 xl:self-start">
        <CoffeeChatCalendar coffeeChats={coffeeChats} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {showAdd && <AddDialog onClose={() => setShowAdd(false)} onAdded={(c) => { onAdd(c); setShowAdd(false); }} />}

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

      {notesFor && (
        <QuickNoteDialog
          key={`notes-${notesFor.id}`}
          coffeeChat={notesFor}
          field="notes"
          title="비고"
          placeholder="신청 시 비고를 입력하세요"
          onClose={() => setNotesFor(null)}
          onSaved={(c) => {
            onUpdate(c);
            setNotesFor(null);
          }}
        />
      )}

      {memoFor && (
        <QuickNoteDialog
          key={`memo-${memoFor.id}`}
          coffeeChat={memoFor}
          field="memo"
          title="메모"
          placeholder="메모를 입력하세요"
          onClose={() => setMemoFor(null)}
          onSaved={(c) => {
            onUpdate(c);
            setMemoFor(null);
          }}
        />
      )}
    </div>
  );
}

function CoffeeChatCalendar({
  coffeeChats,
  selectedDate,
  onSelectDate,
}: {
  coffeeChats: CoffeeChat[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const [viewDate, setViewDate] = useState(() => (selectedDate ? new Date(selectedDate) : new Date()));

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CoffeeChat[]>();
    for (const c of coffeeChats) {
      const key = isoToLocalInput(c.scheduled_at, false);
      if (!key) continue;
      const arr = m.get(key);
      if (arr) arr.push(c);
      else m.set(key, [c]);
    }
    return m;
  }, [coffeeChats]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return (
    <div className="border border-black/8 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="이전 달"
          className="p-1.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[#F4F4F2]"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.25} />
        </button>
        <span className="text-base font-bold text-[#111111]">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="다음 달"
          className="p-1.5 rounded-md text-[#9A9A9A] hover:text-[#FF4103] hover:bg-[#F4F4F2]"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.25} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-[#9A9A9A] mb-1.5">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={`blank-${i}`} />;
          const key = dateKey(d);
          const events = eventsByDate.get(key) || [];
          const isSelected = selectedDate === key;
          return (
            <div key={key} className="group relative">
              <button
                type="button"
                onClick={() => onSelectDate(isSelected ? null : key)}
                className={`w-full aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "bg-[#FF4103] text-white"
                    : events.length > 0
                      ? "bg-[rgba(255,65,3,0.08)] text-[#111111] hover:bg-[rgba(255,65,3,0.15)]"
                      : "text-[#9A9A9A] hover:bg-[#F4F4F2]"
                }`}
              >
                <span>{d}</span>
                {events.length > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#FF4103]"}`} />}
              </button>
              {events.length > 0 && (
                <div className="hidden group-hover:block absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#111111] text-white text-[11px] rounded-lg px-3 py-2 shadow-lg whitespace-nowrap pointer-events-none">
                  {events.map((e) => (
                    <div key={e.id}>
                      {e.name || "-"} · {e.company || "-"} · {isoToTimeOnly(e.scheduled_at)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <button type="button" onClick={() => onSelectDate(null)} className="mt-3 text-xs text-[#9A9A9A] hover:text-[#FF4103] w-full text-center">
          선택 해제 · 전체 보기
        </button>
      )}
    </div>
  );
}

type AddFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_format: string;
  requested_date: string;
  scheduled_at: string;
  status: CoffeeChatStatus;
  notes: string;
};
const EMPTY_ADD_FORM: AddFormState = {
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

function AddDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (c: CoffeeChat) => void }) {
  const [form, setForm] = useState<AddFormState>(EMPTY_ADD_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function setField<K extends keyof AddFormState>(key: K, value: AddFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      setError("이름과 이메일은 꼭 입력해주세요.");
      return;
    }
    setBusy(true);
    setError("");
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
    setBusy(false);
    if (err || !data) {
      setError("추가하지 못했어요: " + (err?.message || "알 수 없는 오류"));
      return;
    }
    onAdded(data as CoffeeChat);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md flex flex-col gap-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#111111]">커피챗 직접 추가</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 text-[#9A9A9A] hover:text-[#111111]">
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
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
          <select value={form.status} onChange={(e) => setField("status", e.target.value as CoffeeChatStatus)} className={FORM_INPUT}>
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
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#9A9A9A] px-3 py-2">
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="inline-flex items-center gap-1.5 bg-[#FF4103] text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            {busy ? "추가하는 중…" : "추가"}
          </button>
        </div>
      </div>
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
  const [memo, setMemo] = useState(coffeeChat.memo);
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
        memo: memo.trim(),
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
        <select value={status} onChange={(e) => setStatus(e.target.value as CoffeeChatStatus)} className={FORM_INPUT}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
          비고 (신청 시 내용)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="비고" className={`${FORM_INPUT} resize-none`} />
        </label>
        <label className="text-xs text-[#9A9A9A] flex flex-col gap-1">
          메모 (관리자 메모)
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="메모" className={`${FORM_INPUT} resize-none`} />
        </label>
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

function QuickNoteDialog({
  coffeeChat,
  field,
  title,
  placeholder,
  onClose,
  onSaved,
}: {
  coffeeChat: CoffeeChat;
  field: "notes" | "memo";
  title: string;
  placeholder: string;
  onClose: () => void;
  onSaved: (c: CoffeeChat) => void;
}) {
  const [value, setValue] = useState(coffeeChat[field]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("coffee_chats")
      .update({ [field]: value.trim() })
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
      <div className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#111111]">
            {coffeeChat.name} · {title}
          </p>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 text-[#9A9A9A] hover:text-[#111111]">
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder={placeholder}
          autoFocus
          className={`${FORM_INPUT} resize-none`}
        />
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
