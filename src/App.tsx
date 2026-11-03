import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';
import { StoreProvider, useStore, type TabId } from './store';
import { Icon } from './components/Icon';
import { Toast } from './components/Toast';
import { PhotoViewer } from './components/PhotoViewer';
import { ReviewSheet, type ReviewRequest } from './components/ReviewSheet';
import { HomeTab } from './tabs/HomeTab';
import { CleanTab } from './tabs/CleanTab';
import { MomentsTab } from './tabs/MomentsTab';
import { InsightsTab } from './tabs/InsightsTab';

const TABS: { id: TabId; title: string; label: string; icon: string }[] = [
  { id: 'home', title: '홈 피드', label: '홈 피드', icon: 'photo_library' },
  { id: 'clean', title: '스마트 정리', label: '스마트 정리', icon: 'auto_awesome' },
  { id: 'moments', title: '베스트 모먼트', label: '모먼트', icon: 'collections_bookmark' },
  { id: 'insights', title: '인사이트', label: '인사이트', icon: 'insights' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [toast, setToast] = useState({ visible: false, msg: '', icon: 'info' });
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewRequest | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mainRef = useRef<HTMLElement>(null);

  const showToast = useCallback((msg: string, icon = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, msg, icon });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2300);
  }, []);

  const switchTab = useCallback((id: TabId) => {
    setTab(id);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 시스템 뒤로가기: 열린 창 닫기 → 홈 탭으로 → (그 외엔 기본 동작으로 앱 종료)
  const needsBack = !!viewerId || !!review || tab !== 'home';
  useEffect(() => {
    if (!needsBack) return;
    try {
      return graniteEvent.addEventListener('backEvent', {
        onEvent: () => {
          if (viewerId) setViewerId(null);
          else if (review) setReview(null);
          else switchTab('home');
        },
        onError: () => {},
      });
    } catch {
      return undefined;
    }
  }, [needsBack, viewerId, review, switchTab]);

  const ui = useMemo(
    () => ({ showToast, switchTab, openViewer: setViewerId, openReview: setReview }),
    [showToast, switchTab],
  );

  return (
    <StoreProvider ui={ui}>
      <div className="w-full h-[100dvh] bg-surface text-on-surface relative overflow-hidden flex flex-col">
        <Header tab={tab} />

        <main ref={mainRef} className="flex-1 w-full overflow-y-auto no-scrollbar app-screen-scroll bg-surface relative">
          {/* 탭 상태가 유지되도록 모든 탭을 마운트한 채 숨김 처리해요 */}
          <HomeTab active={tab === 'home'} />
          <CleanTab active={tab === 'clean'} />
          <MomentsTab active={tab === 'moments'} />
          <InsightsTab active={tab === 'insights'} />
        </main>

        <Toast {...toast} />

        <nav className="w-full flex-shrink-0 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high/70 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-40 pb-safe">
          <div className="flex justify-around items-center h-14 px-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:scale-90 transition-all ${
                  t.id === tab ? 'text-primary font-bold' : 'text-outline hover:text-on-surface'
                }`}
                onClick={() => switchTab(t.id)}
              >
                <Icon name={t.icon} className="text-[20px]" />
                <span className="text-[9px] tracking-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <ReviewSheet req={review} onClose={() => setReview(null)} />
        <PhotoViewer id={viewerId} onClose={() => setViewerId(null)} />
      </div>
    </StoreProvider>
  );
}

function Header({ tab }: { tab: TabId }) {
  const { switchTab, addPhotos, progress, marked } = useStore();
  const current = TABS.find((t) => t.id === tab)!;
  return (
    <header className="w-full flex-shrink-0 px-4 py-2 flex items-center justify-between bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 z-40">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => switchTab('home')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-sm font-bold text-xs tracking-tight">
          ON
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-on-surface leading-tight">온미디어</span>
          <span className="text-[10px] text-primary font-semibold leading-none mt-0.5">{current.title}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {progress && (
          <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mr-1">
            <Icon name="progress_activity" className="text-[14px] animate-spin" />
            {progress.done}/{progress.total}
          </span>
        )}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant active:scale-90 transition-transform relative"
          onClick={() => switchTab('clean')}
          aria-label="삭제 목록"
        >
          <Icon name="delete" className="text-[19px]" />
          {marked.size > 0 && (
            <span className="absolute top-0.5 right-0 min-w-[14px] h-[14px] px-0.5 rounded-full bg-error text-white text-[8px] font-bold flex items-center justify-center">
              {marked.size}
            </span>
          )}
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant active:scale-90 transition-transform"
          onClick={addPhotos}
          disabled={!!progress}
          aria-label="사진 추가"
        >
          <Icon name="add_photo_alternate" className="text-[19px]" />
        </button>
      </div>
    </header>
  );
}
