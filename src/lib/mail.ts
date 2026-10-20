// Resend(https://resend.com) REST API로 메일을 보낸다. 키가 없으면 아무것도 보내지 않고 false를 돌려준다.
const SITE_URL = "https://iid-web.vercel.app";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const snip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
};

export async function sendMail(opts: { to: string; subject: string; heading: string; body: string; cta: string; path: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, detail: "RESEND_API_KEY가 설정되어 있지 않아요." };
  const from = process.env.NOTIFY_FROM || "iid <onboarding@resend.dev>";
  const url = SITE_URL + opts.path;
  const html = `<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
<p style="font-size:13px;color:#FF4103;font-weight:700;margin:0 0 12px">iid · HR Problem Solver</p>
<h1 style="font-size:18px;margin:0 0 12px">${esc(opts.heading)}</h1>
<p style="font-size:14px;line-height:1.6;color:#444;white-space:pre-wrap;background:#f6f6f4;border-radius:12px;padding:14px;margin:0 0 20px">${esc(opts.body)}</p>
<a href="${url}" style="display:inline-block;background:#FF4103;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">${esc(opts.cta)}</a>
<p style="font-size:11px;color:#999;margin:24px 0 0">이 메일은 질문/상담 알림이에요. 받고 싶지 않으면 질문/상담 화면에서 알림을 끌 수 있어요.</p>
</div>`;
  const text = `${opts.heading}\n\n${opts.body}\n\n${opts.cta}: ${url}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html, text }),
    });
    if (res.ok) return { ok: true, detail: "" };
    const detail = `Resend ${res.status}: ${await res.text().catch(() => "")}`;
    console.error("[mail] send failed", detail);
    return { ok: false, detail };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    console.error("[mail] send error", detail);
    return { ok: false, detail };
  }
}
