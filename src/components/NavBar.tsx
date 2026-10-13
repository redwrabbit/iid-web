import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!existing) {
      const meta = user.user_metadata as { name?: string; company?: string; role?: string };
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: meta?.name || "",
        company: meta?.company || "",
        role: meta?.role || "",
      });
    }
  }

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  return (
    <header className="border-b border-[rgba(143,168,181,0.18)] bg-[#072431]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-[#FF4103] text-[#140800] flex items-center justify-center font-serif font-bold text-sm">
            iid
          </span>
          <span className="font-bold text-[17px] hidden sm:inline">이드에게 물어보기</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          <Link
            href="/search"
            className="text-sm font-semibold px-3 py-2 rounded-lg text-[#8FA8B5] hover:bg-[#0B2C3C] hover:text-[#F3EFE8]"
          >
            HR 지식 검색
          </Link>
          <Link
            href="/ask"
            className="text-sm font-semibold px-3 py-2 rounded-lg text-[#8FA8B5] hover:bg-[#0B2C3C] hover:text-[#F3EFE8]"
          >
            이드에게 질문하기
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg text-[#FF4103] hover:bg-[rgba(255,65,3,0.14)]"
            >
              <Settings className="w-4 h-4" strokeWidth={2.25} />
              관리자
            </Link>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-[#8FA8B5] hidden sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-[#FF4103] text-[#140800] hover:opacity-90"
          >
            로그인 / 가입
          </Link>
        )}
      </div>
    </header>
  );
}
