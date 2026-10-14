import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|br|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractFromUrl(url: string): Promise<{ text: string; pageTitle: string }> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; iid-web-bot/1.0)" } });
  if (!res.ok) throw new Error(`링크를 불러오지 못했어요 (HTTP ${res.status})`);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return { text: stripHtml(html), pageTitle: titleMatch ? titleMatch[1].trim() : "" };
}

async function extractFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error("워드(.docx) 또는 PDF 파일만 올릴 수 있어요.");
}

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
      pageTitle = file.name.replace(/\.(pdf|docx)$/i, "");
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
      category: "기타",
      subcategory: "",
      content: text.slice(0, 20000),
      summary: "",
      created_by: user.id,
    })
    .select("id, title, url, category, subcategory, content, summary, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "저장하지 못했어요: " + (error?.message || "알 수 없는 오류") }, { status: 500 });
  }

  return NextResponse.json({ resource: data });
}
