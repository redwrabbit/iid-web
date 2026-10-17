import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_CONTENT, MAX_FILE_SIZE, extractFromFile, extractFromUrl, fileTitle } from "@/lib/extract";
import { cleanCategory, cleanSubcategory } from "@/lib/resource-fields";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const COLUMNS = "id, title, url, category, subcategory, content, summary, created_at";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const form = await request.formData();
  const titleInput = (form.get("title") as string | null)?.trim() || "";
  const urlInput = (form.get("url") as string | null)?.trim() || "";
  const summaryInput = (form.get("summary") as string | null)?.trim() || "";
  const category = cleanCategory(form.get("category") as string | null);
  const subcategory = cleanSubcategory(category, form.get("subcategory") as string | null);
  const file = form.get("file") as File | null;

  if (!urlInput && (!file || file.size === 0)) {
    return NextResponse.json({ error: "링크나 파일 중 하나는 올려주세요." }, { status: 400 });
  }
  if (file && file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일은 20MB를 넘을 수 없어요." }, { status: 400 });
  }

  let text = "";
  let pageTitle = "";
  let storedUrl = urlInput;

  try {
    if (file && file.size > 0) {
      text = await extractFromFile(file);
      pageTitle = fileTitle(file);
      if (!storedUrl) {
        const path = `${user.id}/resource-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
        if (!upErr) {
          const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
          storedUrl = pub.publicUrl;
        }
      }
    } else {
      const extracted = await extractFromUrl(urlInput);
      text = extracted.text;
      pageTitle = extracted.pageTitle;
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "내용을 추출하지 못했어요." }, { status: 400 });
  }

  if (!text || text.trim().length < 30) {
    return NextResponse.json({ error: "자료에서 쓸 만한 텍스트를 찾지 못했어요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: titleInput || pageTitle || "제목 없음",
      url: storedUrl || null,
      category,
      subcategory,
      content: text.slice(0, MAX_CONTENT),
      summary: summaryInput,
      created_by: user.id,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "저장하지 못했어요: " + (error?.message || "알 수 없는 오류") }, { status: 500 });
  }

  return NextResponse.json({ resource: data });
}
