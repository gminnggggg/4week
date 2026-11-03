import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { useStore } from '../store';

export function MomentsTab({ active }: { active: boolean }) {
  const { photos, byId, analysis, favorites, marked, openViewer, openReview } = useStore();
  const highlights = analysis.bestShots.slice(0, 8);
  const favList = photos.filter((p) => favorites.has(p.id));

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="collections_bookmark" className="text-[15px]" />
          모먼트 스토리북
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">나의 빛나는 순간</h1>
        <p className="text-xs text-on-surface-variant">선명하고 잘 나온 사진만 골라 모았어요.</p>
      </div>

      {photos.length === 0 ? (
        <EmptyState title="베스트 컷을 찾아드릴게요" desc="사진을 불러오면 가장 선명하게 나온 사진을 골라 모아드려요." />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface">베스트 하이라이트</h2>
              <span className="text-[11px] text-primary font-semibold">선명도 순</span>
            </div>
            {highlights.length === 0 ? (
              <p className="text-[11px] text-outline py-3">아직 베스트로 꼽을 만큼 선명한 사진이 없어요.</p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 no-scrollbar">
                {highlights.map((id, i) => (
                  <div
                    key={id}
                    className="w-52 h-32 flex-shrink-0 rounded-2xl overflow-hidden relative shadow-md cursor-pointer active:scale-95 transition-transform"
                    onClick={() => openViewer(id)}
                  >
                    <img className="w-full h-full object-cover" src={byId.get(id)?.src} alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2.5 text-white">
                      <span className="text-[9px] text-white/80 flex items-center gap-0.5 mb-0.5">
                        <Icon name="star" className="text-[12px]" /> 베스트 #{i + 1}
                      </span>
                      <span className="text-xs font-bold leading-tight">{favorites.has(id) ? '즐겨찾기한 순간' : '선명하게 담긴 순간'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">즐겨찾기</h3>
              <span className="text-[11px] text-outline">{favList.length}장의 모먼트</span>
            </div>
            {favList.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl text-[11px] text-outline">
                <Icon name="favorite_border" className="text-primary text-[16px]" />
                홈 피드에서 ♡를 누르면 여기에 모이고, 정리 후보에서도 빠져요.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {favList.map((p) => (
                  <div
                    key={p.id}
                    className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm cursor-pointer active:scale-95 transition-all"
                    onClick={() => openViewer(p.id)}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img className="w-full h-full object-cover" src={p.src} alt="" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {analysis.groups.length > 0 && (
            <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-black/[0.02] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Icon name="burst_mode" className="text-primary text-[16px]" />
                  <h3 className="text-xs font-bold text-on-surface">비슷한 장면 모음</h3>
                </div>
                <span className="text-[10px] text-outline">총 {analysis.groups.length}개 묶음</span>
              </div>
              <div className="flex flex-col gap-2">
                {analysis.groups.map((g, i) => (
                  <button
                    key={g.best}
                    className="flex items-center gap-2 text-left active:scale-[0.98] transition-transform"
                    onClick={() =>
                      openReview({
                        title: `비슷한 장면 ${i + 1}`,
                        desc: '남길 사진은 그대로 두고 지울 사진만 체크해 주세요.',
                        ids: g.ids,
                        preselected: g.ids.filter((id) => id !== g.best && !marked.has(id) && !favorites.has(id)),
                        bestId: g.best,
                      })
                    }
                  >
                    <div className="flex -space-x-3">
                      {g.ids.slice(0, 4).map((id) => (
                        <img key={id} className="w-9 h-9 rounded-full object-cover ring-2 ring-surface-container-lowest" src={byId.get(id)?.src} alt="" />
                      ))}
                    </div>
                    <span className="flex-1 text-[11px] font-medium text-on-surface">장면 {i + 1} · {g.ids.length}장</span>
                    <Icon name="chevron_right" className="text-outline text-[16px]" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
