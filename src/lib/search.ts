export type Post = {
  id: string;
  title: string;
  url: string;
  date: string;
  series: string;
  keywords: string;
  text: string;
  source: string;
  category: string;
  subcategory: string;
  summary?: string;
};

type IndexedPost = Post & {
  _title: string;
  _meta: string;
  _body: string;
};

const STOP = new Set([
  '이드', '이드가', '이드는', '이드님', '무엇', '뭐', '뭔가', '어떻게', '어떤', '어떠', '왜', '언제', '어디', '누가',
  '정말', '그냥', '관련', '대해', '대한', '대해서', '이야기', '얘기', '생각', '하나요', '했나요', '있나요', '인가요',
  '일까요', '할까요', '해야', '하는', '하면', '하고', '있는', '없는', '같은', '무슨', '알려줘', '알려주세요', '궁금',
  '궁금해요', '설명', '주로', '좀', '글', '글에서', '시리즈', '것은', '것이', '거라고', '거야', '되나', '되나요',
  '잘하', '잘하는', '왔을', '만들어졌', '만들어', '이드라', '이드의', '방법', '법', '때', '경우', '하려면', '싶어요',
  '싶은', '좋은', '좋을까요', '있을까요', '뭘까요', '무엇인가요', '뭔가요', '인지', '싶을', '싶다', '되었', '됐을',
  '뭐예', '뭐예요', '처음',
]);

const SUFFIXES = [
  '이라고', '라고', '에서는', '에게서', '으로는', '에서', '에게', '으로', '하고', '이나', '이랑', '랑', '까지', '부터',
  '처럼', '보다', '에는', '에도', '와', '과', '은', '는', '이', '가', '을', '를', '에', '로', '도', '만', '의', '요',
  '나요', '까요', '가요', '죠', '다', '해', '한', '할', '하는', '했나요', '하나요', '인가요', '일까요', '할까요',
  '해야', '하면', '했다', '한다', '된', '되는', '이란', '란', '하게',
].sort((a, b) => b.length - a.length);

function compact(s: string) {
  return (s || '').toLowerCase().replace(/[^가-힣a-z0-9]+/g, '');
}

function stem(w: string) {
  w = w.toLowerCase();
  if (!/[가-힣]$/.test(w)) return w;
  for (let k = 0; k < 2; k++) {
    for (const s of SUFFIXES) {
      if (w.length - s.length >= 2 && w.slice(-s.length) === s) { w = w.slice(0, -s.length); break; }
    }
  }
  return w;
}

function queryTerms(query: string): { t: string; w: number }[] {
  const m = (query || '').match(/[가-힣a-zA-Z0-9]+/g) || [];
  const out: { t: string; w: number }[] = [];
  m.forEach((w) => {
    if (STOP.has(w)) return;
    const s = stem(w);
    if (s.length < 2 || STOP.has(s)) return;
    if (out.some((o) => o.t === s)) return;
    out.push({ t: s, w: 1 });
    if (/^[가-힣]{4,}$/.test(s)) {
      const half = Math.floor(s.length / 2);
      [s.slice(0, half), s.slice(half)].forEach((p) => {
        if (p.length >= 2 && !STOP.has(p) && !out.some((o) => o.t === p)) out.push({ t: p, w: 0.5 });
      });
    }
  });
  return out;
}

function countOcc(hay: string, needle: string) {
  let c = 0;
  let i = hay.indexOf(needle);
  while (i !== -1) { c++; i = hay.indexOf(needle, i + needle.length); }
  return c;
}

export class SearchIndex {
  posts: IndexedPost[];
  df: Map<string, number> = new Map();
  n: number;
  avgLen = 1;

  constructor(posts: Post[]) {
    this.posts = posts.map((p) => ({
      ...p,
      _title: compact(p.title),
      _meta: compact(`${p.keywords || ''} ${p.series || ''}`),
      _body: compact(p.text),
    }));
    this.n = this.posts.length;
    let total = 0;
    for (const p of this.posts) total += p._body.length;
    this.avgLen = total / Math.max(1, this.n);
  }

  idf(df: number, weight: number) {
    return Math.log(1 + (this.n - df + 0.5) / (df + 0.5)) * weight;
  }

