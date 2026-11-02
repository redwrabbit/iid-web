import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { buildSiteData, type SectionKey, type SiteData } from "@/lib/site-sections";

// site_content는 누구나 읽을 수 있는 공개 테이블이라, 쿠키가 필요 없는 가벼운 클라이언트로 읽는다
// (이래야 아래 unstable_cache로 캐싱도 할 수 있다 — 쿠키 기반 클라이언트는 캐시 함수 안에서 쓸 수 없다).
function publicSupabase() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function fetchStoredContent(): Promise<Partial<Record<SectionKey, unknown>>> {
  try {
    const { data } = await publicSupabase().from("site_content").select("key, data");
    const out: Partial<Record<SectionKey, unknown>> = {};
    for (const r of data || []) out[r.key as SectionKey] = r.data;
    return out;
  } catch {
    return {};
  }
}

// 관리자 화면(편집용)은 캐싱 없이 항상 최신 상태를 읽는다.
export async function getStoredContent(): Promise<Partial<Record<SectionKey, unknown>>> {
  return fetchStoredContent();
}

// 공개 페이지(서비스/자료)는 매 요청마다 Supabase를 왕복하지 않도록 60초 캐싱한다.
const getCachedStoredContent = unstable_cache(fetchStoredContent, ["site-content"], { revalidate: 60 });

export async function getSiteData(): Promise<SiteData> {
  return buildSiteData(await getCachedStoredContent());
}
