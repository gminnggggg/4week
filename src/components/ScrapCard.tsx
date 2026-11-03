import { Icon } from './Icon';
import { CATEGORY, errorText, type ScrapRecord } from '../lib/scrap';
import { useScraps } from '../scrapStore';

export function ScrapCard({ s }: { s: ScrapRecord }) {
  const { urlOf, openScrap, toggleFavorite, retry } = useScraps();
  const d = s.data;
  const cat = d ? CATEGORY[d.category] : null;

  return (
    <article
      className="mb-2 break-inside-avoid bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col relative active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => openScrap(s.id)}
    >
      <div className="relative overflow-hidden">
        <img className={`w-full max-h-72 object-cover object-top ${s.status === 'pending' ? 'opacity-60' : ''}`} src={urlOf(s.id)} alt="" />
        {cat && (
          <span className={`absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold ${cat.color} px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}>
            <Icon name={cat.icon} className="text-[11px]" />
            {cat.label}
          </span>
        )}
        {s.status === 'pending' && (
          <span className="absolute top-1.5 left-1.5 bg-white/90 text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Icon name="progress_activity" className="text-[11px] animate-spin" />
            분석 중
          </span>
        )}
        <button
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center active:scale-75 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(s.id);
          }}
          aria-label="즐겨찾기"
        >
          <Icon name={s.favorite ? 'favorite' : 'favorite_border'} className={`text-[14px] ${s.favorite ? 'text-red-500' : ''}`} />
        </button>
      </div>
      <div className="p-2 flex flex-col gap-0.5">
        {s.status === 'done' && d ? (
          <>
            <span className="text-[11px] font-bold text-on-surface line-clamp-2">{d.title}</span>
            <span className="text-[9px] text-outline line-clamp-2">{d.summary}</span>
            {d.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {d.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : s.status === 'error' ? (
          <>
            <span className="text-[10px] text-error">{errorText(s.error)}</span>
            <button
              className="self-start mt-1 text-[10px] font-bold text-primary flex items-center gap-0.5"
              onClick={(e) => {
                e.stopPropagation();
                retry(s.id);
              }}
            >
              <Icon name="refresh" className="text-[12px]" />
              다시 분석
            </button>
          </>
        ) : (
          <>
            <span className="h-3 w-3/4 bg-surface-container rounded animate-pulse" />
            <span className="h-2.5 w-1/2 bg-surface-container rounded animate-pulse mt-1" />
          </>
        )}
      </div>
    </article>
  );
}
