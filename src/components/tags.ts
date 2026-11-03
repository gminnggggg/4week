import type { Tag } from '../lib/analyze';

export const TAG_STYLE: Record<Tag, { label: string; icon: string; color: string }> = {
  best: { label: '베스트', icon: 'star', color: 'text-primary' },
  similar: { label: '유사', icon: 'burst_mode', color: 'text-on-surface' },
  blurry: { label: '흔들림', icon: 'blur_on', color: 'text-error' },
  dark: { label: '어두움', icon: 'dark_mode', color: 'text-tertiary' },
  screenshot: { label: '캡처', icon: 'screenshot', color: 'text-tertiary' },
};
