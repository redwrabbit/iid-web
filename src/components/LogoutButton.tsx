"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-xs font-semibold px-3 py-2 rounded-full border border-[#1B3A4B29] text-[#5B6B72] hover:border-[#1B3A4B] hover:text-[#1B3A4B]"
    >
      로그아웃
    </button>
  );
}
