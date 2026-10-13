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
      className="text-xs font-semibold px-3 py-2 rounded-full border border-[rgba(143,168,181,0.25)] text-[#8FA8B5] hover:border-[#FF4103] hover:text-[#FF4103]"
    >
      로그아웃
    </button>
  );
}
