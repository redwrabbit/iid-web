import { createClient } from "@/lib/supabase/server";
import { buildSiteData, type SectionKey, type SiteData } from "@/lib/site-sections";

// 관리자 화면에서 고친 문구를 읽는다. 테이블이 없거나 비어 있으면 src/content 기본값이 그대로 쓰인다.
export async function getStoredContent(): Promise<Partial<Record<SectionKey, unknown>>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("key, data");
    const out: Partial<Record<SectionKey, unknown>> = {};
    for (const r of data || []) out[r.key as SectionKey] = r.data;
    return out;
  } catch {
    return {};
  }
}

export async function getSiteData(): Promise<SiteData> {
  return buildSiteData(await getStoredContent());
}
