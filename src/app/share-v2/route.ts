import { renderOgImage } from "@/lib/og";

// 링크 미리보기 이미지. 메신저가 주소 기준으로 이미지를 오래 기억하므로, 이미지를 바꿀 때는 이 경로(share-v2 → v3 …)를 새로 만든다.
export async function GET() {
  const res = await renderOgImage();
  res.headers.set("Cache-Control", "public, max-age=0, s-maxage=31536000, immutable");
  return res;
}
