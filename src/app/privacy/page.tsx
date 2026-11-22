import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침 · iid",
  description: "HR Problem Solver, iid 사이트의 개인정보처리방침.",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <div className="panel panel--sub">
        <div className="wrap">
          <h1 className="h2">개인정보처리방침</h1>
          <p>HR Problem Solver iid(이하 &quot;이드&quot;)는 서비스 운영을 위해 최소한의 개인정보만을 수집·이용합니다.</p>

          <h2 className="h3">회원 정보</h2>
          <p>
            회원가입 시 이메일, 이름, 회사, 직무 정보를 수집하며, &quot;이드에게 질문하기&quot;·&quot;HR 지식 검색&quot; 기능 제공 목적으로만
            이용합니다. 제3자에게 제공하지 않습니다.
          </p>

          <h2 className="h3">커피챗(오프라인 미팅) 신청 정보</h2>
          <p>
            운영자(oldddong@gmail.com)는 본인 Gmail 계정으로 접수되는 커피챗 신청 메일을 자동으로 확인해, 신청자의 이름·이메일·전화번호·소속
            등을 운영자 전용 관리자 화면에만 기록·관리합니다. 이 과정은 운영자 본인 계정의 읽기 전용 접근으로만 이루어지며, 수집된 정보는 일정 조율
            목적 외에 사용하거나 제3자에게 제공하지 않습니다.
          </p>

          <h2 className="h3">문의</h2>
          <p>개인정보 관련 문의는 oldddong@gmail.com으로 연락해주세요.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
