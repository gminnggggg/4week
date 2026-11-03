import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { scrapDB } from './lib/db';
import { haptic, pickPhotos } from './lib/device';
import { blobToBase64, prepareImage, requestAnalysis, type ScrapRecord } from './lib/scrap';

const CONCURRENCY = 2;
const MAX_SCRAPS = 500;

type ScrapStore = {
  scraps: ScrapRecord[];
  urlOf: (id: string) => string | undefined;
  loaded: boolean;
  adding: boolean;
  addScraps: () => Promise<void>;
  retry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markViewed: (id: string) => void;
  remove: (id: string) => void;
  openScrap: (id: string) => void;
};

const Ctx = createContext<ScrapStore>(null!);
export const useScraps = () => useContext(Ctx);

export function ScrapProvider({
  children,
  showToast,
  openScrap,
}: {
  children: ReactNode;
  showToast: (m: string, i?: string) => void;
  openScrap: (id: string) => void;
}) {
  const [scraps, setScraps] = useState<ScrapRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const urls = useRef(new Map<string, string>());
  const queue = useRef<string[]>([]);
  const running = useRef(0);
  const byId = useRef(new Map<string, ScrapRecord>());

  const urlOf = useCallback((id: string) => {
    const r = byId.current.get(id);
    if (!r) return undefined;
    let u = urls.current.get(id);
    if (!u) {
      u = URL.createObjectURL(r.image);
      urls.current.set(id, u);
    }
    return u;
  }, []);

  const update = useCallback((id: string, patch: Partial<ScrapRecord>) => {
    const cur = byId.current.get(id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    byId.current.set(id, next);
    scrapDB.put(next);
    setScraps((prev) => prev.map((s) => (s.id === id ? next : s)));
  }, []);

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!;
      const rec = byId.current.get(id);
      if (!rec) continue;
      running.current++;
      (async () => {
        try {
          const base64 = await blobToBase64(rec.image);
          const res = await requestAnalysis(base64);
          if (res.ok) update(id, { status: 'done', data: res.data, error: null });
          else update(id, { status: 'error', error: res.code });
        } catch {
          update(id, { status: 'error', error: 'internal' });
        } finally {
          running.current--;
          pump();
        }
      })();
    }
  }, [update]);

  const enqueue = useCallback(
    (ids: string[]) => {
      queue.current.push(...ids.filter((id) => !queue.current.includes(id)));
      pump();
    },
    [pump],
  );

  // 처음 열 때 저장된 스크랩을 불러오고, 끝나지 않은 분석은 이어서 해요
  useEffect(() => {
    scrapDB
      .all()
      .then((all) => {
        all.sort((a, b) => b.createdAt - a.createdAt);
        all.forEach((r) => byId.current.set(r.id, r));
        setScraps(all);
        enqueue(all.filter((r) => r.status === 'pending').map((r) => r.id));
      })
      .catch(() => showToast('저장된 스크랩을 불러오지 못했어요.', 'error'))
      .finally(() => setLoaded(true));
  }, [enqueue, showToast]);

  const addScraps = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await pickPhotos({ maxCount: 20, maxWidth: 1024 });
      if (!res.ok) {
        showToast(res.reason === 'denied' ? '사진 접근 권한이 필요해요.' : '캡처를 불러오지 못했어요.', 'error');
        return;
      }
      const fresh = res.photos.filter((p) => !byId.current.has(p.id)).slice(0, MAX_SCRAPS - byId.current.size);
      if (fresh.length === 0) {
        if (res.photos.length) showToast('이미 저장한 캡처예요.', 'info');
        return;
      }
      const now = Date.now();
      const records: ScrapRecord[] = [];
      for (let i = 0; i < fresh.length; i++) {
        try {
          const { blob } = await prepareImage(fresh[i].src);
          records.push({
            id: fresh[i].id,
            createdAt: now - i, // 고른 순서 유지
            viewedAt: null,
            favorite: false,
            status: 'pending',
            error: null,
            data: null,
            image: blob,
          });
        } catch {
          /* 읽을 수 없는 이미지는 건너뛰어요 */
        } finally {
          if (fresh[i].src.startsWith('blob:')) URL.revokeObjectURL(fresh[i].src);
        }
      }
      records.forEach((r) => {
        byId.current.set(r.id, r);
        scrapDB.put(r);
      });
      setScraps((prev) => [...records, ...prev]);
      enqueue(records.map((r) => r.id));
      haptic('success');
      showToast(`캡처 ${records.length}장을 저장했어요. 분석을 시작할게요.`, 'bookmark_added');
    } finally {
      setAdding(false);
    }
  }, [adding, enqueue, showToast]);

  const retry = useCallback(
    (id: string) => {
      update(id, { status: 'pending', error: null });
      enqueue([id]);
    },
    [enqueue, update],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const r = byId.current.get(id);
      if (!r) return;
      haptic('basicWeak');
      update(id, { favorite: !r.favorite });
      showToast(r.favorite ? '즐겨찾기에서 뺐어요.' : '즐겨찾기에 추가했어요.', r.favorite ? 'favorite_border' : 'favorite');
    },
    [showToast, update],
  );

  const markViewed = useCallback((id: string) => update(id, { viewedAt: Date.now() }), [update]);

  const remove = useCallback((id: string) => {
    byId.current.delete(id);
    const u = urls.current.get(id);
    if (u) URL.revokeObjectURL(u);
    urls.current.delete(id);
    queue.current = queue.current.filter((q) => q !== id);
    scrapDB.remove(id);
    setScraps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({ scraps, urlOf, loaded, adding, addScraps, retry, toggleFavorite, markViewed, remove, openScrap }),
    [scraps, urlOf, loaded, adding, addScraps, retry, toggleFavorite, markViewed, remove, openScrap],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
