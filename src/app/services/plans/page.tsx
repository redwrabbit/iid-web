import { redirect } from "next/navigation";

// 자문/컨설팅 하위 페이지는 한 페이지로 합쳤습니다. 예전 주소는 해당 위치로 보냅니다.
export default function Page() {
  redirect("/services#plans");
}
