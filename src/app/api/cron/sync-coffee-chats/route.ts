import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncCoffeeChats } from "@/lib/gmail-sync";

export const runtime = "nodejs";

const LOOKBACK_DAYS = 7; // 예약→취소/거절 응답이 보통 며칠 안에 오므로, 겹치게 훑어도 안전하게 7일로 잡는다.

// Vercel Cron이 매일 호출한다. 그 외 요청은 CRON_SECRET으로 막는다.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  try {
    const result = await syncCoffeeChats(supabase, since);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "알 수 없는 오류" }, { status: 500 });
  }
}
