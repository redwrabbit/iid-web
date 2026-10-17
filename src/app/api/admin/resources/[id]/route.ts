import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_CONTENT, MAX_FILE_SIZE, extractFromFile, extractFromUrl } from "@/lib/extract";
import { cleanCategory, cleanSubcategory } from "@/lib/resource-fields";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const COLUMNS = "id, title, url, category, subcategory, content, summary, created_at";

// 자료 수정: 제목·링크·분류·요약·본문을 고치고, 파일을 바꾸거나 링크에서 본문을 다시 가져올 수 있다.
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const form = await request.formData();
  const str = (k: string) => (form.get(k) as string | null)?.trim();
  const title = str("title");
  const urlInput = str("url");
  const summary = form.get("summary") as string | null;
  const contentInput = form.get("content") as string | null;
  const reextract = form.get("reextract") === "1";
  const file = form.get("file") as File | null;

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "제목은 비워둘 수 없어요." }, { status: 400 });
  }
  if (file && file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일은 20MB를 넘을 수 없어요." }, { status: 400 });
  }

  const patch: Record<string, string | null> = {};
  if (title) patch.title = title;
  if (summary !== null) patch.summary = summary.trim();
  if (urlInput !== undefined) patch.url = urlInput || null;
  const category = form.get("category") !== null ? cleanCategory(str("category")) : undefined;
  if (category) {
    patch.category = category;
    patch.subcategory = cleanSubcategory(category, str("subcategory"));
  }
  if (contentInput !== null) patch.content = contentInput.slice(0, MAX_CONTENT);

  try {
    if (file && file.size > 0) {
      const text = await extractFromFile(file);
      if (text.trim().length < 30) throw new Error("파일에서 쓸 만한 텍스트를 찾지 못했어요.");
      patch.content = text.slice(0, MAX_CONTENT);
      const path = `${user.id}/resource-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
        patch.url = pub.publicUrl;
      }
    } else if (reextract) {
      const target = patch.url ?? urlInput;
      if (!target) throw new Error("본문을 다시 가져올 링크가 없어요.");
      const { text } = await extractFromUrl(target);
      if (text.trim().length < 30) throw new Error("링크에서 쓸 만한 텍스트를 찾지 못했어요.");
      patch.content = text.slice(0, MAX_CONTENT);
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "내용을 추출하지 못했어요." }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "바뀐 내용이 없어요." }, { status: 400 });
  }

  const { data, error } = await supabase.from("resources").update(patch).eq("id", id).select(COLUMNS).single();
  if (error || !data) {
    return NextResponse.json({ error: "저장하지 못했어요: " + (error?.message || "자료를 찾지 못했어요.") }, { status: 500 });
  }
  return NextResponse.json({ resource: data });
}
