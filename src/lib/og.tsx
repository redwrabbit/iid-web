import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = "Askiid";
export const ogContentType = "image/png";

export async function renderOgImage() {
  const fontDir = join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative");
  const [regular, extraBold, logoData] = await Promise.all([
    readFile(join(fontDir, "Pretendard-Regular.ttf")),
    readFile(join(fontDir, "Pretendard-ExtraBold.ttf")),
    readFile(join(process.cwd(), "public/iid-character.png"), "base64"),
  ]);
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: "Pretendard",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={148} height={148} style={{ borderRadius: 32, marginBottom: 40 }} />
        <div style={{ fontSize: 72, fontWeight: 800, color: "#111111", display: "flex" }}>Askiid</div>
        <div style={{ fontSize: 30, fontWeight: 400, color: "#6B6B6B", marginTop: 20, display: "flex" }}>
          브런치 글과 유튜브를 검색하고, 이드에게 직접 질문하세요
        </div>
        <div style={{ width: 120, height: 6, borderRadius: 3, background: "#FF4103", marginTop: 40, display: "flex" }} />
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Pretendard", data: regular, style: "normal", weight: 400 },
        { name: "Pretendard", data: extraBold, style: "normal", weight: 800 },
      ],
    }
  );
}
