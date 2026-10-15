import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AskThread, { type Question } from "./AskThread";
import AdminInboxChat, { type AdminQuestion } from "./AdminInboxChat";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function AskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // next/navigation의 redirect()는 HTTP 3xx로 응답을 끊어버려서, 그 경우 메타태그(og:image 등)가
    // 전혀 전달되지 않아 카카오톡/슬랙 같은 링크 미리보기 봇이 썸네일을 못 가져옵니다.
    // 그래서 리다이렉트 대신 이 자리에서 바로 로그인 안내를 보여줍니다.
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-[#6B6B6B] mb-4">이드에게 질문하려면 로그인이 필요해요.</p>
          <Link
            href="/login"
            className="inline-flex text-sm font-semibold px-5 py-2.5 rounded-full bg-[#FF4103] text-white hover:opacity-90"
          >
            로그인 / 가입
          </Link>
        </div>
      </div>
    );
  }

  if (user.email === ADMIN_EMAIL) {
    const [{ data: questions }, { data: profiles }] = await Promise.all([
      supabase
        .from("questions")
        .select("id, user_id, question, answer, answered_at, created_at, attachments, question_reaction, answer_reaction")
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, email, name, company, role"),
    ]);
    return <AdminInboxChat initialQuestions={(questions as AdminQuestion[]) || []} profiles={profiles || []} />;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question, answer, answered_at, created_at, attachments, question_reaction, answer_reaction")
    .order("created_at", { ascending: true });

  return <AskThread initialQuestions={(questions as Question[]) || []} userId={user.id} />;
}
