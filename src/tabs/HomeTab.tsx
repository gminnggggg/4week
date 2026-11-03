import { useState } from 'react';
import { Icon } from '../components/Icon';
import { fadeStyle, useRemovable } from '../components/Removable';
import { IMG } from '../images';
import { formatGB, useApp } from '../state';

function HeartButton() {
  const { showToast } = useApp();
  const [on, setOn] = useState(false);
  return (
    <button
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center active:scale-75 transition-transform"
      onClick={() => {
        setOn(!on);
        if (on) showToast('즐겨찾기에서 제외되었습니다.', 'favorite_border');
        else showToast('즐겨찾기에 추가되었습니다!', 'favorite');
      }}
    >
      <Icon name={on ? 'favorite' : 'favorite_border'} className={`text-[14px] ${on ? 'text-red-500' : ''}`} />
    </button>
  );
}

const COLLECTIONS = [
  { img: IMG.cafe, badge: '스토리 완성', badgeColor: 'text-primary', count: '18장', time: '오늘 14:40', place: '성수동', title: '성수동 카페 투어', tags: ['#미니멀', '#카페감성'] },
  { img: IMG.camping, badge: '골든아워', badgeColor: 'text-tertiary', count: '12장', time: '어제 19:15', place: '강원 인제', title: '주말 캠핑 베스트샷', tags: ['#나들이', '#불멍'] },
];

