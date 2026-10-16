import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import ServiceSubbar from "@/components/site/ServiceSubbar";

export const metadata: Metadata = {
  title: "이런 고민을 안고 계신가요 · iid",
  description: "이드 컨설팅 이런 고민을 안고 계신가요",
};

export default function Page() {
  return (
    <div className="site-root site-page">
      <ServiceSubbar />
      <div className="panel panel--sub">
          <div className="wrap worries">
            <ul>
              <li>“나 없어도 잘 굴러가게 만들고 싶은데…”</li>
              <li>“지금 뭘 바꿔야 할지 모르겠다. 감이 없다.”</li>
              <li>“운영은 하고 있는데… 잘하고 있는 걸까?”</li>
              <li>“잘 뽑은 것 같은데, 왜 자꾸 떠나는 걸까?”</li>
            </ul>
            <p className="worries__note">이 질문들은 결국, 모든 리더가 한 번쯤 마주하는 현실입니다. 누구도 대신 내줄 수 없는 선택 앞에서, 많은 조직이 머뭇거립니다.</p>
          </div>

          <div className="wrap section">
            <h1 className="h2">이런 고민을 안고 계신가요</h1>
            <p className="section__lead">조직 성장과 변화 과정에서 누구나 겪는 고민들입니다. 아래 상황이 익숙하다면, 바로 상담을 요청해주세요.</p>
            <div className="situations">
              <details>
                <summary>조직은 커졌는데 운영은 더 무거워진 경우</summary>
                <ul>
                  <li><b>인원은 늘었는데 일은 안 풀리는 느낌</b>30명 → 70명 수준에서 조직의 반응 속도가 느려지고, 이슈는 반복됨. 커뮤니케이션 구조 없이 인원만 늘어난 상황.</li>
                  <li><b>대표가 개입하지 않으면 안 굴러감</b>리더들이 있지만 사소한 의사결정도 대표에게 의존. 위임이 안 되는 구조에 대한 원인 파악이 필요.</li>
                  <li><b>회사 외형은 커졌는데 운영은 제자리</b>매출, 투자 유입은 늘었지만 인사 제도, 보상, 성과관리 등은 여전히 초창기 방식. 시스템 전환이 필요한 시점.</li>
                </ul>
              </details>
              <details>
                <summary>사람 이슈가 자주 생기는 조직</summary>
                <ul>
                  <li><b>좋은 인재가 자꾸 퇴사한다</b>채용은 되지만 3~6개월 내 이탈이 빈번. 온보딩, 평가, 보상, 리더십 등 종합 진단이 필요.</li>
                  <li><b>실장/리더가 기대만큼 리드하지 못한다</b>리더는 있으나 실질적 영향력 없음. 실장급 역할 정의와 리더십 작동 구조 점검이 필요한 상황.</li>
                  <li><b>조직 내 갈등과 피로감이 늘어난다</b>의사소통 단절, 팀 내 정치, 피로 누적 등 문화적 이상 신호가 관측됨. 근본 구조 진단이 필요.</li>
                </ul>
              </details>
              <details>
                <summary>대표 혼자 모든 고민을 안고 있는 경우</summary>
                <ul>
                  <li><b>조직 내부에 반대자나 조언자가 없다</b>HR조직이 작거나 대표 의존형 구조. 견제 없이 혼자 모든 방향을 판단하는 구조.</li>
                  <li><b>내가 믿는 방식이 지금도 유효한가?</b>직관과 감으로 성장해왔지만, 구성원이 늘며 균열이 생김. 리더십과 운영 방식 점검이 필요한 타이밍.</li>
                  <li><b>내 결정이 구성원에게 어떤 영향을 미치는지 궁금하다</b>어떤 제도가 몰입을 높이고, 어떤 방식이 신뢰를 해치는지에 대한 피드백이 필요한 경우.</li>
                </ul>
              </details>
              <details>
                <summary>전환기·위기 상황에 들어선 조직</summary>
                <ul>
                  <li><b>M&amp;A, 자회사 통합 등 변화 앞에 서 있는 경우</b>조직문화, 커뮤니케이션, 제도 정렬이 필요한 PMI 상황. 전략적 통합 설계가 필요.</li>
                  <li><b>구조조정 또는 조직 슬리밍을 고려 중이다</b>성장 탄력이 꺾이고, 효율화를 준비 중. 인력 정비, 리더십 구조조정, 보상 합리화 등 전방위 설계가 필요한 시점.</li>
                  <li><b>HR팀이 붕괴되었거나 공백 상태다</b>인사 리더의 이탈로 HR 기능이 정지된 상황. 빠른 진단과 안정화가 필요한 시기.</li>
                </ul>
              </details>
              <details>
                <summary>성과와 분위기, 제도의 균형이 안 맞는 조직</summary>
                <ul>
                  <li><b>성과는 나는데 내부는 이상하다</b>숫자는 잘 나오지만 불만, 갈등, 이직이 많다. 몰입과 구조 간 균형점 재설정이 필요.</li>
                  <li><b>제도는 많은데 실질적으로 작동하지 않는다</b>평가, 보상, 채용, 문화 제도는 있지만 구성원은 체감하지 못함. 설계–운영–수용성 간 단절 상태.</li>
                  <li><b>무언가 계속 바꾸긴 하는데 확신이 없다</b>OKR, 리더십 교육, 보상제도 전환 등 다양한 시도를 했지만 체계적 정렬 없이 피로감만 누적.</li>
                </ul>
              </details>
              <details>
                <summary>우리만의 운영 방식이 필요한 조직</summary>
                <ul>
                  <li><b>트렌드는 따라갔지만 내부는 버거워한다</b>자유로운 문화, BP 도입, N잡 허용 등 트렌디한 방식은 도입했지만 구성원은 오히려 혼란스러움. 우리 조직에 맞는 ‘운영의 본질’을 찾고 싶은 경우.</li>
                  <li><b>토스, 당근, 우아한 형제들 → 벤치마크는 했는데 현실감이 없다</b>누가 잘한다니까 도입은 했지만 우리 조직의 정체성과 리소스에 맞는 적용이 궁금한 시점.</li>
                </ul>
              </details>
            </div>
          </div>
      </div>
      <SiteFooter />
    </div>
  );
}
