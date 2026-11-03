/**
 * 기기 안에서만 동작하는 사진 품질 분석.
 * - 흔들림/초점: 라플라시안 분산 (값이 낮을수록 흐림)
 * - 유사 사진: dHash(64bit) 해밍 거리
 * - 스크린샷: 단색 영역 비율 + 세로로 긴 화면 비율
 * - 어두운 사진: 평균 밝기
 */

export type Features = {
  hashHi: number;
  hashLo: number;
  sharp: number;
  lum: number;
  flat: number;
  aspect: number;
};

const ANALYSIS_SIZE = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 읽을 수 없어요'));
    img.src = src;
  });
}

function toGray(data: Uint8ClampedArray, n: number) {
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return g;
}

export async function extractFeatures(src: string): Promise<Features> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, ANALYSIS_SIZE / Math.max(iw, ih));
  const w = Math.max(9, Math.round(iw * scale));
  const h = Math.max(8, Math.round(ih * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const gray = toGray(ctx.getImageData(0, 0, w, h).data, w * h);

  // 평균 밝기
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const lum = sum / gray.length;

  // 라플라시안 분산
  let lsum = 0;
  let lsq = 0;
  let cnt = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      lsum += v;
      lsq += v * v;
      cnt++;
    }
  }
  const mean = lsum / cnt;
  const sharp = lsq / cnt - mean * mean;

  // 단색 블록 비율
  const B = 8;
  let flatBlocks = 0;
  let blocks = 0;
  for (let by = 0; by + B <= h; by += B) {
    for (let bx = 0; bx + B <= w; bx += B) {
      let mn = 255;
      let mx = 0;
      for (let y = by; y < by + B; y++) {
        for (let x = bx; x < bx + B; x++) {
          const v = gray[y * w + x];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      }
      blocks++;
      if (mx - mn <= 3) flatBlocks++;
    }
  }
  const flat = blocks ? flatBlocks / blocks : 0;

  // dHash (9x8)
  const hc = document.createElement('canvas');
  hc.width = 9;
  hc.height = 8;
  const hctx = hc.getContext('2d', { willReadFrequently: true })!;
  hctx.imageSmoothingQuality = 'high';
  hctx.drawImage(canvas, 0, 0, 9, 8);
  const hg = toGray(hctx.getImageData(0, 0, 9, 8).data, 72);
  let hashHi = 0;
  let hashLo = 0;
  let bit = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const on = hg[y * 9 + x] > hg[y * 9 + x + 1] ? 1 : 0;
      if (bit < 32) hashHi = (hashHi | (on << bit)) >>> 0;
      else hashLo = (hashLo | (on << (bit - 32))) >>> 0;
      bit++;
    }
  }

  return { hashHi, hashLo, sharp, lum, flat, aspect: ih / iw };
}

function popcount(n: number) {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function hamming(a: Features, b: Features) {
  return popcount((a.hashHi ^ b.hashHi) >>> 0) + popcount((a.hashLo ^ b.hashLo) >>> 0);
}

// ---------------- 분류 ----------------

export const THRESHOLD = {
  similar: 10, // 해밍 거리 이하이면 유사
  blurry: 60, // 라플라시안 분산 미만이면 흐림
  sharp: 250, // 이상이면 선명
  dark: 40, // 평균 밝기 미만이면 어두움
};

export type Settings = { similar: boolean; blur: boolean; screenshot: boolean };
export const DEFAULT_SETTINGS: Settings = { similar: true, blur: true, screenshot: true };

export type Tag = 'best' | 'similar' | 'blurry' | 'dark' | 'screenshot';

export type AnalyzedPhoto = { id: string; f: Features };

export type Group = { ids: string[]; best: string };

export type Analysis = {
  groups: Group[];
  similar: string[];
  screenshots: string[];
  blurry: string[];
  dark: string[];
  candidates: Set<string>;
  bestShots: string[];
  tagOf: Map<string, Tag>;
  groupOf: Map<string, Group>;
};

export function isScreenshot(f: Features) {
  // 화면 캡처는 단색 배경 + 글자 경계 때문에 선명도가 매우 높아요.
  // 흐린 사진도 단색 블록이 많아질 수 있어 선명도 조건을 함께 봐요.
  if (f.sharp < 300) return false;
  return (f.aspect >= 1.6 && f.flat >= 0.3) || f.flat >= 0.6;
}

export function classify(photos: AnalyzedPhoto[], settings: Settings, favorites: Set<string>): Analysis {
  const tagOf = new Map<string, Tag>();
  const groupOf = new Map<string, Group>();
  const shots = new Set<string>();

  if (settings.screenshot) {
    for (const p of photos) if (isScreenshot(p.f)) shots.add(p.id);
  }
  const normal = photos.filter((p) => !shots.has(p.id));

  // 유사 묶음 (union-find)
  const groups: Group[] = [];
  if (settings.similar) {
    const parent = normal.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < normal.length; i++) {
      for (let j = i + 1; j < normal.length; j++) {
        if (hamming(normal[i].f, normal[j].f) <= THRESHOLD.similar) parent[find(i)] = find(j);
      }
    }
    const buckets = new Map<number, AnalyzedPhoto[]>();
    normal.forEach((p, i) => {
      const r = find(i);
      if (!buckets.has(r)) buckets.set(r, []);
      buckets.get(r)!.push(p);
    });
    for (const members of buckets.values()) {
      if (members.length < 2) continue;
      const best = [...members].sort(
        (a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || b.f.sharp - a.f.sharp,
      )[0];
      const g = { ids: members.map((m) => m.id), best: best.id };
      groups.push(g);
      for (const id of g.ids) groupOf.set(id, g);
    }
  }

  const similar: string[] = [];
  const blurry: string[] = [];
  const dark: string[] = [];
  const screenshots = [...shots];
  for (const id of screenshots) tagOf.set(id, 'screenshot');

  for (const p of normal) {
    const g = groupOf.get(p.id);
    if (g && g.best !== p.id) {
      similar.push(p.id);
      tagOf.set(p.id, 'similar');
      continue;
    }
    if (settings.blur && p.f.lum < THRESHOLD.dark) {
      dark.push(p.id);
      tagOf.set(p.id, 'dark');
      continue;
    }
    if (settings.blur && p.f.sharp < THRESHOLD.blurry) {
      blurry.push(p.id);
      tagOf.set(p.id, 'blurry');
      continue;
    }
    if (g) tagOf.set(p.id, 'best');
  }

  // 즐겨찾기는 절대 정리 후보로 올리지 않아요
  const candidates = new Set([...similar, ...screenshots, ...blurry, ...dark].filter((id) => !favorites.has(id)));

  const bestShots = normal
    .filter((p) => !candidates.has(p.id) && p.f.sharp >= THRESHOLD.sharp)
    .sort((a, b) => b.f.sharp - a.f.sharp)
    .map((p) => p.id);
  // 상위 선명 사진에 베스트 태그
  for (const id of bestShots.slice(0, Math.max(1, Math.ceil(photos.length * 0.2)))) {
    if (!tagOf.has(id)) tagOf.set(id, 'best');
  }

  return { groups, similar, screenshots, blurry, dark, candidates, bestShots, tagOf, groupOf };
}