  search(query: string, topK = 8, category?: string, subcategory?: string): { post: Post; score: number; qTokens: string[] }[] {
    const terms = queryTerms(query);
    let pool = category && category !== '전체' ? this.posts.filter((p) => p.category === category) : this.posts;
    if (subcategory) pool = pool.filter((p) => p.subcategory === subcategory);
    if (!terms.length) return [];

    const stats = terms.map((tw) => {
      let df = 0;
      const per = pool.map((p) => {
        const b = countOcc(p._body, tw.t);
        const ti = countOcc(p._title, tw.t);
        const me = countOcc(p._meta, tw.t);
        if (b || ti || me) df++;
        return { b, ti, me };
      });
      return { term: tw.t, df, idf: this.idf(df, tw.w), per };
    });

    const active = stats.filter((s) => s.df > 0);
    if (!active.length) return [];
    const idfSum = active.reduce((a, s) => a + s.idf, 0);
    const k1 = 1.2;
    const bb = 0.75;

    const scored = pool.map((post, j) => {
      let score = 0;
      let covered = 0;
      for (const s of active) {
        const c = s.per[j];
        if (!(c.b || c.ti || c.me)) continue;
        covered += s.idf;
        const tf = c.b + c.ti * 6 + c.me * 3;
        const norm = (tf * (k1 + 1)) / (tf + k1 * (1 - bb + (bb * post._body.length) / this.avgLen));
        score += s.idf * norm;
        if (c.ti) score += s.idf * 1.5;
      }
      const coverage = covered / idfSum;
      score *= 0.35 + 0.65 * coverage * coverage;
      return { post, score, qTokens: active.map((s) => s.term) };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function termRegex(t: string) {
  return t
    .split('')
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*');
}

function bestWindow(text: string, qTokens: string[], size: number) {
  const hits: { i: number; t: number }[] = [];
  qTokens.forEach((qt, ti) => {
    const re = new RegExp(termRegex(qt), 'gi');
    let m;
    while ((m = re.exec(text))) {
      hits.push({ i: m.index, t: ti });
      if (hits.length > 2000) break;
    }
  });
  if (!hits.length) return 0;
  hits.sort((a, b) => a.i - b.i);
  let best = hits[0].i;
  let bestScore = -1;
  let lo = 0;
  for (let hi = 0; hi < hits.length; hi++) {
    while (hits[hi].i - hits[lo].i > size) lo++;
    const distinct = new Set<number>();
    let n = 0;
    for (let k = lo; k <= hi; k++) { distinct.add(hits[k].t); n++; }
    const sc = distinct.size * 10 + n;
    if (sc > bestScore) { bestScore = sc; best = hits[lo].i; }
  }
  return best;
}

export function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function makeSnippet(post: Post, qTokens: string[]): string {
  const text = post.text || '';
  const idx = bestWindow(text, qTokens, 150);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, start + 200);
  const raw = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  let escaped = escapeHtml(raw);
  qTokens.forEach((qt) => {
    const re = new RegExp(`(${termRegex(qt)})`, 'gi');
    escaped = escaped.replace(re, '<mark>$1</mark>');
  });
  return escaped;
}

export const CATEGORY_LIST = ['전체', '리더십', '경영·비즈니스', '조직관리', '채용', '에세이·멘탈', '커리어·성장', '보상', '평가', '노무', '기타'];

export const SUBCATEGORY_LIST: Record<string, string[]> = {
  '채용': ['채용 전략·프로세스', '면접·후보자 평가', '이력서·포지션'],
  '평가': ['피드백', '평가제도', '성과관리·목표'],
  '보상': ['연봉·인상률', '스톡옵션·지분', '보상체계'],
  '조직관리': ['조직문화', '퇴사·이직·리텐션', '조직개편·M&A'],
  '리더십': ['대표·경영진', '의사결정', '리더와 구성원'],
  '노무': ['근로시간', '노동법·근로기준법', '노무 리스크·감독'],
  '커리어·성장': ['커리어 성장', '이직·전직', '자기계발·퍼스널브랜딩'],
  '경영·비즈니스': ['경영전략', '투자·M&A', '운영·사업'],
  '에세이·멘탈': ['멘탈·번아웃', '취중잡담', '에세이'],
  '기타': ['기타'],
};
