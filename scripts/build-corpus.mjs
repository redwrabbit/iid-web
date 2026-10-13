import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');
const outDir = path.join(__dirname, '..', 'public', 'data');

const brunch = JSON.parse(readFileSync(path.join(dataDir, 'brunch.json'), 'utf8'));
const youtube = JSON.parse(readFileSync(path.join(dataDir, 'youtube.json'), 'utf8'));

// derived from an actual document-frequency pass over the full corpus body text
// (see scripts/analyze-terms — kept informal, this is the result of that analysis)
const CATEGORIES = {
  '채용': ['채용', '면접', '이력서', '자소서', '오퍼', '헤드헌터', '인재', '지원자', '스카우트', '수습', '포지션', '서류'],
  '평가': ['평가', '고과', 'KPI', 'OKR', '피드백', '등급', '성과관리', '성과평가', '리뷰'],
  '보상': ['보상', '연봉', '인상률', '스톡옵션', '인센티브', '급여', '성과급', '상여', '페이밴드', '보상제도'],
  '조직관리': ['조직문화', 'HRBP', '몰입', '퇴사', '이직', '조직개편', '팀빌딩', '레벨링', '승진', 'PMI', 'M&A', '인재밀도', '온보딩', '리텐션'],
  '리더십': ['리더십', '리더', '대표', '경영진', '권한', '의사결정', '조직장', '매니저', '임원'],
  '노무': ['노무', '근로', '근로기준법', '52시간', '근로감독', '해고', 'ER', '노동', '징계', '근로계약'],
  '커리어·성장': ['커리어', '성장', '이직', '전직', '자기계발', '역량', '커리어패스', '퍼스널브랜딩'],
  '경영·비즈니스': ['비즈니스', '전략', '컨설팅', '경영', '사업', '운영', '매출', '투자', 'VC', '스타트업생태계'],
  '에세이·멘탈': ['멘탈', '번아웃', '불안', '감정', '에세이', '취중잡담', '현타', '회복'],
};

function categorize(post) {
  const hay = `${post.title} ${post.keywords || ''} ${post.series || ''} ${post.text || ''}`;
  let best = '기타';
  let bestScore = 0;
  for (const [cat, terms] of Object.entries(CATEGORIES)) {
    let score = 0;
    for (const term of terms) {
      let idx = hay.indexOf(term);
      while (idx !== -1) { score++; idx = hay.indexOf(term, idx + term.length); }
    }
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// derived from a TF-IDF pass over each major category's posts (see analysis above)
const SUBCATEGORIES = {
  '채용': {
    '채용 전략·프로세스': ['서치펌', '헤드헌터', '아웃바운드', '리크루터', '스카우트', '오퍼', '채용 프로세스'],
    '면접·후보자 평가': ['면접', '인터뷰', '후보자', '퍼포먼스', '지원자'],
    '이력서·포지션': ['이력서', '자소서', '서류', '포지션', '직무'],
  },
  '평가': {
    '피드백': ['피드백'],
    '평가제도': ['평가제도', '등급', '고과', '리뷰'],
    '성과관리·목표': ['성과관리', '목표', 'KPI', 'OKR', '성과평가'],
  },
  '보상': {
    '연봉·인상률': ['연봉', '인상률', '인상', '기본급', '처우'],
    '스톡옵션·지분': ['스톡옵션', '지분', '인센티브'],
    '보상체계': ['보상체계', '페이밴드', '성과급', '상여', '보상제도'],
  },
  '조직관리': {
    '조직문화': ['조직문화', '문화', '몰입'],
    '퇴사·이직·리텐션': ['퇴사', '이직', '리텐션', '인재밀도', '온보딩'],
    '조직개편·M&A': ['조직개편', '팀빌딩', '레벨링', '승진', 'PMI', 'M&A', 'HRBP'],
  },
  '리더십': {
    '대표·경영진': ['대표', '경영진', '임원'],
    '의사결정': ['의사결정', '권한', '결정'],
    '리더와 구성원': ['구성원', '매니저', '조직장', '신뢰'],
  },
  '노무': {
    '근로시간': ['근로시간', '52시간', '장시간'],
    '노동법·근로기준법': ['근로기준법', '노동법', '법적', '징계', '근로계약'],
    '노무 리스크·감독': ['근로감독', '해고', 'ER', '리스크'],
  },
  '커리어·성장': {
    '커리어 성장': ['성장', '역량', '커리어패스'],
    '이직·전직': ['이직', '전직'],
    '자기계발·퍼스널브랜딩': ['자기계발', '퍼스널브랜딩'],
  },
  '경영·비즈니스': {
    '경영전략': ['전략', '경영'],
    '투자·M&A': ['투자', '인수', 'VC', 'M&A'],
    '운영·사업': ['운영', '사업', '매출', '고객', '시장'],
  },
  '에세이·멘탈': {
    '멘탈·번아웃': ['번아웃', '불안', '멘탈', '회복'],
    '취중잡담': ['취중잡담', '현타'],
    '에세이': ['에세이', '감정'],
  },
  '기타': {
    '기타': [],
  },
};

function subcategorize(post, cat) {
  const subs = SUBCATEGORIES[cat] || SUBCATEGORIES['기타'];
  const hay = `${post.title} ${post.keywords || ''} ${post.series || ''} ${post.text || ''}`;
  let best = Object.keys(subs)[0];
  let bestScore = 0;
  for (const [sub, terms] of Object.entries(subs)) {
    let score = 0;
    for (const term of terms) {
      let idx = hay.indexOf(term);
      while (idx !== -1) { score++; idx = hay.indexOf(term, idx + term.length); }
    }
    if (score > bestScore) { bestScore = score; best = sub; }
  }
  return best;
}

const brunchPosts = brunch.map((p) => {
  const category = categorize(p);
  return {
    id: 'b_' + p.id,
    title: p.title,
    url: p.url,
    date: p.date,
    series: p.series || '',
    keywords: p.keywords || '',
    text: p.text || '',
    source: '브런치',
    category,
    subcategory: subcategorize(p, category),
  };
});

const youtubePosts = youtube.map((p) => {
  const category = categorize(p);
  return {
    id: 'y_' + p.id,
    title: p.title,
    url: p.url,
    date: p.date,
    series: '유튜브',
    keywords: '',
    text: p.text || '',
    source: '유튜브',
    category,
    subcategory: subcategorize(p, category),
  };
});

const merged = [...brunchPosts, ...youtubePosts];
writeFileSync(path.join(outDir, 'corpus.json'), JSON.stringify(merged), 'utf8');

const counts = {};
for (const p of merged) counts[p.category] = (counts[p.category] || 0) + 1;
console.log('Total:', merged.length);
console.log('By category:', counts);
