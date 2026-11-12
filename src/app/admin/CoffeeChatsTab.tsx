"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

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

function fmtDate(t: string | null) {
  if (!t) return "-";
  return new Date(t).toLocaleString("ko-KR", { year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
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

export default function CoffeeChatsTab({ coffeeChats }: { coffeeChats: CoffeeChat[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
          <table className="w-full border-collapse min-w-[860px]">
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
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-sm text-[#9A9A9A]">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
