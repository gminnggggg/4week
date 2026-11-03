import { useState } from 'react';
import { Icon } from '../components/Icon';
import { fadeStyle } from '../components/Removable';
import { IMG } from '../images';
import { formatGB, useApp } from '../state';

type CardState = 'shown' | 'fading' | 'gone';
type ClusterId = 'c1' | 'c2' | 'c3' | 'c4';

const RING = 238.7;

export function CleanTab({ active }: { active: boolean }) {
  const { cleanableGB, setCleanableGB, showToast } = useApp();
  const [cards, setCards] = useState<Record<ClusterId, CardState>>({ c1: 'shown', c2: 'shown', c3: 'shown', c4: 'shown' });
  const [allState, setAllState] = useState<'idle' | 'running' | 'done'>('idle');

  const setCard = (id: ClusterId, s: CardState) => setCards((prev) => ({ ...prev, [id]: s }));

  const dismissCluster = (id: ClusterId, msg: string) => {
    if (cards[id] !== 'shown') return;
    setCard(id, 'fading');
    setTimeout(() => {
      setCard(id, 'gone');
      showToast(msg, 'check_circle');
    }, 200);
  };

  const runSmartCleanAll = () => {
    if (allState !== 'idle') return;
    setAllState('running');
    setTimeout(() => {
      setCards((prev) => {
        const next = { ...prev };
        (Object.keys(next) as ClusterId[]).forEach((k) => next[k] !== 'gone' && (next[k] = 'fading'));
        return next;
      });
      setTimeout(() => setCards({ c1: 'gone', c2: 'gone', c3: 'gone', c4: 'gone' }), 150);
      setCleanableGB(0);
      setAllState('done');
      showToast('추천 정리 항목이 모두 성공적으로 정리되었습니다.', 'verified');
    }, 700);
  };

  const cardClass = 'bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-black/[0.02] flex flex-col transition-all duration-300';

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-36 relative`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="auto_awesome" className="text-[15px]" />
          인공지능 딥스캔 분석
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">스마트 클리너</h1>
        <p className="text-xs text-on-surface-variant">품질이 낮거나 불필요한 중복 사진을 골라냈어요.</p>
      </div>

      {/* 링 차트 리포트 */}
      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex items-center gap-3">
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="38" stroke="#f0edf2" strokeWidth="11" />
            <circle
              cx="50" cy="50" fill="transparent" r="38" stroke="#4143d4"
              strokeDasharray={RING} strokeDashoffset={cleanableGB > 0 ? 62 : RING}
              strokeLinecap="round" strokeWidth="11"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-base font-bold text-on-surface leading-none">{formatGB(cleanableGB)}</span>
            <span className="text-[9px] text-outline mt-0.5">GB 절약</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[11px] text-primary font-bold">정리 권장 지수 94%</span>
          <h3 className="text-xs font-bold text-on-surface leading-tight">불필요 파일 128장 감지</h3>
          <p className="text-[10px] text-outline leading-tight mt-0.5">최적화 시 고화질 사진 약 1,200장을 더 보관할 수 있어요.</p>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {/* 1. 연사 클러스터 */}
        <article className={`${cardClass} gap-2`} style={fadeStyle(cards.c1, 0.95)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="burst_mode" className="text-[15px]" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-on-surface">유사 연사 사진 클러스터</h4>
                <span className="text-[10px] text-outline">8장 중 7장 절약 가능 · 4.4 MB</span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">유사율 98%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="relative rounded-lg overflow-hidden aspect-square border-2 border-primary">
              <img className="w-full h-full object-cover" src={IMG.brunch} alt="" />
              <span className="absolute bottom-0.5 left-0.5 bg-primary text-white text-[7px] font-bold px-1 rounded">베스트</span>
            </div>
            <div className="rounded-lg overflow-hidden aspect-square opacity-60">
              <img className="w-full h-full object-cover" src={IMG.cafe} alt="" />
            </div>
            <div className="rounded-lg overflow-hidden aspect-square opacity-60">
              <img className="w-full h-full object-cover" src={IMG.portrait} alt="" />
            </div>
            <div className="rounded-lg bg-surface-container flex items-center justify-center text-[11px] font-bold text-outline">+5장</div>
          </div>
          <div className="flex justify-end gap-1.5 pt-0.5">
            <button className="px-2 py-1 rounded text-outline text-[11px] hover:bg-surface-container" onClick={() => showToast('연사 원본 8장을 나란히 비교합니다.', 'compare')}>
              비교하기
            </button>
            <button
              className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold active:scale-95 transition-transform"
              onClick={() => dismissCluster('c1', '유사 사진 7장을 정리하고 베스트 1장을 남겼습니다')}
            >
              베스트 1장만 보존
            </button>
          </div>
        </article>

        {/* 2. 스크린샷 */}
        <article className={`${cardClass} gap-2`} style={fadeStyle(cards.c2, 0.95)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                <Icon name="screenshot" className="text-[15px]" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-on-surface">스크린샷 및 웹 캡처</h4>
                <span className="text-[10px] text-outline">오래된 캡처 42장 · 1.2 GB</span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-outline font-medium">30일 경과</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[IMG.screenshot, IMG.night, IMG.cafe].map((src, i) => (
              <div key={i} className="rounded-lg overflow-hidden aspect-square border border-surface-container">
                <img className="w-full h-full object-cover" src={src} alt="" />
              </div>
            ))}
            <div className="rounded-lg bg-surface-container flex items-center justify-center text-[11px] font-bold text-outline">+39장</div>
          </div>
          <div className="flex justify-end pt-0.5">
            <button
              className="px-2.5 py-1 rounded-lg bg-surface-container-highest text-error text-[11px] font-bold active:scale-95 transition-transform"
              onClick={() => dismissCluster('c2', '만료된 캡처 42장을 휴지통으로 이동했습니다')}
            >
              오래된 캡처 일괄 삭제
            </button>
          </div>
        </article>

        {/* 3. 흔들린 사진 */}
        <article className={`${cardClass} gap-2`} style={fadeStyle(cards.c3, 0.95)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-error-container text-error flex items-center justify-center">
                <Icon name="blur_on" className="text-[15px]" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-on-surface">초점 이탈 및 흔들린 사진</h4>
                <span className="text-[10px] text-outline">저화질 컷 14장 · 480 MB</span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-error-container text-error font-medium">품질 불량</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[IMG.night, IMG.jeju, IMG.brunch].map((src, i) => (
              <div key={i} className="rounded-lg overflow-hidden aspect-square border border-error/20">
                <img className="w-full h-full object-cover" src={src} alt="" />
              </div>
            ))}
            <div className="rounded-lg bg-surface-container flex items-center justify-center text-[11px] font-bold text-outline">+11장</div>
          </div>
          <div className="flex justify-end pt-0.5">
            <button
              className="px-2.5 py-1 rounded-lg bg-surface-container-highest text-error text-[11px] font-bold active:scale-95 transition-transform"
              onClick={() => dismissCluster('c3', '흔들린 사진 14장을 정리했습니다')}
            >
              흔들린 사진 삭제
            </button>
          </div>
        </article>

        {/* 4. 영수증 OCR */}
        <article className={`${cardClass} gap-1.5`} style={fadeStyle(cards.c4, 0.95)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center">
                <Icon name="receipt_long" className="text-[15px]" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-on-surface">영수증 텍스트 추출 완료</h4>
                <span className="text-[10px] text-outline">OCR 텍스트 저장됨 · 120 MB</span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary-container text-secondary font-medium">안전 아카이브</span>
          </div>
          <p className="text-[10px] text-outline">텍스트 추출이 끝난 영수증 사진을 압축 저장해 용량을 확보합니다.</p>
          <div className="flex justify-end pt-0.5">
            <button
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-bold active:scale-95 transition-transform"
              onClick={() => dismissCluster('c4', '영수증 사진을 압축 보관했습니다')}
            >
              저용량 압축 보관
            </button>
          </div>
        </article>
      </div>

      {/* 플로팅 CTA — 하단 탭바 바로 위에 고정 */}
      {active && (
        <div className="fixed bottom-floating inset-x-0 px-3 z-30 pointer-events-none">
          <button
            className={`pointer-events-auto w-full h-11 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
              allState === 'done' ? 'bg-secondary' : 'bg-primary'
            }`}
            onClick={runSmartCleanAll}
          >
            {allState === 'idle' && (
              <>
                <Icon name="auto_awesome_motion" className="text-[16px]" />
                <span>추천 항목 한 번에 정리하기 ({formatGB(cleanableGB)} GB)</span>
              </>
            )}
            {allState === 'running' && (
              <>
                <Icon name="refresh" className="text-[16px] animate-spin" />
                <span>정리 진행 중...</span>
              </>
            )}
            {allState === 'done' && (
              <>
                <Icon name="verified" className="text-[16px]" />
                <span>모든 추천 항목 정리 완료!</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
