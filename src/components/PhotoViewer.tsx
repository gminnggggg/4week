import { Icon } from './Icon';
import { useStore } from '../store';
import { TAG_STYLE } from './tags';

export function PhotoViewer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { byId, analysis, favorites, marked, toggleFavorite, mark, unmark, showToast } = useStore();
  const p = id ? byId.get(id) : undefined;
  if (!p) return null;
  const tag = analysis.tagOf.get(p.id);
  const fav = favorites.has(p.id);
  const isMarked = marked.has(p.id);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col pb-safe">
      <div className="flex items-center justify-between px-3 h-12 text-white">
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10" onClick={onClose}>
          <Icon name="close" className="text-[22px]" />
        </button>
        {tag && (
          <span className="text-[11px] font-bold bg-white/15 px-2 py-1 rounded-full flex items-center gap-1">
            <Icon name={TAG_STYLE[tag].icon} className="text-[13px]" />
            {TAG_STYLE[tag].label}
          </span>
        )}
        <span className="w-9" />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={onClose}>
        <img className="max-w-full max-h-full object-contain" src={p.src} alt="" />
      </div>
      <div className="flex gap-2 px-4 py-3">
        <button
          className="flex-1 h-11 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98]"
          onClick={() => toggleFavorite(p.id)}
        >
          <Icon name={fav ? 'favorite' : 'favorite_border'} className={`text-[18px] ${fav ? 'text-red-500' : ''}`} />
          즐겨찾기
        </button>
        <button
          className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] ${
            isMarked ? 'bg-white text-on-surface' : 'bg-error text-white'
          }`}
          onClick={() => {
            if (isMarked) {
              unmark([p.id]);
              showToast('삭제 목록에서 뺐어요.', 'undo');
            } else {
              mark([p.id]);
              showToast('삭제 목록에 담았어요.', 'delete');
            }
          }}
        >
          <Icon name={isMarked ? 'undo' : 'delete'} className="text-[18px]" />
          {isMarked ? '삭제 목록에서 빼기' : '삭제 목록에 담기'}
        </button>
      </div>
    </div>
  );
}
