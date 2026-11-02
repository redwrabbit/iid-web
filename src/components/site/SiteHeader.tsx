import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import HeaderTabs from "./HeaderTabs";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function SiteHeader() {
  // 비로그인 방문자는 세션 쿠키 자체가 없으므로, 쿠키가 있을 때만 getUser()로
  // Supabase 서버에 왕복한다 (getUser()는 매번 네트워크 요청을 보낸다 — 미들웨어가
  // 이미 한 번 검증했어도, 로그인 안 한 방문자에게까지 또 왕복시키지 않기 위한 최적화).
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore.getAll().some((c) => c.name.includes("-auth-token"));

  let user = null;
  if (hasSessionCookie) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    // 처음 로그인한 사용자의 프로필 행을 만든다 (기존 NavBar 동작 유지)
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
  }

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  return (
    <div className="site-root">
      <header className="top">
      <div className="wrap top__in">
        <Link className="brand" href="/" aria-label="HR Problem Solver iid 홈">
          <span className="brand__name">HR Problem Solver</span>
          <span className="brand__mark" translate="no">iid</span>
        </Link>
        <HeaderTabs />
        <div className="top__auth">
          {isAdmin && (
            <Link className="top__admin" href="/admin">관리자</Link>
          )}
          {user ? (
            <>
              <span className="top__email">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link className="top__login" href="/login">로그인 / 가입</Link>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}
