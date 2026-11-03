import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ScrapCard } from '../components/ScrapCard';
import { CATEGORY, CATEGORY_ORDER, searchScraps, type Category } from '../lib/scrap';
import { useScraps } from '../scrapStore';
import { useStore } from '../store';

const EXAMPLES = ['지난달 성수동 카페', '이번주 레시피', '쇼핑 원피스'];

export function HomeTab({ active }: { active: boolean }) {
  const { scraps, loaded, adding, addScraps } = useScraps();
  const { switchTab } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');

  const counts = useMemo(() => {
    const c = new Map<Category, number>();
    for (const s of scraps) if (s.data) c.set(s.data.category, (c.get(s.data.category) ?? 0) + 1);
    return c;
  }, [scraps]);
  const results = useMemo(() => searchScraps(scraps, q, cat), [scraps, q, cat]);
  const pending = scraps.filter((s) => s.status === 'pending').length;

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-3 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center justify-between text-[11px] text-outline font-medium">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-primary ${pending ? 'animate-pulse' : ''}`} />
            스크랩 보관함
          </span>
          <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px]">
            {pending ? `${pending}장 분석 중` : `${scraps.length}개 저장됨`}
          </span>
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-1">내 스크랩북</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">캡처해 둔 맛집·레시피·쇼핑 정보를 찾아드려요.</p>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-surface-container-lowest shadow-sm border border-black/[0.03]">
        <Icon name="search" className="text-outline text-[19px]" />
        <input
          className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[13px] text-on-surface placeholder:text-outline focus:ring-0 select-text"
          placeholder="예) 지난달 성수동 카페"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          enterKeyHint="search"
        />
        {q && (
          <button className="text-outline" onClick={() => setQ('')} aria-label="검색어 지우기">
            <Icon name="cancel" className="text-[18px]" />
          </button>
        )}
      </div>

      {/* 카테고리 칩 */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5">
        {(['all', ...CATEGORY_ORDER] as const).map((c) => {
          const on = cat === c;
          const n = c === 'all' ? scraps.length : (counts.get(c) ?? 0);
          if (c !== 'all' && n === 0 && !on) return null;
          return (
            <button
              key={c}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                on ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
              }`}
              onClick={() => setCat(c)}
            >
              {c !== 'all' && <Icon name={CATEGORY[c].icon} className="text-[14px]" />}
              {c === 'all' ? '전체' : CATEGORY[c].label}
              <span className={on ? 'text-white/70' : 'text-outline'}>{n}</span>
            </button>
          );
        })}
      </div>

      {loaded && scraps.length === 0 ? (
        <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-black/[0.03] flex flex-col items-center text-center gap-2">
          <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="bookmark_add" className="text-[26px]" />
          </span>
          <h3 className="text-sm font-bold text-on-surface mt-1">캡처를 스크랩해 보세요</h3>
          <p className="text-[11px] text-outline leading-snug">
            인스타·블로그에서 캡처한 맛집, 레시피, 쇼핑 정보를 고르면
            <br />
            글자를 읽고 자동으로 분류해 드려요.
          </p>
          <button
            className="mt-2 w-full h-10 bg-primary text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
            onClick={addScraps}
            disabled={adding}
          >
            <Icon name="add_photo_alternate" className="text-[16px]" />
            캡처 불러오기
          </button>
        </section>
      ) : results.length === 0 && loaded ? (
        <div className="py-8 text-center flex flex-col items-center gap-2">
          <Icon name="search_off" className="text-outline text-[28px]" />
          <p className="text-[11px] text-outline">찾는 스크랩이 없어요.</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {EXAMPLES.map((e) => (
              <button key={e} className="text-[10px] bg-surface-container px-2 py-1 rounded-full" onClick={() => setQ(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="columns-2 gap-2">
          {results.map((s) => (
            <ScrapCard key={s.id} s={s} />
          ))}
        </div>
      )}

      {scraps.length > 0 && (
        <button
          className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant text-[11px] font-semibold text-primary flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-60"
          onClick={addScraps}
          disabled={adding}
        >
          <Icon name="add_photo_alternate" className="text-[15px]" />
          캡처 더 불러오기
        </button>
      )}

      {/* 갤러리 정리 바로가기 */}
      <button
        className="flex items-center gap-2.5 p-3 bg-surface-container-lowest rounded-2xl shadow-sm border border-black/[0.02] text-left active:scale-[0.98] transition-transform"
        onClick={() => switchTab('clean')}
      >
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon name="auto_fix_high" className="text-[20px]" />
        </span>
        <span className="flex-1">
          <span className="block text-xs font-bold text-on-surface">갤러리 공해 정리하기</span>
          <span className="block text-[10px] text-outline">흔들린 사진·중복 연사·스크린샷을 골라드려요</span>
        </span>
        <Icon name="chevron_right" className="text-outline text-[18px]" />
      </button>

      <div className="flex items-center gap-2 p-2.5 bg-surface-container rounded-xl text-[10px] text-outline">
        <Icon name="lock" className="text-primary text-[16px] flex-shrink-0" />
        <span className="flex-1 leading-tight">스크랩은 이 기기에만 저장돼요. 분석할 때만 캡처 이미지를 서버로 보내고, 서버에는 저장하지 않아요.</span>
      </div>
    </div>
  );
}
