// Google Calendar 약속 예약 서비스가 "커피챗" 예약/취소/거절 때 보내는 자동 메일을 파싱한다.
// 메일 3종류가 있고 본문 레이아웃이 조금씩 달라서(거절 메일은 HTML 태그 잔재가 섞여온다),
// 태그를 제거하고 줄 단위로 맞춰 "예약자:/회사명/선호 방식" 레이블 뒤 값을 읽는 방식으로 통일한다.

export type CoffeeChatStatus = "booked" | "cancelled" | "declined" | "completed";

export type ParsedCoffeeChatEvent = {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_format: string;
  scheduled_at: string | null;
  status: CoffeeChatStatus;
  notes: string;
};

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "\n");
}

function statusFromSubject(subject: string): CoffeeChatStatus | null {
  if (/^\[약속 거절\]/.test(subject)) return "declined";
  if (/^예약이 취소되었습니다\./.test(subject)) return "cancelled";
  if (/^(약속 예약됨|\[약속 수락\])/.test(subject)) return "booked";
  return null;
}

function extractScheduledAt(text: string): string | null {
  const m = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*\([^)]*\)[^\n]*?(오전|오후)\s*(\d{1,2})(?::(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, ampm, h, min] = m;
  let hour = parseInt(h, 10) % 12;
  if (ampm === "오후") hour += 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(parseInt(mo, 10))}-${pad(parseInt(d, 10))}T${pad(hour)}:${pad(min ? parseInt(min, 10) : 0)}:00+09:00`;
}

function fieldAfterLabel(lines: string[], labelPattern: RegExp): string {
  const idx = lines.findIndex((l) => labelPattern.test(l));
  if (idx === -1) return "";
  return lines[idx + 1] || "";
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  const m = digits.match(/^(\d{3})(\d{3,4})(\d{4})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : raw;
}

/** 메일 1건을 파싱한다. 커피챗 예약/취소/거절 메일이 아니면 null을 반환한다. */
export function parseCoffeeChatEmail(subject: string, body: string): ParsedCoffeeChatEvent | null {
  if (!subject.includes("커피챗")) return null;
  const status = statusFromSubject(subject);
  if (!status) return null;

  const lines = stripTags(body)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bookerIdx = lines.findIndex((l) => /^예약자\s*:?$/.test(l));
  if (bookerIdx === -1) return null;
  const name = lines[bookerIdx + 1] || "";
  const email = lines[bookerIdx + 2] || "";
  const phone = lines[bookerIdx + 3] || "";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const company = fieldAfterLabel(lines, /^회사명$/);
  const preferred_format = fieldAfterLabel(lines, /^선호 방식/);

  return {
    name,
    email,
    phone: normalizePhone(phone),
    company,
    preferred_format,
    scheduled_at: extractScheduledAt(body),
    status,
    notes: "",
  };
}