export function HomeTab({ active }: { active: boolean }) {
  const { cleanableGB, setCleanableGB, showToast, switchTab } = useApp();
  const [cleanState, setCleanState] = useState<'idle' | 'running' | 'done'>('idle');
  const blurry = useRemovable(250);

  const runHomeClean = () => {
    if (cleanableGB <= 0) {
      showToast('이미 모든 저장공간이 최적화되었습니다.', 'check_circle');
      return;
    }
    setCleanState('running');
    setTimeout(() => {
      setCleanableGB(0);
      setCleanState('done');
      showToast('성공적으로 6.2 GB 여유 공간을 확보했습니다!', 'task_alt');
    }, 700);
  };

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      {/* 헤더 요약 문구 */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-outline font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            라이브러리 보관함
          </span>
          <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px]">최신 동기화됨</span>
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-1">지우님의 사진 보관함</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">최근 촬영한 128장의 사진이 정리 대기 중이에요.</p>
      </div>

      {/* 메인 스토리지 카드 */}
      <section className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm border border-black/[0.03] flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] text-outline font-medium">정리 가능한 공간</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-on-surface tracking-tight">{formatGB(cleanableGB)}</span>
              <span className="text-sm font-semibold text-on-surface">GB</span>
            </div>
          </div>
          <span className="text-[11px] bg-surface-container text-on-surface font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            {cleanState === 'done' ? (
              <>
                <Icon name="verified" className="text-[14px] text-secondary" />
                최적화 완료
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
            <div className="bg-primary h-full transition-all duration-500 rounded-l-full" style={{ width: '81.8%' }} />
            <div className="bg-primary-container h-full transition-all duration-500" style={{ width: cleanableGB > 0 ? '4.8%' : '0%' }} />
            <div className="bg-surface-container-highest h-full flex-1 rounded-r-full" />
          </div>
          <div className="flex justify-between text-[11px] text-outline">
            <span>104.8 GB / 128 GB</span>
            <span>유사 컷 86 · 캡처 42</span>
          </div>
        </div>
        <button
          className={`w-full h-10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm ${
            cleanState === 'done' ? 'bg-secondary' : 'bg-primary'
          }`}
          onClick={runHomeClean}
        >
          {cleanState === 'idle' && (
            <>
              <Icon name="auto_fix_high" className="text-[16px]" />
              <span>저장공간 정리하기</span>
            </>
          )}
          {cleanState === 'running' && (
            <>
              <Icon name="refresh" className="text-[15px] animate-spin" />
              <span>정리 진행 중...</span>
            </>
          )}
          {cleanState === 'done' && (
            <>
              <Icon name="verified" className="text-[15px]" />
              <span>6.2 GB 정리 완료됨</span>
            </>
          )}
        </button>
      </section>

      {/* 추천 컬렉션 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">추천 컬렉션</h2>
          <button className="text-[11px] text-outline flex items-center gap-0.5 hover:text-on-surface" onClick={() => switchTab('moments')}>
            모먼트 전체
            <Icon name="chevron_right" className="text-[13px]" />
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 no-scrollbar">
          {COLLECTIONS.map((c) => (
            <article
              key={c.title}
              className="w-48 flex-shrink-0 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col group cursor-pointer active:scale-95 transition-transform"
              onClick={() => switchTab('moments')}
            >
              <div className="relative h-28 w-full overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={c.img} alt="" />
                <span className={`absolute top-2 left-2 bg-white/90 backdrop-blur-md text-[10px] font-bold ${c.badgeColor} px-1.5 py-0.5 rounded-full`}>{c.badge}</span>
                <span className="absolute bottom-2 right-2 bg-black/50 text-[9px] text-white px-1.5 py-0.5 rounded font-medium">{c.count}</span>
              </div>
              <div className="p-2.5 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-outline">
                  <span>{c.time}</span>
                  <span>{c.place}</span>
                </div>
                <h3 className="text-xs font-bold text-on-surface truncate">{c.title}</h3>
                <div className="flex gap-1 mt-0.5">
                  {c.tags.map((tag) => (
                    <span key={tag} className="text-[9px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 최근 촬영 사진 피드 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-on-surface">최근 촬영 사진 피드</h2>
            <span className="text-[10px] text-outline">지능형 품질 태그 적용됨</span>
          </div>
          <button className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full font-medium active:scale-95" onClick={() => showToast('필터 전환: 전체 사진 표시', 'tune')}>
            필터: 전체
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* 카드 1 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
            <div className="aspect-[3/4] relative overflow-hidden">
              <img className="w-full h-full object-cover" src={IMG.portrait} alt="" />
              <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Icon name="star" className="text-[11px]" />
                베스트
              </span>
              <HeartButton />
            </div>
            <div className="p-2 flex flex-col">
              <span className="text-[11px] font-bold text-on-surface truncate">서울숲 야외 스냅</span>
              <span className="text-[9px] text-outline">14:12 · f/1.8 선명</span>
            </div>
          </div>
          {/* 카드 2 (흔들림) */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col group relative transition-all duration-300" style={fadeStyle(blurry.state, 0.85)}>
            <div className="aspect-[3/4] relative overflow-hidden">
              <img className="w-full h-full object-cover opacity-85" src={IMG.night} alt="" />
              <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold text-error px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Icon name="blur_on" className="text-[11px]" />
                흔들림
              </span>
              <button
                className="absolute bottom-1.5 right-1.5 bg-white/95 text-error px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm active:scale-90 transition-transform"
                onClick={() => blurry.remove(() => showToast('1.8 MB 사진이 정리되었습니다.', 'delete'))}
              >
                <Icon name="delete" className="text-[12px]" />
                정리
              </button>
            </div>
            <div className="p-2 flex flex-col">
              <span className="text-[11px] font-bold text-on-surface truncate">을지로 야경 스냅</span>
              <span className="text-[9px] text-error">20:05 · 중복 연사</span>
            </div>
          </div>
          {/* 카드 3 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
            <div className="aspect-[3/4] relative overflow-hidden">
              <img className="w-full h-full object-cover" src={IMG.brunch} alt="" />
              <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-medium text-on-surface px-1.5 py-0.5 rounded-full">유사 6장</span>
              <HeartButton />
              <button
                className="absolute bottom-1.5 right-1.5 bg-primary text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm active:scale-90 transition-transform"
                onClick={() => switchTab('clean')}
              >
                <Icon name="auto_fix_high" className="text-[12px]" />
                정리
              </button>
            </div>
            <div className="p-2 flex flex-col">
              <span className="text-[11px] font-bold text-on-surface truncate">브런치 테이블</span>
              <span className="text-[9px] text-outline">12:28 · 베스트 1선택</span>
            </div>
          </div>
          {/* 카드 4 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
            <div className="aspect-[3/4] relative overflow-hidden">
              <img className="w-full h-full object-cover" src={IMG.jeju} alt="" />
              <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Icon name="star" className="text-[11px]" />
                베스트
              </span>
              <HeartButton />
            </div>
            <div className="p-2 flex flex-col">
              <span className="text-[11px] font-bold text-on-surface truncate">제주 애월 바다</span>
              <span className="text-[9px] text-outline">09:44 · 푸른 풍경</span>
            </div>
          </div>
        </div>
      </section>

      {/* 온디바이스 보안 배너 */}
      <div className="flex items-center gap-2 p-2.5 bg-surface-container rounded-xl text-[11px] text-outline">
        <Icon name="lock" className="text-primary text-[16px] flex-shrink-0" />
        <span className="flex-1 leading-tight">모든 AI 분석은 기기 내 온디바이스에서 안전하게 실행됩니다.</span>
      </div>
    </div>
  );
}
