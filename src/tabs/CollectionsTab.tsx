import { Icon } from '../components/Icon';
import { CATEGORY, CATEGORY_ORDER, type ScrapRecord } from '../lib/scrap';
import { useScraps } from '../scrapStore';

const FORGOTTEN_DAYS = 30;

function Row({ title, icon, iconClass, items }: { title: string; icon: string; iconClass: string; items: ScrapRecord[] }) {
  const { urlOf, openScrap } = useScraps();
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-on-surface flex items-center gap-1">
          <Icon name={icon} className={`text-[17px] ${iconClass}`} />
          {title}
        </h2>
        <span className="text-[11px] text-outline">{items.length}개</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 no-scrollbar">
        {items.map((s) => (
          <article
            key={s.id}
            className="w-36 flex-shrink-0 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer active:scale-95 transition-transform"
            onClick={() => openScrap(s.id)}
          >
            <div className="h-28 w-full overflow-hidden">
              <img className="w-full h-full object-cover object-top" src={urlOf(s.id)} alt="" />
            </div>
            <div className="p-2">
              <h3 className="text-[11px] font-bold text-on-surface line-clamp-2">{s.data?.title ?? '분석 중'}</h3>
              {s.data?.places[0] && <span className="text-[9px] text-outline truncate block mt-0.5">📍 {s.data.places[0].area ?? s.data.places[0].name}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CollectionsTab({ active }: { active: boolean }) {
  const { scraps } = useScraps();
  const done = scraps.filter((s) => s.data);
  const now = Date.now();
  const forgotten = done.filter((s) => now - (s.viewedAt ?? s.createdAt) > FORGOTTEN_DAYS * 86_400_000);

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="collections_bookmark" className="text-[15px]" />
          스마트 컬렉션
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">카테고리별 모아보기</h1>
        <p className="text-xs text-on-surface-variant">자동으로 분류한 스크랩을 주제별로 모았어요.</p>
      </div>

      {done.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-5 text-center text-[11px] text-outline shadow-sm">
          홈에서 캡처를 불러오면 여기에 주제별로 모여요.
        </div>
      ) : (
        <>
          <Row title="즐겨찾기" icon="favorite" iconClass="text-red-500" items={done.filter((s) => s.favorite)} />
          <Row title={`잊고 있던 스크랩`} icon="history" iconClass="text-tertiary" items={forgotten} />
          {CATEGORY_ORDER.map((c) => (
            <Row key={c} title={CATEGORY[c].label} icon={CATEGORY[c].icon} iconClass={CATEGORY[c].color} items={done.filter((s) => s.data!.category === c)} />
          ))}
        </>
      )}
    </div>
  );
}
