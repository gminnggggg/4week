import { createContext, useContext } from 'react';

export type TabId = 'home' | 'clean' | 'moments' | 'insights';

export type AppState = {
  /** 정리 가능한 용량(GB). 홈/스마트 정리 탭이 같은 값을 공유해요. */
  cleanableGB: number;
  setCleanableGB: (v: number) => void;
  showToast: (msg: string, icon?: string) => void;
  switchTab: (tab: TabId) => void;
};

export const AppContext = createContext<AppState>(null!);
export const useApp = () => useContext(AppContext);

export const formatGB = (v: number) => v.toFixed(1);
