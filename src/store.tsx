import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { classify, DEFAULT_SETTINGS, extractFeatures, type Analysis, type Features, type Settings } from './lib/analyze';
import { haptic, loadJSON, pickPhotos, saveJSON } from './lib/device';
import type { ReviewRequest } from './components/ReviewSheet';

export type TabId = 'home' | 'clean' | 'moments' | 'insights';
export type Photo = { id: string; src: string; f?: Features };

const MAX_PHOTOS = 200;

type Store = {
  photos: Photo[];
  byId: Map<string, Photo>;
  analysis: Analysis;
  progress: { done: number; total: number } | null;
  favorites: Set<string>;
  marked: Set<string>;
  settings: Settings;
  addPhotos: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  mark: (ids: string[]) => void;
  unmark: (ids: string[]) => void;
  clearMarked: () => void;
  setSetting: (k: keyof Settings, v: boolean) => void;
  resetAll: () => void;
  showToast: (msg: string, icon?: string) => void;
  switchTab: (tab: TabId) => void;
  openViewer: (id: string) => void;
  openReview: (req: ReviewRequest) => void;
};

const Ctx = createContext<Store>(null!);
export const useStore = () => useContext(Ctx);

type Ui = Pick<Store, 'showToast' | 'switchTab' | 'openViewer' | 'openReview'>;

export function StoreProvider({ children, ui }: { children: ReactNode; ui: Ui }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState<Store['progress']>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const busy = useRef(false);
  const { showToast } = ui;

  useEffect(() => {
    loadJSON<Partial<Settings>>('settings', {}).then((s) => setSettings({ ...DEFAULT_SETTINGS, ...s }));
  }, []);

  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  const analysis = useMemo(() => {
    const analyzed = photos.filter((p): p is Photo & { f: Features } => !!p.f);
    return classify(analyzed, settings, favorites);
  }, [photos, settings, favorites]);

  const addPhotos = useCallback(async () => {
    if (busy.current) return;
    if (photos.length >= MAX_PHOTOS) {
      showToast(`사진은 최대 ${MAX_PHOTOS}장까지 분석할 수 있어요.`, 'info');
      return;
    }
    busy.current = true;
    try {
      const res = await pickPhotos();
      if (!res.ok) {
        showToast(res.reason === 'denied' ? '사진 접근 권한이 필요해요.' : '사진을 불러오지 못했어요.', 'error');
        return;
      }
      const existing = new Set(photos.map((p) => p.id));
      const fresh = res.photos.filter((p) => !existing.has(p.id)).slice(0, MAX_PHOTOS - photos.length);
      if (fresh.length === 0) {
        if (res.photos.length) showToast('이미 분석한 사진이에요.', 'info');
        return;
      }
      setPhotos((prev) => [...fresh, ...prev]);
      setProgress({ done: 0, total: fresh.length });
      for (let i = 0; i < fresh.length; i++) {
        try {
          const f = await extractFeatures(fresh[i].src);
          setPhotos((prev) => prev.map((p) => (p.id === fresh[i].id ? { ...p, f } : p)));
        } catch {
          setPhotos((prev) => prev.filter((p) => p.id !== fresh[i].id));
        }
        setProgress({ done: i + 1, total: fresh.length });
      }
      setProgress(null);
      haptic('success');
      showToast(`사진 ${fresh.length}장 분석을 마쳤어요.`, 'task_alt');
    } finally {
      busy.current = false;
    }
  }, [photos, showToast]);

  const toggleFavorite = useCallback(
    (id: string) => {
      haptic('basicWeak');
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          showToast('즐겨찾기에서 제외되었습니다.', 'favorite_border');
        } else {
          next.add(id);
          showToast('즐겨찾기에 추가했어요. 정리 후보에서 빠져요.', 'favorite');
        }
        return next;
      });
      // 즐겨찾기한 사진은 삭제 목록에서도 빼요
      setMarked((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [showToast],
  );

  const mark = useCallback((ids: string[]) => {
    haptic('tap');
    setMarked((prev) => new Set([...prev, ...ids]));
  }, []);
  const unmark = useCallback((ids: string[]) => {
    setMarked((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);
  const clearMarked = useCallback(() => setMarked(new Set()), []);

  const setSetting = useCallback((k: keyof Settings, v: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, [k]: v };
      saveJSON('settings', next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    photos.forEach((p) => p.src.startsWith('blob:') && URL.revokeObjectURL(p.src));
    setPhotos([]);
    setMarked(new Set());
    setFavorites(new Set());
  }, [photos]);

  const value: Store = {
    photos, byId, analysis, progress, favorites, marked, settings,
    addPhotos, toggleFavorite, mark, unmark, clearMarked, setSetting, resetAll,
    ...ui,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
