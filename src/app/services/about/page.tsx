import { redirect } from "next/navigation";

// 소개 · 이력은 별도 탭(/about)으로 옮겼습니다. 예전 주소는 새 주소로 보냅니다.
export default function Page() {
  redirect("/about");
}
