/** 캡처 스크랩: 타입, 서버 분석 호출, 이미지 준비, 검색, 바로가기 링크 */

export type Category = 'food' | 'recipe' | 'shopping' | 'travel' | 'info' | 'other';

/** server/src/schema.ts 의 ScrapSchema와 같은 모양 */
export type ScrapData = {
  category: Category;
  title: string;
  summary: string;
  text: string;
  places: { name: string; area: string | null; address: string | null }[];
  products: { name: string; brand: string | null; price: string | null }[];
  ingredients: string[];
  tags: string[];
};

export type ScrapStatus = 'pending' | 'done' | 'error';

export type ScrapRecord = {
  id: string;
  createdAt: number;
  viewedAt: number | null;
  favorite: boolean;
  status: ScrapStatus;
  error: string | null;
  data: ScrapData | null;
  image: Blob;
};

export const CATEGORY: Record<Category, { label: string; icon: string; color: string; bg: string; synonyms: string[] }> = {
  food: { label: '맛집', icon: 'restaurant', color: 'text-tertiary', bg: 'bg-tertiary/10', synonyms: ['맛집', '카페', '식당', '음식', '디저트'] },
  recipe: { label: '레시피', icon: 'skillet', color: 'text-secondary', bg: 'bg-secondary-container/40', synonyms: ['레시피', '요리', '음식', '반찬', '장보기'] },
  shopping: { label: '쇼핑', icon: 'shopping_bag', color: 'text-primary', bg: 'bg-primary/10', synonyms: ['쇼핑', '상품', '옷', '구매', '위시'] },
  travel: { label: '여행', icon: 'flight', color: 'text-primary-container', bg: 'bg-primary-container/10', synonyms: ['여행', '숙소', '호텔', '예약', '관광'] },
  info: { label: '정보', icon: 'lightbulb', color: 'text-on-surface-variant', bg: 'bg-surface-container', synonyms: ['정보', '꿀팁', '메모'] },
  other: { label: '기타', icon: 'category', color: 'text-outline', bg: 'bg-surface-container', synonyms: ['기타'] },
};

export const CATEGORY_ORDER: Category[] = ['food', 'recipe', 'shopping', 'travel', 'info', 'other'];

// ---------------- 서버 호출 ----------------

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

const ERROR_TEXT: Record<string, string> = {
  rate_limited: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
  busy: '분석 서버가 바빠요. 잠시 후 다시 시도해 주세요.',
  image_too_large: '이미지가 너무 커요.',
  bad_image: '이미지를 읽지 못했어요.',
  refused: '이 이미지는 분석할 수 없어요.',
  no_server: '분석 서버 주소가 설정되지 않았어요.',
  network: '인터넷 연결을 확인해 주세요.',
};
export const errorText = (code: string | null) => (code && ERROR_TEXT[code]) || '분석에 실패했어요. 다시 시도해 주세요.';

export async function requestAnalysis(base64: string): Promise<{ ok: true; data: ScrapData } | { ok: false; code: string }> {
  if (!API_BASE) return { ok: false, code: 'no_server' };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
    });
  } catch {
    return { ok: false, code: 'network' };
  }
  const body = (await res.json().catch(() => ({}))) as { scrap?: ScrapData; error?: string };
  if (res.ok && body.scrap) return { ok: true, data: body.scrap };
  return { ok: false, code: body.error ?? `http_${res.status}` };
}

// ---------------- 이미지 준비 ----------------

const MAX_SIDE = 1024;

/** 긴 변 1024px JPEG로 줄여서 저장용 Blob과 전송용 base64를 만들어요. */
export async function prepareImage(src: string): Promise<{ blob: Blob; base64: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('load'));
    i.src = src;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const blob = await (await fetch(dataUrl)).blob();
  return { blob, base64 };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

// ---------------- 검색 ----------------

