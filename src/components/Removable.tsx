import { useState } from 'react';

/** 카드가 사라질 때 원본 디자인과 같은 fade/scale 애니메이션을 준 뒤 숨겨요. */
export function useRemovable(delay: number) {
  const [state, setState] = useState<'shown' | 'fading' | 'gone'>('shown');
  const remove = (after?: () => void) => {
    if (state !== 'shown') return;
    setState('fading');
    setTimeout(() => {
      setState('gone');
      after?.();
    }, delay);
  };
  return { state, remove };
}

export function fadeStyle(state: 'shown' | 'fading' | 'gone', scale: number) {
  if (state === 'gone') return { display: 'none' } as const;
  if (state === 'fading') return { opacity: 0, transform: `scale(${scale})` };
  return undefined;
}

