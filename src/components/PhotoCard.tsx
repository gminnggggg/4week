import { Icon } from './Icon';
import { TAG_STYLE } from './tags';
import { useStore, type Photo } from '../store';

/** 홈 피드 2열 그리드의 사진 카드 */
export function PhotoCard({ p }: { p: Photo }) {
  const { analysis, favorites, marked, toggleFavorite, mark, unmark, showToast, openViewer } = useStore();
  const tag = analysis.tagOf.get(p.id);
  const group = analysis.groupOf.get(p.id);
  const fav = favorites.has(p.id);
  const isMarked = marked.has(p.id);
  const isCandidate = analysis.candidates.has(p.id);
  const style = tag ? TAG_STYLE[tag] : null;

  const sub = !p.f
    ? '분석 중...'
    : tag === 'similar' || (tag === 'best' && group)
      ? `비슷한 사진 ${group?.ids.length ?? 0}장 중 ${tag === 'best' ? '베스트' : '하나'}`
      : tag === 'blurry'
        ? '초점이 맞지 않았어요'
        : tag === 'dark'
          ? '너무 어둡게 찍혔어요'
          : tag === 'screenshot'
            ? '스크린샷으로 보여요'
            : tag === 'best'
              ? '선명하게 잘 나왔어요'
              : '정리할 필요 없어요';

  return (
    <div className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col relative transition-opacity ${isMarked ? 'opacity-50' : ''}`}>
      <div className="aspect-[3/4] relative overflow-hidden" onClick={() => openViewer(p.id)}>
        <img className={`w-full h-full object-cover ${tag === 'blurry' ? 'opacity-85' : ''}`} src={p.src} alt="" />
        {style && (
          <span className={`absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold ${style.color} px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}>
            <Icon name={style.icon} className="text-[11px]" />
            {tag === 'similar' && group ? `유사 ${group.ids.length}장` : style.label}
          </span>
        )}
        <button
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center active:scale-75 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(p.id);
          }}
        >
          <Icon name={fav ? 'favorite' : 'favorite_border'} className={`text-[14px] ${fav ? 'text-red-500' : ''}`} />
        </button>
        {(isCandidate || isMarked) && (
          <button
            className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm active:scale-90 transition-transform ${
              isMarked ? 'bg-white/95 text-on-surface' : 'bg-white/95 text-error'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isMarked) {
                unmark([p.id]);
                showToast('삭제 목록에서 뺐어요.', 'undo');
              } else {
                mark([p.id]);
                showToast('삭제 목록에 담았어요.', 'delete');
              }
            }}
          >
            <Icon name={isMarked ? 'undo' : 'delete'} className="text-[12px]" />
            {isMarked ? '취소' : '정리'}
          </button>
        )}
      </div>
      <div className="p-2 flex flex-col">
        <span className={`text-[11px] font-bold truncate ${isCandidate ? 'text-error' : 'text-on-surface'}`}>{isMarked ? '삭제 목록에 담김' : style?.label ?? '일반 사진'}</span>
        <span className="text-[9px] text-outline truncate">{sub}</span>
      </div>
    </div>
  );
}
