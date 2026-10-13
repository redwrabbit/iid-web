import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import NavBar from "@/components/NavBar";

const notoSerif = Noto_Serif_KR({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "이드에게 물어보기",
  description: "이드(iid)가 쓴 글과 영상을 바탕으로 검색하고, 직접 질문할 수 있는 사이트",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSerif.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#001621] text-[#F3EFE8] font-sans antialiased">
        <NavBar />
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </body>
    </html>
  );
}
