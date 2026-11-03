import { useCallback, useRef, useState } from 'react';
import { AppContext, type TabId } from './state';
import { Icon } from './components/Icon';
import { Toast } from './components/Toast';
import { IMG } from './images';
import { HomeTab } from './tabs/HomeTab';
import { CleanTab } from './tabs/CleanTab';
import { MomentsTab } from './tabs/MomentsTab';
import { InsightsTab } from './tabs/InsightsTab';

const TABS: { id: TabId; title: string; label: string; icon: string }[] = [
  { id: 'home', title: '홈 피드', label: '홈 피드', icon: 'photo_library' },
  { id: 'clean', title: 'AI 스마트 정리', label: '스마트 정리', icon: 'auto_awesome' },
  { id: 'moments', title: '모먼트 앨범', label: '모먼트', icon: 'collections_bookmark' },
  { id: 'insights', title: '인사이트', label: '인사이트', icon: 'insights' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [cleanableGB, setCleanableGB] = useState(6.2);
  const [toast, setToast] = useState({ visible: false, msg: '안내 메시지', icon: 'info' });
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

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <AppContext.Provider value={{ cleanableGB, setCleanableGB, showToast, switchTab }}>
      <div className="w-full h-[100dvh] bg-surface text-on-surface relative overflow-hidden flex flex-col">
        {/* 상단 앱 헤더 */}
        <header className="h-13 w-full flex-shrink-0 px-4 py-2 flex items-center justify-between bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 z-40">
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
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant active:scale-90 transition-transform"
              onClick={() => showToast('AI 스마트 검색창을 열었습니다.', 'search')}
            >
              <Icon name="search" className="text-[19px]" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant active:scale-90 transition-transform relative"
              onClick={() => showToast('최근 분석 알림이 없습니다.', 'notifications')}
            >
              <Icon name="notifications" className="text-[19px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-surface" />
            </button>
            <button
              className="w-7 h-7 rounded-full overflow-hidden ml-1 ring-2 ring-primary/20 active:scale-90 transition-transform"
              onClick={() => showToast('지우님의 보관함 프로필입니다.', 'account_circle')}
            >
              <img className="w-full h-full object-cover" src={IMG.portrait} alt="" />
            </button>
          </div>
        </header>

        {/* 스크롤 본문 */}
        <main ref={mainRef} className="flex-1 w-full overflow-y-auto no-scrollbar app-screen-scroll bg-surface relative">
          {/* 탭 상태(정리 결과 등)가 유지되도록 모든 탭을 마운트한 채 숨김 처리해요 */}
          <HomeTab active={tab === 'home'} />
          <CleanTab active={tab === 'clean'} />
          <MomentsTab active={tab === 'moments'} />
          <InsightsTab active={tab === 'insights'} />
        </main>

        <Toast {...toast} />

        {/* 하단 탭바 */}
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
      </div>
    </AppContext.Provider>
  );
}
