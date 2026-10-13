import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');
const outDir = path.join(__dirname, '..', 'public', 'data');

const brunch = JSON.parse(readFileSync(path.join(dataDir, 'brunch.json'), 'utf8'));
const youtube = JSON.parse(readFileSync(path.join(dataDir, 'youtube.json'), 'utf8'));

const CATEGORIES = {
  '채용': ['채용', '면접', '이력서', '자소서', '오퍼', '헤드헌터', '인재', '지원자', '스카우트', '수습'],
  '평가': ['평가', '고과', 'KPI', 'OKR', '피드백', '등급', '성과관리'],
  '보상': ['보상', '연봉', '인상률', '스톡옵션', '인센티브', '급여', '성과급', '상여', '퍼포먼스'],
  '조직관리': ['조직문화', 'HRBP', '몰입', '퇴사', '이직', '조직', '팀빌딩', '레벨링', '승진', 'PMI', 'M&A', '인재밀도'],
  '리더십': ['리더십', '리더', '대표', '경영진', '권한', '의사결정', '조직장', '매니저'],
  '노무': ['노무', '근로', '근로기준법', '52시간', '근로감독', '해고', 'ER', '노동', '징계'],
};

function categorize(post) {
  const hay = `${post.title} ${post.keywords || ''} ${post.text || ''}`;
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

const brunchPosts = brunch.map((p) => ({
  id: 'b_' + p.id,
  title: p.title,
  url: p.url,
  date: p.date,
  series: p.series || '',
  keywords: p.keywords || '',
  text: p.text || '',
  source: '브런치',
  category: categorize(p),
}));

const youtubePosts = youtube.map((p) => ({
  id: 'y_' + p.id,
  title: p.title,
  url: p.url,
  date: p.date,
  series: '유튜브',
  keywords: '',
  text: p.text || '',
  source: '유튜브',
  category: categorize(p),
}));

const merged = [...brunchPosts, ...youtubePosts];
writeFileSync(path.join(outDir, 'corpus.json'), JSON.stringify(merged), 'utf8');

const counts = {};
for (const p of merged) counts[p.category] = (counts[p.category] || 0) + 1;
console.log('Total:', merged.length);
console.log('By category:', counts);
