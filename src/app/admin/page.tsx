import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoredContent } from "@/lib/site-content";
import AdminDashboard from "./AdminDashboard";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/search");

  const [{ data: questions }, { data: searchLogs }, { data: profiles }, { data: resources }] = await Promise.all([
    supabase.from("questions").select("id, user_id, question, answer, answered_at, created_at").order("created_at", { ascending: false }),
    supabase.from("search_logs").select("id, user_id, query, created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("profiles").select("id, email, name, company, role, created_at").order("created_at", { ascending: false }),
    supabase.from("resources").select("id, title, url, category, subcategory, content, summary, created_at").order("created_at", { ascending: false }),
  ]);

  const siteContent = await getStoredContent();

  return (
    <AdminDashboard
      initialQuestions={questions || []}
      initialSearchLogs={searchLogs || []}
      profiles={profiles || []}
      initialResources={resources || []}
      siteContent={siteContent}
    />
  );
}
