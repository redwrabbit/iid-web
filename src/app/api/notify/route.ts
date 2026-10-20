import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail, snip } from "@/lib/mail";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
// 이드가 알림을 받는 주소 (로그인 계정과 달라도 된다). 환경변수 NOTIFY_ADMIN_TO로 바꿀 수 있다.
const NOTIFY_TO = process.env.NOTIFY_ADMIN_TO || "iid.solutor@gmail.com";
const MAX_BODY = 5000; // 메일 본문에 넣는 최대 글자 수

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
    const { data: mine } = await supabase
      .from("questions")
      .select("question, created_at, attachments")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const latest = mine?.[0];
    if (!latest || since(latest.created_at) > 2 * 60 * 1000) return NextResponse.json({ sent: false });
    const { data: profile } = await supabase.from("profiles").select("name, company").eq("id", user.id).maybeSingle();
    const who = [profile?.name || user.email, profile?.company].filter(Boolean).join(" · ");
    const files = (Array.isArray(latest.attachments) ? latest.attachments : []) as { name?: string; url?: string }[];
    const fileLines = files.map((f) => `첨부: ${f.name || "파일"} ${f.url || ""}`).join("\n");
    const text = (latest.question || "").trim();
    const { ok: sent } = await sendMail({
      to: NOTIFY_TO,
      subject: `[질문] ${who} — ${snip(text || "첨부 파일", 30)}`,
      heading: `${who}님이 질문을 남겼어요`,
      body: [text.slice(0, MAX_BODY), fileLines].filter(Boolean).join("\n\n"),
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
      .limit(1);
    const latest = answered?.[0];
    if (!latest?.answered_at || since(latest.answered_at) > 2 * 60 * 1000) return NextResponse.json({ sent: false });
    const { ok: sent } = await sendMail({
      to: profile.email,
      subject: "이드가 답변을 남겼어요",
      heading: `${profile.name ? profile.name + "님, " : ""}이드가 답변을 남겼어요`,
      body: (latest.answer || "").slice(0, MAX_BODY),
      cta: "답변 확인하기",
      path: "/ask",
    });
    return NextResponse.json({ sent });
  }

  return NextResponse.json({ sent: false });
}
