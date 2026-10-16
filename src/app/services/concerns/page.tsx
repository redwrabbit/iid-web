import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";
import ConcernsExplorer from "@/components/site/ConcernsExplorer";
import { concerns } from "@/content/services";

export const metadata: Metadata = {
  title: "이런 고민을 안고 계신가요 · iid",
  description: "조직 성장과 변화 과정에서 누구나 겪는 고민들.",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
        <div className="wrap page-head">
          <h1 className="h1-sm">이런 고민을 안고 계신가요</h1>
          <p className="lead">조직 성장과 변화 과정에서 누구나 겪는 고민들입니다. 아래 상황이 익숙하다면, 바로 상담을 요청해주세요.</p>
        </div>
        <div className="wrap cx-wrap">
          <ConcernsExplorer concerns={concerns} />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
