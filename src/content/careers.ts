// 회사별 상세 이력 (노션 '상세 이력' 원문). 최근 근무 순.
export type Company = {
  group: "startup" | "enterprise";
  name: string;
  en: string;
  role: string;
  industry: string;
  stage: string;
  // 최상위 항목과 하위 항목: [본문, 하위 항목…]
  lines: [string, ...string[]][];
};

export const companies: Company[] = [
  {
    group: "startup", name: "티오더", en: "Torder", role: "HR Director", industry: "Foodtech · B2B", stage: "Series A, B",
    lines: [
      ["200명 → 360명 → 250명 규모 (시리즈 B)"],
      ["3개 오피스 인력 운영 (신도림, 강남, 여의도)"],
      ["경영 정상화 : 고정비용 30% 효율화, 전사 손익개선 프로젝트"],
      ["전사 사업계획 수립 및 경영관리 체계 지원"],
      ["해외법인 (미국) 세팅 및 자회사 수립 지원"],
      ["개인평가 및 보상제도 수립"],
      ["핵심가치 수립"],
      ["인력 선순환을 위한 outplacement 프로세스 세팅"],
      ["전반적인 HR제도 및 오퍼레이션 고도화 : 근태, 행정, 채용, 보상 등"],
      ["노무 이슈 대응 및 정기근로감독 수검"],
      ["(직접 채용) 인력/조직 세팅 : CTO, CX총괄, 테크리드 등"],
    ],
  },
  {
    group: "startup", name: "휴이노", en: "HUINNO", role: "HR Lead", industry: "Healthcare · B2B · AI", stage: "Series C, Pre-IPO",
    lines: [
      ["85명 규모 (시리즈 C)"],
      ["’24년 IPO를 위한 내부 체계 및 프로세스 고도화"],
      ["HR팀 대규모 퇴사에 따른 안정화 및 조직 리빌딩 진행"],
      ["개인 평가 및 보상 제도 도입"],
      ["인력 선순환을 위한 outplacement 프로세스 세팅"],
      ["노무 이슈 대응 및 정기근로감독 수검"],
      ["고려대와의 합작사(KHAIM) 세팅 및 내부 인력 전보 진행"],
      ["기타 복지 프로그램 : 사내카페 설치/운영, 워케이션 프로그램 기획/진행"],
      ["(직접 채용) 인력/조직 세팅 : HR리드 등"],
    ],
  },
  {
    group: "startup", name: "클래스101", en: "Class101", role: "Head of HR + 경영관리", industry: "Contents · Edutech · B2C · B2B", stage: "Series A, B",
    lines: [
      ["People Division 조직 세팅 및 관리 (최대 28명)", "HR Ops팀, HRBP팀, 비즈/테크 채용팀, 제도기획팀, 총무/구매팀, 컬쳐팀, 경영관리팀"],
      ["150명 규모 (시리즈 A) → 380명 규모 (시리즈 B)"],
      ["사옥 이사 프로젝트 (2022.04, 서울역 오피스에서 역삼오피스로 이전)"],
      ["직무 체계화 및 Leveling 제도 수립 (2021년 하반기)"],
      ["개인평가 및 보상 제도 수립 (2021년 상반기 ~ 2022년 상반기)"],
      ["전사차원의 이슈 및 노무 risk 대응"],
      ["예산 및 비용관리를 위한 경영관리 체계 세팅"],
      ["해외법인 HR 세팅 (미국 / 일본)"],
      ["전반적인 업무 프로세스 수립 및 체계화"],
      ["(직접 채용) 인력/조직 세팅 : 마케팅 디렉터, 전략 헤드, HR 시니어 (HRBP, 리크루터) 등"],
    ],
  },
  {
    group: "startup", name: "커뮤니케이션앤컬처", en: "CNC", role: "HR Advisory", industry: "D2C Commerce · B2C", stage: "Seed",
    lines: [
      [
        "HR 컨설팅 프로젝트 진행",
        "채용 : 시스템 / 프로세스 / 전략 세팅 & 인재 Pool 확보",
        "평가 : 수습 / 리뷰 프로세스 세팅",
        "보상 : 보상 제도 / 레벨링 / Payband / 성과급 제도 세팅",
        "노무 이슈 대응 가이드",
      ],
    ],
  },
  {
    group: "startup", name: "야놀자", en: "Yanolja", role: "Sr.HRBP / HRBP Team Lead", industry: "Travel · Leisure", stage: "Series C, D",
    lines: [
      ["전담 조직", "R&D, Marketing + Strategy (2019.06~2020.05)", "Business services (2019.03~2019.06)"],
      ["조직 관리 및 이슈 해결", "직무 & 레벨링 세팅, 조직구조 설계, 채용 & 처우정책, 사업계획, 생산성관리 등"],
      ["인사 제도 기획 및 평가/보상 제도 운영"],
      ["조직 내부 커뮤니케이션 및 HR 이슈 해결. 담당 조직 리더 코칭"],
      ["인수합병에 따른 PMI 프로젝트 진행 : 우리펜션, 호텔나우, 가람, 씨리얼, 데일리호텔, 레져큐"],
    ],
  },
  {
    group: "startup", name: "토스", en: "Toss", role: "POM (HRM, 보상, 노무) + 채용", industry: "Fintech · B2C · B2B", stage: "Series C, D",
    lines: [
      ["평가/보상 제도 운영 및 기획"],
      ["퇴사 및 HR 이슈/노무 담당"],
      ["자회사 HR 체계 수립 및 운영 지원"],
      ["HR 조직 세팅 지원 (HR팀 퇴사에 따른 새로운 구성원 리빌딩)"],
    ],
  },
  {
    group: "enterprise", name: "현대차그룹 기획조정실", en: "HMG", role: "인사기획, 그룹사 관리", industry: "Auto · B2C", stage: "상장사",
    lines: [
      ["그룹사 CEO 평가 및 육성 체계 검토 (2018)"],
      ["현대/기아차 일반직 인사제도 개선 프로젝트 (2017)"],
      ["그룹사 적정 조직구조/체계 검토 프로젝트 (2017)"],
      ["중국프로젝트 부품사 법인 직급/평가/보상 개선 적용 (2016)"],
      ["그룹사 인사제도 검토, 그룹 인력운영/승진율 관리 (2015 ~ 2018)"],
    ],
  },
  {
    group: "enterprise", name: "현대모비스", en: "Mobis", role: "GHR, 조직관리", industry: "Auto · B2B", stage: "상장사",
    lines: [
      ["현대차그룹 중국법인 인사제도 개선 프로젝트"],
      ["해외법인(31개) 인사제도 관리, 주재원 선발/인력운영"],
      ["조직신설/변경, 조직 R&R 및 업무 프로세스 조정"],
    ],
  },
];
