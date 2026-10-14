import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AskThread, { type Question } from "./AskThread";
import AdminInboxChat, { type AdminQuestion } from "./AdminInboxChat";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function AskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email === ADMIN_EMAIL) {
    const [{ data: questions }, { data: profiles }] = await Promise.all([
      supabase
        .from("questions")
        .select("id, user_id, question, answer, answered_at, created_at, attachments")
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, email, name, company, role"),
    ]);
    return <AdminInboxChat initialQuestions={(questions as AdminQuestion[]) || []} profiles={profiles || []} />;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question, answer, answered_at, created_at, attachments")
    .order("created_at", { ascending: true });

  return <AskThread initialQuestions={(questions as Question[]) || []} userId={user.id} />;
}
