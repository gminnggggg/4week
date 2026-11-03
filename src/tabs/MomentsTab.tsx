import { useState } from 'react';
import { Icon } from '../components/Icon';
import { IMG } from '../images';
import { useApp } from '../state';

const HIGHLIGHTS = [
  { img: IMG.cafe, dur: '0:45', title: '오후의 햇살과 라떼' },
  { img: IMG.camping, dur: '1:12', title: '파도 소리 담은 제주' },
];

const PEOPLE: { name: string; label: string; content: 'all' | 'img' | string }[] = [
  { name: '모두', label: '모두', content: 'all' },
  { name: '민서', label: '민서', content: 'img' },
  { name: '구름이', label: '구름이', content: '🐱' },
  { name: '가족', label: '가족', content: '🏡' },
];

const RECORDS = [
  { img: IMG.brunch, title: '가을 브런치와 무화과', meta: '성수동 · 오후 12:28', toast: '성수동 가을 브런치 사진 상세를 엽니다.' },
  { img: IMG.jeju, title: '애월 해안 도로', meta: '서귀포 · 오전 09:44', toast: '애월 해안 도로 사진 상세를 엽니다.' },
];

export function MomentsTab({ active }: { active: boolean }) {
  const { showToast } = useApp();
  const [selected, setSelected] = useState('모두');

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="collections_bookmark" className="text-[15px]" />
          모먼트 스토리북
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">지우님의 빛나는 순간</h1>
        <p className="text-xs text-on-surface-variant">AI가 장소와 분위기를 엮어 만든 시네마틱 앨범입니다.</p>
      </div>

      {/* 무비 하이라이트 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">무비 하이라이트</h2>
          <span className="text-[11px] text-primary font-semibold">AI 자동 렌더링</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 no-scrollbar">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className="w-52 h-32 flex-shrink-0 rounded-2xl overflow-hidden relative shadow-md cursor-pointer active:scale-95 transition-transform"
              onClick={() => showToast(`'${h.title}' 무비 재생 중`, 'play_circle')}
            >
              <img className="w-full h-full object-cover" src={h.img} alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2.5 text-white">
                <span className="text-[9px] text-white/80 flex items-center gap-0.5 mb-0.5">
                  <Icon name="play_circle" className="text-[12px]" /> {h.dur} 하이라이트
                </span>
                <span className="text-xs font-bold leading-tight">{h.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 인물/태그 필터 */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] text-outline font-semibold">함께한 소중한 존재들</span>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 pb-1">
          {PEOPLE.map((p) => {
            const isSel = selected === p.name;
            const ring = isSel ? 'ring-2 ring-primary' : 'ring-1 ring-surface-container-highest';
            return (
              <button
                key={p.name}
                className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
                onClick={() => {
                  setSelected(p.name);
                  showToast(`'${p.name}' 모먼트 필터 적용됨`, 'person');
                }}
              >
                {p.content === 'all' ? (
                  <div className={`w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs ${ring} ring-offset-2`}>전체</div>
                ) : p.content === 'img' ? (
                  <div className={`w-11 h-11 rounded-full overflow-hidden ${ring} ring-offset-2`}>
                    <img className="w-full h-full object-cover" src={IMG.portrait} alt="" />
                  </div>
                ) : (
                  <div className={`w-11 h-11 rounded-full bg-surface-container ${ring} ring-offset-2 flex items-center justify-center text-lg`}>{p.content}</div>
                )}
                {/* 원본 디자인처럼 라벨 강조는 '모두'에만 적용돼요 */}
                <span className={p.content === 'all' ? 'text-[10px] font-bold text-primary' : 'text-[10px] text-outline'}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 10월 기록 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface">2024년 10월의 기록</h3>
          <span className="text-[11px] text-outline">48장의 모먼트</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RECORDS.map((r) => (
            <div
              key={r.title}
              className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group cursor-pointer active:scale-95 transition-all"
              onClick={() => showToast(r.toast, 'image')}
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={r.img} alt="" />
              </div>
              <div className="p-2 flex flex-col">
                <span className="text-[11px] font-bold truncate">{r.title}</span>
                <span className="text-[9px] text-outline">{r.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 추억의 핀포인트 */}
      <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-black/[0.02] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon name="explore" className="text-primary text-[16px]" />
            <h3 className="text-xs font-bold text-on-surface">추억의 핀포인트 지도</h3>
          </div>
          <span className="text-[10px] text-outline">총 14개 장소</span>
        </div>
        <div className="w-full h-20 bg-surface-container rounded-xl relative overflow-hidden flex items-center justify-around border border-surface-container-high">
          <div className="flex flex-col items-center">
            <Icon name="location_on" className="text-primary text-[20px] animate-bounce" />
            <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">성수동 128장</span>
          </div>
          <div className="flex flex-col items-center">
            <Icon name="location_on" className="text-secondary text-[18px]" />
            <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">제주 84장</span>
          </div>
        </div>
        <div className="flex gap-1.5 pt-0.5">
          <button className="px-2 py-1 rounded-full bg-surface-container text-[10px] font-medium text-on-surface active:scale-95" onClick={() => showToast('성수동 128장 사진을 불러옵니다.', 'location_on')}>
            📍 서울 성수동 (128)
          </button>
          <button className="px-2 py-1 rounded-full bg-surface-container text-[10px] font-medium text-on-surface active:scale-95" onClick={() => showToast('제주 서귀포 84장 사진을 불러옵니다.', 'location_on')}>
            📍 제주 서귀포 (84)
          </button>
        </div>
      </section>
    </div>
  );
}
