"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email || !password || !name) {
      setError("이메일, 비밀번호, 이름은 꼭 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상으로 입력해주세요.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company, role } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    if (data.user && data.session) {
      // email confirmation is off — we're signed in immediately, save the profile now
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        name,
        company,
        role,
      });
      router.push("/search");
      router.refresh();
      return;
    }

    // email confirmation is required — profile gets saved on first login below
    setNotice("가입이 거의 다 됐어요. 받으신 확인 이메일의 링크를 눌러주세요.");
    setBusy(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setBusy(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 맞지 않아요." : signInError.message);
      setBusy(false);
      return;
    }
    if (data.user) {
      // first login after an email-confirmation signup — make sure the profile row exists
      const meta = data.user.user_metadata as { name?: string; company?: string; role?: string };
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, email: data.user.email, name: meta?.name || "", company: meta?.company || "", role: meta?.role || "" },
          { onConflict: "id", ignoreDuplicates: true }
        );
    }
    router.push("/search");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-black/12 rounded-2xl shadow-sm p-7">
        <Image src="/iid-character.png" alt="iid" width={40} height={40} className="w-10 h-10 rounded-lg mb-4" />
        <h1 className="text-xl font-bold mb-1 text-[#111111]">Askiid</h1>
        <p className="text-sm text-[#6B6B6B] mb-5">
          {mode === "signup" ? "간단한 정보를 알려주시면 바로 시작할 수 있어요." : "다시 오신 걸 환영해요."}
        </p>

        <div className="flex gap-1 mb-5 bg-[#F4F4F2] rounded-full p-1">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 text-sm font-semibold py-2 rounded-full ${mode === "signup" ? "bg-[#FF4103] text-white" : "text-[#6B6B6B]"}`}
          >
            가입하기
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 text-sm font-semibold py-2 rounded-full ${mode === "login" ? "bg-[#FF4103] text-white" : "text-[#6B6B6B]"}`}
          >
            로그인
          </button>
        </div>

        <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="flex flex-col gap-2.5">
          <input
            type="email"
            placeholder="이메일 *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
          />
          <input
            type="password"
            placeholder="비밀번호 * (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
          />
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="이름 *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
              />
              <input
                type="text"
                placeholder="회사 (선택)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
              />
              <input
                type="text"
                placeholder="직무 (선택)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF9] text-[#111111] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF4103]"
              />
            </>
          )}

          {error && <div className="text-xs text-[#DC2626]">{error}</div>}
          {notice && <div className="text-xs text-[#0F9D58]">{notice}</div>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 bg-[#FF4103] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? "처리 중…" : mode === "signup" ? "가입하고 시작하기" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
