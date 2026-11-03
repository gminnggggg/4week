import { useState } from 'react';
import { Icon } from '../components/Icon';
import { useApp } from '../state';

const SCREENSHOT_BARS = [
  { label: '위시리스트', pct: 38, color: 'bg-primary' },
  { label: '장소·메모', pct: 29, color: 'bg-primary-container' },
  { label: '업무·학습', pct: 21, color: 'bg-outline-variant' },
];

const AUTOMATIONS = [
  { title: '30일 지난 영수증 캡처 자동 이동', desc: 'OCR 감지 결제 내역만 보존 후 삭제', on: true },
  { title: '흔들린 연사 사진 자동 필터링', desc: '초점이 맞지 않은 프레임 베스트만 보존', on: true },
  { title: 'Wi-Fi 연결 시 고화질 압축 보관', desc: '시각적 무손실 메타데이터 보존 최적화', on: false },
];

function Toggle({ initial }: { initial: boolean }) {
  const { showToast } = useApp();
  const [on, setOn] = useState(initial);
  return (
    <button
      className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors flex-shrink-0 ${on ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'}`}
      onClick={() => {
        setOn(!on);
        if (on) showToast('자동화 기능이 해제되었습니다.', 'toggle_off');
        else showToast('자동화 기능이 활성화되었습니다.', 'toggle_on');
      }}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

export function InsightsTab({ active }: { active: boolean }) {
  const { showToast } = useApp();
  const [optimized, setOptimized] = useState(false);

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="insights" className="text-[15px]" />
          스토리지 분석 리포트
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">갤러리 인사이트</h1>
        <p className="text-xs text-on-surface-variant">스마트폰 내 미디어 점유 상태와 정리 요약입니다.</p>
      </div>

      {/* 메인 요약 */}
      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-outline">총 저장공간 점유</span>
            <div className="text-base font-bold text-on-surface">{optimized ? '80.8 GB / 128 GB' : '104.8 GB / 128 GB'}</div>
          </div>
          <button
            className={`px-2.5 py-1.5 rounded-full text-white text-[11px] font-bold shadow-sm active:scale-95 transition-transform ${optimized ? 'bg-secondary' : 'bg-primary'}`}
            onClick={() => {
              setOptimized(true);
              showToast('24 GB 고용량 미디어가 최적화되었습니다!', 'speed');
            }}
          >
            {optimized ? '최적화 완료됨' : '원클릭 24 GB 최적화'}
          </button>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <div className="relative w-[72px] h-[72px] flex-shrink-0 flex items-center justify-center">
            <svg className="w-[72px] h-[72px] transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#eae7ed" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#4143d4" strokeDasharray="238.7" strokeDashoffset="110" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#6dfad2" strokeDasharray="238.7" strokeDashoffset="180" strokeWidth="12" />
            </svg>
            <span className="absolute text-[11px] font-bold text-on-surface">81.8%</span>
          </div>
          <div className="flex flex-col gap-1 flex-1 text-[11px]">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-primary" />비디오 영상</span>
              <span className="font-bold">58.4 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />고화질 사진</span>
              <span className="font-bold">36.2 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />스크린샷 외</span>
              <span className="font-bold">10.2 GB</span>
            </div>
          </div>
        </div>
      </section>

      {/* 스크린샷 분류 */}
      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-on-surface">스크린샷 분류 현황</h3>
          <span className="text-[10px] text-outline">최근 3개월</span>
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          {SCREENSHOT_BARS.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="w-14 text-outline text-[10px]">{b.label}</span>
              <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
              </div>
              <span className="w-7 text-right font-medium">{b.pct}%</span>
            </div>
          ))}
        </div>
        <button
          className="mt-1 w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-error text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
          onClick={() => showToast('오래된 캡처 312장이 안전하게 정리되었습니다.', 'delete_sweep')}
        >
          <Icon name="delete_sweep" className="text-[15px]" />
          오래된 스크린샷 312장 일괄 정리
        </button>
      </section>

      {/* 자동화 설정 */}
      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-on-surface">스마트 자동화 설정</h3>
        {AUTOMATIONS.map((a, i) => (
          <div key={a.title} className={`flex items-center justify-between text-[11px] ${i > 0 ? 'border-t border-surface-container pt-2' : ''}`}>
            <div>
              <div className="font-medium text-on-surface">{a.title}</div>
              <div className="text-[9px] text-outline">{a.desc}</div>
            </div>
            <Toggle initial={a.on} />
          </div>
        ))}
      </section>
    </div>
  );
}
