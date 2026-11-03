import { Icon } from './Icon';
import { useStore } from '../store';

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  const { addPhotos, progress } = useStore();
  return (
    <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-black/[0.03] flex flex-col items-center text-center gap-2">
      <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon name="add_photo_alternate" className="text-[26px]" />
      </span>
      <h3 className="text-sm font-bold text-on-surface mt-1">{title}</h3>
      <p className="text-[11px] text-outline leading-snug whitespace-pre-line">{desc}</p>
      <button
        className="mt-2 w-full h-10 bg-primary text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm"
        onClick={addPhotos}
        disabled={!!progress}
      >
        <Icon name="photo_library" className="text-[16px]" />
        사진 불러와서 분석하기
      </button>
    </section>
  );
}
