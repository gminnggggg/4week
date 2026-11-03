import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useStore } from '../store';

export type ReviewRequest = {
  title: string;
  desc: string;
  ids: string[];
  preselected: string[];
  bestId?: string;
};

/** 사진을 하나씩 확인하고 삭제 목록에 담을 사진을 고르는 바텀시트 */
export function ReviewSheet({ req, onClose }: { req: ReviewRequest | null; onClose: () => void }) {
  const { byId, mark, showToast } = useStore();
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (req) setSel(new Set(req.preselected));
  }, [req]);

  if (!req) return null;

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-t-3xl max-h-[85dvh] flex flex-col pb-safe">
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mt-2.5" />
        <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-on-surface">{req.title}</h3>
            <p className="text-[11px] text-outline mt-0.5">{req.desc}</p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-outline active:scale-90" onClick={onClose}>
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4">
          <div className="grid grid-cols-3 gap-1.5 pb-3">
            {req.ids.map((id) => {
              const p = byId.get(id);
              if (!p) return null;
              const on = sel.has(id);
              return (
                <button key={id} className="relative rounded-lg overflow-hidden aspect-square active:scale-95 transition-transform" onClick={() => toggle(id)}>
                  <img className={`w-full h-full object-cover transition-opacity ${on ? 'opacity-50' : ''}`} src={p.src} alt="" />
                  {req.bestId === id && (
                    <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">베스트</span>
                  )}
                  <span
                    className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      on ? 'bg-error border-error text-white' : 'bg-black/20 border-white text-transparent'
                    }`}
                  >
                    <Icon name="check" className="text-[13px]" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-4 pt-2 pb-3 border-t border-surface-container-high">
          <button
            className="w-full h-11 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-40"
            disabled={sel.size === 0}
            onClick={() => {
              mark([...sel]);
              showToast(`${sel.size}장을 삭제 목록에 담았어요.`, 'check_circle');
              onClose();
            }}
          >
            <Icon name="playlist_add_check" className="text-[16px]" />
            {sel.size}장 삭제 목록에 담기
          </button>
        </div>
      </div>
    </div>
  );
}
