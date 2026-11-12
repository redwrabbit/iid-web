import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCoffeeChatEmail, type ParsedCoffeeChatEvent } from "./coffee-chat-parser";

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

type GmailPart = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailPart[] | null;
};

function extractPlainTextBody(payload: GmailPart | undefined | null): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainTextBody(part);
      if (text) return text;
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

function dateQueryParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/** email + scheduled_at(같은 약속)가 일치하는 기존 행을 찾아 상태를 갱신하고, 없으면 새로 만든다. */
async function upsertEvent(
  supabase: SupabaseClient,
  event: ParsedCoffeeChatEvent,
  threadId: string,
  messageDate: string
): Promise<"inserted" | "updated"> {
  let query = supabase.from("coffee_chats").select("id, source_thread_ids").eq("email", event.email).limit(1);
  query = event.scheduled_at ? query.eq("scheduled_at", event.scheduled_at) : query.is("scheduled_at", null);
  const { data: existingRows } = await query;
  const existing = existingRows?.[0] as { id: string; source_thread_ids: string[] | null } | undefined;

  if (existing) {
    const mergedThreadIds = Array.from(new Set([...(existing.source_thread_ids || []), threadId]));
    await supabase
      .from("coffee_chats")
      .update({
        name: event.name,
        phone: event.phone,
        company: event.company,
        preferred_format: event.preferred_format,
        status: event.status,
        source_thread_ids: mergedThreadIds,
      })
      .eq("id", existing.id);
    return "updated";
  }

  await supabase.from("coffee_chats").insert({
    name: event.name,
    email: event.email,
    phone: event.phone,
    company: event.company,
    preferred_format: event.preferred_format,
    scheduled_at: event.scheduled_at,
    requested_at: messageDate,
    status: event.status,
    notes: event.notes,
    source_thread_ids: [threadId],
  });
  return "inserted";
}

/**
 * 최근 메일함에서 "커피챗" 예약/취소/거절 메일을 찾아 coffee_chats 테이블에 반영한다.
 * 상태 테이블 없이 매번 sinceDate 이후를 다시 훑는 멱등 설계라, 겹치는 기간을 다시 돌려도 안전하다.
 */
export async function syncCoffeeChats(supabase: SupabaseClient, sinceDate: Date): Promise<{ scanned: number; inserted: number; updated: number }> {
  const gmail = getGmailClient();
  const q = `커피챗 after:${dateQueryParam(sinceDate)}`;

  let pageToken: string | undefined;
  let scanned = 0;
  const events: { event: ParsedCoffeeChatEvent; threadId: string; messageDate: string }[] = [];

  do {
    const listRes = await gmail.users.messages.list({ userId: "me", q, pageToken: pageToken, maxResults: 100 });
    const messages = listRes.data.messages || [];
    for (const m of messages) {
      if (!m.id) continue;
      const msgRes = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
      const msg = msgRes.data;
      scanned++;
      const subject = msg.payload?.headers?.find((h) => h.name === "Subject")?.value || "";
      const body = extractPlainTextBody(msg.payload);
      const parsed = parseCoffeeChatEmail(subject, body);
      if (!parsed) continue;
      const messageDate = msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString();
      events.push({ event: parsed, threadId: msg.threadId || "", messageDate });
    }
    pageToken = listRes.data.nextPageToken || undefined;
  } while (pageToken);

  // 같은 약속에 대한 여러 이벤트(예약→취소 등)가 섞여 있을 수 있어, 시간순으로 적용해야 최신 상태가 이긴다.
  events.sort((a, b) => a.messageDate.localeCompare(b.messageDate));

  let inserted = 0;
  let updated = 0;
  for (const { event, threadId, messageDate } of events) {
    const result = await upsertEvent(supabase, event, threadId, messageDate);
    if (result === "inserted") inserted++;
    else updated++;
  }

  return { scanned, inserted, updated };
}
