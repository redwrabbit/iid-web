import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AskThread, { type Question } from "./AskThread";

export default async function AskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question, answer, answered_at, created_at")
    .order("created_at", { ascending: true });

  return <AskThread initialQuestions={(questions as Question[]) || []} userId={user.id} />;
}
