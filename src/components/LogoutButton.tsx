"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-black/15 text-[#6B6B6B] hover:border-[#FF4103] hover:text-[#FF4103]"
    >
      <LogOut className="w-3.5 h-3.5" strokeWidth={2.25} />
      로그아웃
    </button>
  );
}
