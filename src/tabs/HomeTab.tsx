import { useState } from 'react';
import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { PhotoCard } from '../components/PhotoCard';
import { useStore } from '../store';

const FILTERS = ['전체', '정리 후보', '즐겨찾기'] as const;
const PAGE = 12;

export function HomeTab({ active }: { active: boolean }) {
  const { photos, analysis, progress, marked, favorites, addPhotos, switchTab, openReview, showToast } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');
  const [limit, setLimit] = useState(PAGE);

  const analyzed = photos.filter((p) => p.f).length;
  const pending = [...analysis.candidates].filter((id) => !marked.has(id));
  const keepPct = analyzed ? ((analyzed - analysis.candidates.size) / analyzed) * 100 : 100;
  const candPct = analyzed ? (pending.length / analyzed) * 100 : 0;

  const list = photos.filter((p) =>
    filter === '전체' ? true : filter === '정리 후보' ? analysis.candidates.has(p.id) : favorites.has(p.id),
  );

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center justify-between text-[11px] text-outline font-medium">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-primary ${progress ? 'animate-pulse' : ''}`} />
            라이브러리 보관함
          </span>
          <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px]">
            {progress ? '분석 중' : photos.length ? `${photos.length}장 분석됨` : '사진 없음'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-1">내 사진 보관함</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {photos.length === 0
            ? '정리하고 싶은 사진을 골라주시면 기기 안에서 바로 분석해 드려요.'
            : pending.length > 0
              ? `분석한 사진 중 ${pending.length}장이 정리 대기 중이에요.`
              : '지금은 정리할 사진이 없어요.'}
        </p>
      </div>

      {photos.length === 0 ? (
        <EmptyState title="아직 분석한 사진이 없어요" desc={'갤러리에서 사진을 한 번에 최대 50장까지 고를 수 있어요.\n흔들린 사진, 비슷한 연사, 스크린샷을 찾아드려요.'} />
      ) : (
        <>
          {/* 메인 카드 */}
          <section className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm border border-black/[0.03] flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-outline font-medium">정리 후보</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold text-on-surface tracking-tight">{pending.length}</span>
                  <span className="text-sm font-semibold text-on-surface">장</span>
                </div>
              </div>
              <span className="text-[11px] bg-surface-container text-on-surface font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                {progress ? (
                  <>
                    <Icon name="progress_activity" className="text-[14px] text-primary animate-spin" />
                    분석 중 {progress.done}/{progress.total}
                  </>
                ) : pending.length === 0 ? (
                  <>
                    <Icon name="verified" className="text-[14px] text-secondary" />
                    정리 완료
                  </>
                ) : (
                  <>
                    <Icon name="check_circle" className="text-[14px] text-primary" />
                    분석 완료
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden flex">
                <div className="bg-primary h-full transition-all duration-500 rounded-l-full" style={{ width: `${keepPct}%` }} />
                <div className="bg-primary-container h-full transition-all duration-500" style={{ width: `${candPct}%` }} />
                <div className="bg-surface-container-highest h-full flex-1 rounded-r-full" />
              </div>
              <div className="flex justify-between text-[11px] text-outline">
                <span>보관 {analyzed - analysis.candidates.size} · 담김 {marked.size}</span>
                <span>
                  유사 {analysis.similar.length} · 흐림 {analysis.blurry.length + analysis.dark.length} · 캡처 {analysis.screenshots.length}
                </span>
              </div>
            </div>
            <button
              className={`w-full h-10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm ${
                pending.length === 0 && !progress ? 'bg-secondary' : 'bg-primary'
              }`}
              onClick={() => {
                if (progress) return;
                if (pending.length === 0) {
                  showToast('정리할 사진이 없어요. 사진을 더 불러와 보세요.', 'check_circle');
                  return;
                }
                switchTab('clean');
              }}
            >
              <Icon name={pending.length === 0 && !progress ? 'verified' : 'auto_fix_high'} className="text-[16px]" />
              <span>{progress ? '분석하는 중이에요...' : pending.length === 0 ? '모두 정리했어요' : '정리 후보 확인하기'}</span>
            </button>
          </section>

          {/* 비슷한 사진 묶음 */}
          {analysis.groups.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-surface">비슷한 사진 묶음</h2>
                <button className="text-[11px] text-outline flex items-center gap-0.5 hover:text-on-surface" onClick={() => switchTab('moments')}>
                  모먼트 전체
                  <Icon name="chevron_right" className="text-[13px]" />
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 no-scrollbar">
                {analysis.groups.map((g, i) => {
                  const best = photos.find((p) => p.id === g.best);
                  const rest = g.ids.filter((id) => id !== g.best && !marked.has(id));
                  return (
                    <article
                      key={g.best}
                      className="w-48 flex-shrink-0 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer active:scale-95 transition-transform"
                      onClick={() =>
                        openReview({
                          title: `비슷한 사진 ${g.ids.length}장`,
                          desc: '가장 선명한 사진을 베스트로 골랐어요. 지울 사진을 확인해 주세요.',
                          ids: g.ids,
                          preselected: rest,
                          bestId: g.best,
                        })
                      }
                    >
                      <div className="relative h-28 w-full overflow-hidden">
                        <img className="w-full h-full object-cover" src={best?.src} alt="" />
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-[10px] font-bold text-primary px-1.5 py-0.5 rounded-full">
                          {rest.length ? `${rest.length}장 정리 가능` : '정리 완료'}
                        </span>
                        <span className="absolute bottom-2 right-2 bg-black/50 text-[9px] text-white px-1.5 py-0.5 rounded font-medium">{g.ids.length}장</span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-1">
                        <h3 className="text-xs font-bold text-on-surface truncate">비슷한 사진 묶음 {i + 1}</h3>
                        <span className="text-[10px] text-outline">베스트 1장만 남기기 추천</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* 사진 피드 */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">분석한 사진</h2>
                <span className="text-[10px] text-outline">품질 태그 자동 적용됨</span>
              </div>
              <button
                className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full font-medium active:scale-95"
                onClick={() => {
                  const next = FILTERS[(FILTERS.indexOf(filter) + 1) % FILTERS.length];
                  setFilter(next);
                  setLimit(PAGE);
                  showToast(`필터 전환: ${next}`, 'tune');
                }}
              >
                필터: {filter}
              </button>
            </div>
            {list.length === 0 ? (
              <p className="text-[11px] text-outline text-center py-6">
                {filter === '즐겨찾기' ? '♡를 눌러 지키고 싶은 사진을 모아보세요.' : '해당하는 사진이 없어요.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {list.slice(0, limit).map((p) => (
                  <PhotoCard key={p.id} p={p} />
                ))}
              </div>
            )}
            {list.length > limit && (
              <button className="w-full py-2 rounded-xl bg-surface-container text-[11px] font-semibold text-on-surface-variant active:scale-[0.98]" onClick={() => setLimit(limit + PAGE)}>
                더 보기 ({list.length - limit}장 남음)
              </button>
            )}
            <button
              className="w-full py-2 rounded-xl border border-dashed border-outline-variant text-[11px] font-semibold text-primary flex items-center justify-center gap-1 active:scale-[0.98]"
              onClick={addPhotos}
              disabled={!!progress}
            >
              <Icon name="add_photo_alternate" className="text-[15px]" />
              사진 더 불러오기
            </button>
          </section>
        </>
      )}

      <div className="flex items-center gap-2 p-2.5 bg-surface-container rounded-xl text-[11px] text-outline">
        <Icon name="lock" className="text-primary text-[16px] flex-shrink-0" />
        <span className="flex-1 leading-tight">사진은 기기 안에서만 분석되고 어디에도 전송되거나 저장되지 않아요.</span>
      </div>
    </div>
  );
}
