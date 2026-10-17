import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_CONTENT = 20000;

export function stripHtml(html: string) {
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

// 관리자가 넣는 링크라도 서버 내부 주소(사설망·로컬)는 가져오지 않는다
function assertPublicHttpUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("링크 형식이 올바르지 않아요.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("http 또는 https 링크만 쓸 수 있어요.");
  const h = u.hostname.toLowerCase();
  const isPrivate =
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === "[::1]";
  if (isPrivate) throw new Error("내부 주소는 가져올 수 없어요.");
  return u.toString();
}

export async function extractFromUrl(url: string): Promise<{ text: string; pageTitle: string }> {
  const safe = assertPublicHttpUrl(url);
  const res = await fetch(safe, { headers: { "User-Agent": "Mozilla/5.0 (compatible; iid-web-bot/1.0)" } });
  if (!res.ok) throw new Error(`링크를 불러오지 못했어요 (HTTP ${res.status})`);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return { text: stripHtml(html), pageTitle: titleMatch ? titleMatch[1].trim() : "" };
}

export async function extractFromFile(file: File): Promise<string> {
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

export function fileTitle(file: File) {
  return file.name.replace(/\.(pdf|docx)$/i, "");
}
