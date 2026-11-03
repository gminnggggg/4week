import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { CATEGORY, LINKS, errorText, placeQuery } from '../lib/scrap';
import { copyText, openLink, shareText } from '../lib/device';
import { useScraps } from '../scrapStore';

function LinkButton({ label, icon, url, primary }: { label: string; icon: string; url: string; primary?: boolean }) {
  return (
    <button
      className={`flex-1 min-w-0 h-9 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform ${
        primary ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
      }`}
      onClick={() => openLink(url)}
    >
      <Icon name={icon} className="text-[14px]" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ScrapDetail({ id, onClose, showToast }: { id: string | null; onClose: () => void; showToast: (m: string, i?: string) => void }) {
  const { scraps, urlOf, toggleFavorite, retry, remove, markViewed } = useScraps();
  const [showText, setShowText] = useState(false);
  const [zoom, setZoom] = useState(false);
  const s = scraps.find((x) => x.id === id);

  useEffect(() => {
    if (id) {
      markViewed(id);
      setShowText(false);
      setZoom(false);
    }
    // markViewed는 열 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!s) return null;
  const d = s.data;
  const cat = d ? CATEGORY[d.category] : null;

  return (
    <div className="fixed inset-0 z-[65] bg-surface flex flex-col">
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-2 border-b border-surface-container-high/60">
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-surface-container" onClick={onClose} aria-label="닫기">
          <Icon name="arrow_back" className="text-[22px]" />
        </button>
        <span className="text-xs font-bold text-on-surface truncate px-2">{d?.title ?? '스크랩'}</span>
        <div className="flex">
          <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-surface-container" onClick={() => toggleFavorite(s.id)} aria-label="즐겨찾기">
            <Icon name={s.favorite ? 'favorite' : 'favorite_border'} className={`text-[20px] ${s.favorite ? 'text-red-500' : ''}`} />
          </button>
          {d && (
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-surface-container"
              onClick={() => shareText(`[온미디어 스크랩] ${d.title}\n${d.summary}${d.places[0] ? `\n📍 ${LINKS.naverMap(placeQuery(d.places[0]))}` : ''}`)}
              aria-label="공유"
            >
              <Icon name="ios_share" className="text-[20px]" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
        <div className={`bg-black/90 flex justify-center ${zoom ? '' : 'max-h-[45dvh] overflow-hidden'}`} onClick={() => setZoom(!zoom)}>
          <img className={`${zoom ? 'w-full' : 'max-h-[45dvh] object-contain'}`} src={urlOf(s.id)} alt="" />
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          {s.status !== 'done' || !d ? (
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm text-center flex flex-col items-center gap-2">
              {s.status === 'pending' ? (
                <>
                  <Icon name="progress_activity" className="text-primary text-[24px] animate-spin" />
                  <p className="text-[11px] text-outline">글자를 읽고 분류하는 중이에요...</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-error">{errorText(s.error)}</p>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold" onClick={() => retry(s.id)}>
                    다시 분석
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div>
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cat!.bg} ${cat!.color}`}>
                  <Icon name={cat!.icon} className="text-[12px]" />
                  {cat!.label}
                </span>
                <h2 className="text-base font-bold text-on-surface mt-1.5 leading-snug">{d.title}</h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{d.summary}</p>
                <p className="text-[10px] text-outline mt-1">{new Date(s.createdAt).toLocaleDateString('ko-KR')} 저장</p>
              </div>

              {d.places.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex flex-col gap-2.5">
                  <h3 className="text-xs font-bold flex items-center gap-1">
                    <Icon name="location_on" className="text-primary text-[16px]" />
                    장소
                  </h3>
                  {d.places.map((p, i) => (
                    <div key={i} className={`flex flex-col gap-1.5 ${i > 0 ? 'border-t border-surface-container pt-2' : ''}`}>
                      <div>
                        <span className="text-xs font-bold text-on-surface">{p.name}</span>
                        {(p.address || p.area) && <span className="text-[10px] text-outline ml-1.5">{p.address ?? p.area}</span>}
                      </div>
                      <div className="flex gap-1.5">
                        <LinkButton label="네이버 지도" icon="map" url={LINKS.naverMap(placeQuery(p))} primary />
                        <LinkButton label="카카오맵" icon="near_me" url={LINKS.kakaoMap(placeQuery(p))} />
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {d.products.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex flex-col gap-2.5">
                  <h3 className="text-xs font-bold flex items-center gap-1">
                    <Icon name="shopping_bag" className="text-primary text-[16px]" />
                    상품
                  </h3>
                  {d.products.map((p, i) => {
                    const q = [p.brand, p.name].filter(Boolean).join(' ');
                    return (
                      <div key={i} className={`flex flex-col gap-1.5 ${i > 0 ? 'border-t border-surface-container pt-2' : ''}`}>
                        <div className="flex justify-between gap-2">
                          <span className="text-xs font-bold text-on-surface">{q}</span>
                          {p.price && <span className="text-[11px] text-outline flex-shrink-0">{p.price}</span>}
                        </div>
                        <div className="flex gap-1.5">
                          <LinkButton label="쿠팡에서 찾기" icon="search" url={LINKS.coupang(q)} primary />
                          <LinkButton label="네이버쇼핑" icon="sell" url={LINKS.naverShopping(q)} />
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {d.ingredients.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex flex-col gap-2">
                  <h3 className="text-xs font-bold flex items-center gap-1">
                    <Icon name="shopping_basket" className="text-secondary text-[16px]" />
                    장보기 재료
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {d.ingredients.map((g) => (
                      <button
                        key={g}
                        className="text-[11px] bg-surface-container px-2 py-1 rounded-full text-on-surface active:scale-95"
                        onClick={() => openLink(LINKS.kurly(g))}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <LinkButton label="컬리에서 장보기" icon="shopping_cart" url={LINKS.kurly(d.ingredients[0])} primary />
                    <LinkButton label="쿠팡에서 찾기" icon="search" url={LINKS.coupang(d.ingredients[0])} />
                  </div>
                  {d.category === 'recipe' && (
                    <div className="flex">
                      <LinkButton label="요리 영상 찾아보기" icon="smart_display" url={LINKS.youtube(`${d.title} 레시피`)} />
                    </div>
                  )}
                </section>
              )}

              {d.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {d.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {d.text && (
                <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-1">
                      <Icon name="text_fields" className="text-primary text-[16px]" />
                      추출한 텍스트
                    </h3>
                    <div className="flex gap-1">
                      <button
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container active:scale-95"
                        onClick={async () => showToast((await copyText(d.text)) ? '텍스트를 복사했어요.' : '복사하지 못했어요.', 'content_copy')}
                      >
                        복사
                      </button>
                      <button className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container active:scale-95" onClick={() => setShowText(!showText)}>
                        {showText ? '접기' : '펼치기'}
                      </button>
                    </div>
                  </div>
                  <p className={`text-[11px] text-on-surface-variant whitespace-pre-wrap leading-relaxed select-text ${showText ? '' : 'line-clamp-4'}`}>{d.text}</p>
                </section>
              )}
            </>
          )}

          <button
            className="mt-2 mb-4 w-full py-2.5 rounded-xl bg-surface-container text-error text-[11px] font-bold flex items-center justify-center gap-1 active:scale-[0.98]"
            onClick={() => {
              remove(s.id);
              onClose();
              showToast('스크랩을 삭제했어요. 갤러리 원본은 그대로예요.', 'delete');
            }}
          >
            <Icon name="delete" className="text-[15px]" />
            스크랩 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
