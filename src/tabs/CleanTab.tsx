import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { useStore } from '../store';

const RING = 238.7;

type CardDef = {
  key: string;
  icon: string;
  iconClass: string;
  title: string;
  sub: string;
  badge: string;
  badgeClass: string;
  thumbBorder: string;
  ids: string[];
  bestId?: string;
  action: string;
  actionClass: string;
  reviewDesc: string;
};

export function CleanTab({ active }: { active: boolean }) {
  const { photos, byId, analysis, marked, favorites, progress, mark, unmark, clearMarked, showToast, openReview, openViewer, addPhotos } = useStore();

  const live = (ids: string[]) => ids.filter((id) => !marked.has(id) && !favorites.has(id));
  const pending = [...analysis.candidates].filter((id) => !marked.has(id));
  const analyzed = photos.filter((p) => p.f).length;
  const ratio = analyzed ? analysis.candidates.size / analyzed : 0;
  const pendingRatio = analyzed ? pending.length / analyzed : 0;

  const cards: CardDef[] = [];
  analysis.groups.forEach((g, i) => {
    const rest = live(g.ids.filter((id) => id !== g.best));
    if (rest.length === 0) return;
    cards.push({
      key: 'g' + g.best,
      icon: 'burst_mode',
      iconClass: 'bg-primary/10 text-primary',
      title: `비슷한 사진 묶음 ${i + 1}`,
      sub: `${g.ids.length}장 중 ${rest.length}장 정리 가능`,
      badge: '유사',
      badgeClass: 'bg-surface-container text-on-surface-variant',
      thumbBorder: '',
      ids: [g.best, ...rest],
      bestId: g.best,
      action: '베스트 1장만 보존',
      actionClass: 'bg-primary text-white',
      reviewDesc: '가장 선명한 사진을 베스트로 골랐어요. 지울 사진을 확인해 주세요.',
    });
  });
  const shots = live(analysis.screenshots);
  if (shots.length)
    cards.push({
      key: 'shots', icon: 'screenshot', iconClass: 'bg-tertiary/10 text-tertiary',
      title: '스크린샷 및 웹 캡처', sub: `캡처로 보이는 사진 ${shots.length}장`,
      badge: '캡처', badgeClass: 'bg-surface-container text-outline', thumbBorder: 'border border-surface-container',
      ids: shots, action: '캡처 정리하기', actionClass: 'bg-surface-container-highest text-error',
      reviewDesc: '필요 없는 캡처를 골라주세요. 확인 후 삭제 목록에 담아요.',
    });
  const blurry = live(analysis.blurry);
  if (blurry.length)
    cards.push({
      key: 'blur', icon: 'blur_on', iconClass: 'bg-error-container text-error',
      title: '초점 이탈 및 흔들린 사진', sub: `흐릿한 사진 ${blurry.length}장`,
      badge: '품질 불량', badgeClass: 'bg-error-container text-error', thumbBorder: 'border border-error/20',
      ids: blurry, action: '흔들린 사진 정리', actionClass: 'bg-surface-container-highest text-error',
      reviewDesc: '초점이 맞지 않은 사진이에요. 지울 사진을 확인해 주세요.',
    });
  const dark = live(analysis.dark);
  if (dark.length)
    cards.push({
      key: 'dark', icon: 'dark_mode', iconClass: 'bg-secondary-container/30 text-secondary',
      title: '너무 어둡게 찍힌 사진', sub: `알아보기 힘든 사진 ${dark.length}장`,
      badge: '노출 부족', badgeClass: 'bg-secondary-container text-secondary', thumbBorder: 'border border-surface-container',
      ids: dark, action: '어두운 사진 정리', actionClass: 'bg-surface-container text-on-surface',
      reviewDesc: '주머니 속이나 실수로 찍힌 사진일 수 있어요.',
    });

  const allPending = cards.flatMap((c) => (c.bestId ? c.ids.filter((id) => id !== c.bestId) : c.ids));
  const markedList = [...marked].filter((id) => byId.has(id));

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 ${allPending.length ? 'pb-36' : 'pb-24'} relative`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="auto_awesome" className="text-[15px]" />
          갤러리 공해 해결
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">스마트 클리너</h1>
        <p className="text-xs text-on-surface-variant">품질이 낮거나 불필요한 중복 사진을 골라냈어요.</p>
      </div>

      {photos.length === 0 ? (
        <EmptyState title="정리할 사진을 골라주세요" desc="불러온 사진 중에서 흔들린 사진, 연사, 캡처를 찾아드려요." />
      ) : (
        <>
          <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex items-center gap-3">
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#f0edf2" strokeWidth="11" />
                <circle
                  cx="50" cy="50" fill="transparent" r="38" stroke="#4143d4"
                  strokeDasharray={RING} strokeDashoffset={RING * (1 - pendingRatio)}
                  strokeLinecap="round" strokeWidth="11"
                  style={{ transition: 'stroke-dashoffset 0.5s' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-base font-bold text-on-surface leading-none">{pending.length}</span>
                <span className="text-[9px] text-outline mt-0.5">장 후보</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[11px] text-primary font-bold">정리 권장 비율 {Math.round(ratio * 100)}%</span>
              <h3 className="text-xs font-bold text-on-surface leading-tight">
                {analyzed}장 중 {analysis.candidates.size}장 감지
              </h3>
              <p className="text-[10px] text-outline leading-tight mt-0.5">
                {progress ? `분석 중이에요 (${progress.done}/${progress.total})` : '즐겨찾기한 사진은 후보에서 제외돼요.'}
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-3">
            {cards.length === 0 && !progress && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 text-center text-[11px] text-outline shadow-sm">
                <Icon name="verified" className="text-secondary text-[22px]" />
                <p className="mt-1">추천할 정리 항목이 없어요.</p>
              </div>
            )}
            {cards.map((c) => {
              const thumbs = c.ids.slice(0, 3);
              const more = c.ids.length - thumbs.length;
              const toMark = c.bestId ? c.ids.filter((id) => id !== c.bestId) : c.ids;
              return (
                <article key={c.key} className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-black/[0.02] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${c.iconClass}`}>
                        <Icon name={c.icon} className="text-[15px]" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{c.title}</h4>
                        <span className="text-[10px] text-outline">{c.sub}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${c.badgeClass}`}>{c.badge}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {thumbs.map((id) => (
                      <div
                        key={id}
                        className={`relative rounded-lg overflow-hidden aspect-square ${
                          c.bestId === id ? 'border-2 border-primary' : c.bestId ? 'opacity-60' : c.thumbBorder
                        }`}
                        onClick={() => openViewer(id)}
                      >
                        <img className="w-full h-full object-cover" src={byId.get(id)?.src} alt="" />
                        {c.bestId === id && <span className="absolute bottom-0.5 left-0.5 bg-primary text-white text-[7px] font-bold px-1 rounded">베스트</span>}
                      </div>
                    ))}
                    {more > 0 && (
                      <div className="rounded-lg bg-surface-container flex items-center justify-center text-[11px] font-bold text-outline aspect-square">+{more}장</div>
                    )}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-0.5">
                    <button
                      className="px-2 py-1 rounded text-outline text-[11px] hover:bg-surface-container"
                      onClick={() => openReview({ title: c.title, desc: c.reviewDesc, ids: c.ids, preselected: toMark, bestId: c.bestId })}
                    >
                      {c.bestId ? '비교하기' : '하나씩 보기'}
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold active:scale-95 transition-transform ${c.actionClass}`}
                      onClick={() => {
                        mark(toMark);
                        showToast(`${toMark.length}장을 삭제 목록에 담았어요.`, 'check_circle');
                      }}
                    >
                      {c.action}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            className="w-full py-2 rounded-xl border border-dashed border-outline-variant text-[11px] font-semibold text-primary flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-60"
            onClick={addPhotos}
            disabled={!!progress}
          >
            <Icon name="add_photo_alternate" className="text-[15px]" />
            사진 더 불러오기
          </button>

          {/* 삭제 목록 */}
          <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="delete" className="text-error text-[16px]" />
                <h3 className="text-xs font-bold text-on-surface">삭제 목록 {markedList.length}장</h3>
              </div>
              {markedList.length > 0 && (
                <button
                  className="text-[10px] text-outline px-2 py-0.5 rounded-full bg-surface-container active:scale-95"
                  onClick={() => {
                    clearMarked();
                    showToast('삭제 목록을 비웠어요.', 'undo');
                  }}
                >
                  목록 비우기
                </button>
              )}
            </div>
            {markedList.length === 0 ? (
              <p className="text-[11px] text-outline">정리할 사진을 담으면 여기에 모아 보여드려요.</p>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-1">
                  {markedList.map((id) => (
                    <button
                      key={id}
                      className="relative rounded-md overflow-hidden aspect-square active:scale-90 transition-transform"
                      onClick={() => {
                        unmark([id]);
                        showToast('삭제 목록에서 뺐어요.', 'undo');
                      }}
                    >
                      <img className="w-full h-full object-cover" src={byId.get(id)?.src} alt="" />
                      <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/50 text-white flex items-center justify-center">
                        <Icon name="close" className="text-[10px]" />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 p-2.5 bg-surface-container rounded-xl text-[10px] text-on-surface-variant leading-snug">
                  <Icon name="info" className="text-primary text-[15px] flex-shrink-0" />
                  <span>
                    토스 미니앱은 보안상 갤러리 사진을 직접 지울 수 없어요. 위 사진들을 기억해 두었다가 <b>기기의 사진 앱</b>에서 삭제해
                    주세요. 사진을 누르면 목록에서 빠져요.
                  </span>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {active && allPending.length > 0 && (
        <div className="fixed bottom-floating inset-x-0 px-3 z-30 pointer-events-none">
          <button
            className="pointer-events-auto w-full h-11 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => {
              mark(allPending);
              showToast(`추천 항목 ${allPending.length}장을 삭제 목록에 담았어요.`, 'verified');
            }}
          >
            <Icon name="auto_awesome_motion" className="text-[16px]" />
            <span>추천 항목 한 번에 담기 ({allPending.length}장)</span>
          </button>
        </div>
      )}
    </div>
  );
}
