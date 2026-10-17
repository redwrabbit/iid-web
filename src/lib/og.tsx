import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = "HR Problem Solver iid";
export const ogContentType = "image/png";

// 링크 미리보기(썸네일): 사이트 상단 로고(HR Problem Solver 흰색 + iid 주황)를 검정 바탕에 꽉 차게
export async function renderOgImage() {
  const font = await readFile(join(process.cwd(), "public/fonts/Pretendard-ExtraBold-latin.otf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E0E0E",
          fontFamily: "Pretendard",
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <span style={{ color: "#FFFFFF", fontSize: 128, letterSpacing: -3 }}>HR Problem Solver</span>
          <span style={{ color: "#FF6A13", fontSize: 340, letterSpacing: -8, marginTop: 6 }}>iid</span>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }],
    }
  );
}
