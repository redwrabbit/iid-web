import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = "Askiid";
export const ogContentType = "image/png";

export async function renderOgImage() {
  const logoData = await readFile(join(process.cwd(), "public/iid-character.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgb(5,5,7)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={ogSize.height} height={ogSize.height} />
      </div>
    ),
    ogSize
  );
}
