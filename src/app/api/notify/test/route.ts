import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const NOTIFY_TO = process.env.NOTIFY_ADMIN_TO || "iid.solutor@gmail.com";

// 관리자가 주소창에서 열면 알림 메일을 한 통 보내보고, 실패하면 이유를 보여준다.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

  const result = await sendMail({
    to: NOTIFY_TO,
    subject: "알림 메일 시험",
    heading: "알림 메일이 정상으로 도착했어요",
    body: "이 메일이 보이면 질문 알림 설정이 끝난 거예요.",
    cta: "질문/상담 열기",
    path: "/ask",
  });
  return NextResponse.json({ to: NOTIFY_TO, from: process.env.NOTIFY_FROM || "onboarding@resend.dev (기본)", ...result });
}
