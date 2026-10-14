import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LIST, SUBCATEGORY_LIST } from "@/lib/search";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const RESOURCE_CATEGORIES = CATEGORY_LIST.filter((c) => c !== "전체");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_FOR_ANALYSIS = 15000; // chars sent to Claude

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

async function analyze(text: string, hintTitle: string) {
  const client = new Anthropic();
  const trimmed = text.slice(0, MAX_TEXT_FOR_ANALYSIS);

  const categoryTree = RESOURCE_CATEGORIES.map((c) => `- ${c}${SUBCATEGORY_LIST[c] ? `: ${SUBCATEGORY_LIST[c].join(", ")}` : ""}`).join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low" },
    system:
      "너는 HR/스타트업 지식 검색 사이트에 들어갈 자료를 분류하고 요약하는 도우미야. 반드시 아래 JSON 형식으로만 답해. 다른 설명은 붙이지 마.",
    messages: [
      {
        role: "user",
        content: `아래 자료를 분석해서 다음 JSON으로만 답해줘:
{"title": "자료 제목 (간결하게, 한국어)", "category": "대분류 하나", "subcategory": "중분류 하나 또는 빈 문자열", "summary": "450~550자 분량의 한국어 요약. 핵심 주장과 근거, 결론을 담을 것"}

대분류/중분류 목록 (이 중에서만 골라야 함, subcategory는 목록에 없으면 빈 문자열):
${categoryTree}

${hintTitle ? `참고용 원문 제목(그대로 쓰지 말고 다듬어도 됨): ${hintTitle}\n` : ""}
자료 본문:
"""
${trimmed}
"""`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("분석 결과를 받지 못했어요.");
  const match = block.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("분석 결과 형식이 올바르지 않아요.");
  const parsed = JSON.parse(match[0]) as { title?: string; category?: string; subcategory?: string; summary?: string };

  const category = RESOURCE_CATEGORIES.includes(parsed.category || "") ? (parsed.category as string) : "기타";
  const subs = SUBCATEGORY_LIST[category] || [];
  const subcategory = subs.includes(parsed.subcategory || "") ? (parsed.subcategory as string) : "";

  return {
    title: parsed.title?.trim() || hintTitle || "제목 없음",
    category,
    subcategory,
    summary: parsed.summary?.trim() || "",
  };
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
    return NextResponse.json({ error: "자료에서 분석할 만한 텍스트를 찾지 못했어요." }, { status: 400 });
  }

  let analysis;
  try {
    analysis = await analyze(text, titleInput || pageTitle);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI 분석에 실패했어요." }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: titleInput || analysis.title,
      url: storedUrl || null,
      category: analysis.category,
      subcategory: analysis.subcategory,
      content: text.slice(0, 20000),
      summary: analysis.summary,
      created_by: user.id,
    })
    .select("id, title, url, category, subcategory, content, summary, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "저장하지 못했어요: " + (error?.message || "알 수 없는 오류") }, { status: 500 });
  }

  return NextResponse.json({ resource: data });
}