const DAY = 86_400_000;

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "지난달 성수동 카페" 같은 문장에서 기간 표현을 뽑고 나머지를 검색어로 나눠요. */
export function parseQuery(q: string, now = Date.now()) {
  let rest = ` ${q.trim()} `;
  let since: number | undefined;
  let until: number | undefined;
  const today = startOfDay(now);
  const d = new Date(now);
  const rules: [RegExp, () => void][] = [
    [/\s오늘\s/, () => { since = today; }],
    [/\s어제\s/, () => { since = today - DAY; until = today; }],
    [/\s(이번\s?주)\s/, () => { since = today - ((d.getDay() + 6) % 7) * DAY; }],
    [/\s(지난\s?주)\s/, () => { const mon = today - ((d.getDay() + 6) % 7) * DAY; since = mon - 7 * DAY; until = mon; }],
    [/\s(이번\s?달)\s/, () => { since = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }],
    [/\s(지난\s?달)\s/, () => { since = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(); until = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }],
    [/\s(올해)\s/, () => { since = new Date(d.getFullYear(), 0, 1).getTime(); }],
  ];
  for (const [re, apply] of rules) {
    if (re.test(rest)) {
      apply();
      rest = rest.replace(re, ' ');
    }
  }
  const terms = rest
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^#/, '').replace(/(에서|에|의|을|를|은|는|이|가)$/, ''))
    .filter((t) => t.length > 0);
  return { terms, since, until };
}

export function haystack(s: ScrapRecord) {
  const d = s.data;
  if (!d) return '';
  const c = CATEGORY[d.category];
  return [
    d.title, d.summary, d.text, d.tags.join(' '), d.ingredients.join(' '),
    d.places.map((p) => [p.name, p.area, p.address].filter(Boolean).join(' ')).join(' '),
    d.products.map((p) => [p.name, p.brand].filter(Boolean).join(' ')).join(' '),
    c.label, c.synonyms.join(' '),
  ].join(' ').toLowerCase();
}

export function searchScraps(scraps: ScrapRecord[], q: string, category: Category | 'all') {
  const { terms, since, until } = parseQuery(q);
  return scraps.filter((s) => {
    if (category !== 'all' && s.data?.category !== category) return false;
    if (since && s.createdAt < since) return false;
    if (until && s.createdAt >= until) return false;
    if (terms.length === 0) return true;
    if (!s.data) return false;
    const h = haystack(s);
    return terms.every((t) => h.includes(t));
  });
}

// ---------------- 바로가기 ----------------

const enc = encodeURIComponent;
export const LINKS = {
  naverMap: (q: string) => `https://map.naver.com/p/search/${enc(q)}`,
  kakaoMap: (q: string) => `https://map.kakao.com/link/search/${enc(q)}`,
  coupang: (q: string) => `https://www.coupang.com/np/search?q=${enc(q)}`,
  naverShopping: (q: string) => `https://search.shopping.naver.com/search/all?query=${enc(q)}`,
  kurly: (q: string) => `https://www.kurly.com/search?sword=${enc(q)}`,
  youtube: (q: string) => `https://www.youtube.com/results?search_query=${enc(q)}`,
};

export function placeQuery(p: { name: string; area: string | null; address: string | null }) {
  return [p.area, p.name].filter(Boolean).join(' ');
}

// ---------------- 내보내기 ----------------

export function toCSV(scraps: ScrapRecord[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['저장일', '카테고리', '제목', '요약', '장소', '상품', '재료', '태그', '추출 텍스트']];
  for (const s of scraps) {
    const d = s.data;
    if (!d) continue;
    rows.push([
      new Date(s.createdAt).toLocaleDateString('ko-KR'),
      CATEGORY[d.category].label,
      d.title,
      d.summary,
      d.places.map(placeQuery).join(' / '),
      d.products.map((p) => p.name).join(' / '),
      d.ingredients.join(', '),
      d.tags.join(', '),
      d.text,
    ]);
  }
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
}
