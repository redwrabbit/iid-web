import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail, snip } from "@/lib/mail";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const QUIET_MS = 10 * 60 * 1000; // 같은 사람에게 10분 안에는 한 통만

// 질문/답변을 보낸 뒤 화면이 호출한다. 내용은 요청이 아니라 DB에서 읽어서(본인 권한으로) 보낸다.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { kind?: string; userId?: string };
  const isAdmin = user.email === ADMIN_EMAIL;
  const since = (iso: string) => Date.now() - new Date(iso).getTime();

  if (body.kind === "question" && !isAdmin) {
    if (!ADMIN_EMAIL) return NextResponse.json({ sent: false });
    const { data: mine } = await supabase
      .from("questions")
      .select("question, created_at, attachments")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2);
    const [latest, prev] = mine || [];
    if (!latest || since(latest.created_at) > 2 * 60 * 1000) return NextResponse.json({ sent: false });
    if (prev && Date.parse(latest.created_at) - Date.parse(prev.created_at) < QUIET_MS) return NextResponse.json({ sent: false });
    const { data: profile } = await supabase.from("profiles").select("name, company").eq("id", user.id).maybeSingle();
    const who = [profile?.name || user.email, profile?.company].filter(Boolean).join(" · ");
    const files = Array.isArray(latest.attachments) ? latest.attachments.length : 0;
    const sent = await sendMail({
      to: ADMIN_EMAIL,
      subject: `새 질문이 도착했어요 — ${who}`,
      heading: `${who}님이 질문을 남겼어요`,
      body: snip(latest.question || "", 200) + (files ? `\n(첨부 ${files}개)` : ""),
      cta: "답변하러 가기",
      path: "/ask",
    });
    return NextResponse.json({ sent });
  }

  if (body.kind === "answer" && isAdmin && body.userId) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", body.userId).maybeSingle();
    if (!profile?.email || profile.notify_email === false) return NextResponse.json({ sent: false });
    const { data: answered } = await supabase
      .from("questions")
      .select("answer, answered_at")
      .eq("user_id", body.userId)
      .not("answer", "is", null)
      .order("answered_at", { ascending: false })
      .limit(20);
    const latest = answered?.[0];
    if (!latest?.answered_at || since(latest.answered_at) > 2 * 60 * 1000) return NextResponse.json({ sent: false });
    const earlier = (answered || []).find((a) => a.answered_at !== latest.answered_at);
    if (earlier?.answered_at && Date.parse(latest.answered_at) - Date.parse(earlier.answered_at) < QUIET_MS) {
      return NextResponse.json({ sent: false });
    }
    const sent = await sendMail({
      to: profile.email,
      subject: "이드가 답변을 남겼어요",
      heading: `${profile.name ? profile.name + "님, " : ""}이드가 답변을 남겼어요`,
      body: snip(latest.answer || "", 160),
      cta: "답변 확인하기",
      path: "/ask",
    });
    return NextResponse.json({ sent });
  }

  return NextResponse.json({ sent: false });
}
