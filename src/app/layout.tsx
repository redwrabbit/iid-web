import type { Metadata } from "next";
import { Noto_Serif_KR, Jua } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import "./site.css";
import SiteHeader from "@/components/site/SiteHeader";

const notoSerif = Noto_Serif_KR({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const siteUrl = "https://iid-web.vercel.app";
const title = "iid · HR Problem Solver";
const shareImage = { url: "/share-v2", width: 1200, height: 630, alt: "HR Problem Solver iid" };
const description = "조직과 사람에 대한 의사결정을 돕는 HR 자문·컨설팅. 서비스, HR 아티클/자료, 질문/상담.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    locale: "ko_KR",
    type: "website",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage.url],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${jua.variable} h-full`}>
      <body className="h-full flex flex-col bg-white text-[#111111] font-sans antialiased">
        <SiteHeader />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
