import { extAreas, hrAreas, plans, type Plan } from "@/content/services";
import { libs, press, refs } from "@/content/library";

// 관리자 화면에서 고칠 수 있는 사이트 문구 묶음. DB(site_content)에 값이 없으면 src/content의 기본값을 쓴다.
export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "check";
  options?: string[];
  wide?: boolean;
};
export type Row = Record<string, string | boolean>;

export type SectionKey = "plans" | "hrAreas" | "extAreas" | "refs" | "press" | "libs";

type Section = {
  key: SectionKey;
  label: string;
  where: string;
  fields: Field[];
  defaults: Row[];
  titleKey: string;
};

export const SECTIONS: Section[] = [
  {
    key: "plans",
    label: "서비스 플랜",
    where: "자문/컨설팅 · 서비스 플랜(예시)",
    titleKey: "name",
    fields: [
      { key: "name", label: "플랜 이름", type: "text" },
      { key: "sub", label: "부제", type: "text" },
      { key: "period", label: "기간", type: "text" },
      { key: "size", label: "카드 크기", type: "select", options: ["s", "m", "l", "half"] },
      { key: "body", label: "설명", type: "textarea", wide: true },
      { key: "dark", label: "검은 카드로 강조", type: "check" },
    ],
    defaults: plans.map((p) => ({ name: p.name, sub: p.sub || "", period: p.period, size: p.size, body: p.body, dark: !!p.dark })),
  },
  {
    key: "hrAreas",
    label: "자문·컨설팅 영역",
    where: "자문/컨설팅 · HR 자문 · 컨설팅",
    titleKey: "name",
    fields: [
      { key: "name", label: "영역 이름", type: "text" },
      { key: "meta", label: "진행 단위", type: "text" },
      { key: "desc", label: "설명", type: "textarea", wide: true },
    ],
    defaults: hrAreas.map((a) => ({ name: a.name, meta: a.meta, desc: a.desc })),
  },
  {
    key: "extAreas",
    label: "기타·확장 영역",
    where: "자문/컨설팅 · 기타 · 확장",
    titleKey: "name",
    fields: [
      { key: "name", label: "영역 이름", type: "text" },
      { key: "meta", label: "진행 단위", type: "text" },
      { key: "desc", label: "설명", type: "textarea", wide: true },
    ],
    defaults: extAreas.map((a) => ({ name: a.name, meta: a.meta, desc: a.desc })),
  },
  {
    key: "refs",
    label: "자문 레퍼런스",
    where: "HR 아티클/자료 · 케이스 · 자료",
    titleKey: "industry",
    fields: [
      { key: "scale", label: "규모 (예: 80명)", type: "text" },
      { key: "industry", label: "업종", type: "text" },
      { key: "desc", label: "자문 내용", type: "textarea", wide: true },
    ],
    defaults: refs.map(([scale, industry, desc]) => ({ scale, industry, desc })),
  },
  {
    key: "press",
    label: "칼럼 · 강연 · 기사",
    where: "HR 아티클/자료 · 칼럼 · 강연 · 기사",
    titleKey: "title",
    fields: [
      { key: "media", label: "매체", type: "text" },
      { key: "kind", label: "구분", type: "select", options: ["칼럼", "강연", "기사", "인터뷰"] },
      { key: "title", label: "제목", type: "text", wide: true },
      { key: "url", label: "링크", type: "text", wide: true },
    ],
    defaults: press.map(([media, kind, title, url]) => ({ media, kind, title, url })),
  },
  {
    key: "libs",
    label: "자료 라이브러리",
    where: "HR 아티클/자료 · 자료 라이브러리",
    titleKey: "title",
    fields: [
      { key: "group", label: "묶음", type: "select", options: ["조직", "평가", "육성", "기타"] },
      { key: "title", label: "자료 이름", type: "text", wide: true },
    ],
    defaults: libs.map(([g, title]) => ({ group: g === "조직·평가" ? "조직" : g === "HR" ? "기타" : g, title })),
  },
];

export function sectionOf(key: SectionKey) {
  return SECTIONS.find((s) => s.key === key)!;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// DB에서 온 값을 안전한 행 목록으로 정리 (잘못된 형태면 null → 기본값 사용)
export function cleanRows(key: SectionKey, raw: unknown): Row[] | null {
  if (!Array.isArray(raw)) return null;
  const sec = sectionOf(key);
  const rows = raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => {
      const row: Row = {};
      for (const f of sec.fields) {
        if (f.type === "check") row[f.key] = r[f.key] === true;
        else {
          const v = str(r[f.key]);
          row[f.key] = f.type === "select" && f.options && !f.options.includes(v) ? f.options[0] : v;
        }
      }
      return row;
    })
    .filter((r) => !!r[sec.titleKey]);
  return rows;
}

export type SiteData = {
  plans: Plan[];
  hrAreas: { name: string; meta: string; desc: string }[];
  extAreas: { name: string; meta: string; desc: string }[];
  refs: [string, string, string][];
  press: [string, string, string, string][];
  libs: [string, string][];
};

export function buildSiteData(stored: Partial<Record<SectionKey, unknown>>): SiteData {
  const rows = (k: SectionKey) => cleanRows(k, stored[k]) ?? sectionOf(k).defaults;
  const s = (r: Row, k: string) => String(r[k] ?? "");
  return {
    plans: rows("plans").map((r) => ({
      name: s(r, "name"),
      sub: s(r, "sub") || undefined,
      period: s(r, "period"),
      body: s(r, "body"),
      size: (["s", "m", "l", "half"].includes(s(r, "size")) ? s(r, "size") : "s") as Plan["size"],
      dark: r.dark === true || undefined,
    })),
    hrAreas: rows("hrAreas").map((r) => ({ name: s(r, "name"), meta: s(r, "meta"), desc: s(r, "desc") })),
    extAreas: rows("extAreas").map((r) => ({ name: s(r, "name"), meta: s(r, "meta"), desc: s(r, "desc") })),
    refs: rows("refs").map((r) => [s(r, "scale"), s(r, "industry"), s(r, "desc")]),
    press: rows("press").map((r) => [s(r, "media"), s(r, "kind"), s(r, "title"), s(r, "url")]),
    libs: rows("libs").map((r) => [s(r, "group"), s(r, "title")]),
  };
}
