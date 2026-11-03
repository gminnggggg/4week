import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { THRESHOLD, type Settings } from '../lib/analyze';
import { useStore } from '../store';

const R = 38;
const C = 2 * Math.PI * R;

const AUTOMATIONS: { key: keyof Settings; title: string; desc: string }[] = [
  { key: 'similar', title: '비슷한 사진 묶기', desc: '연사·중복 사진 중 가장 선명한 1장을 베스트로 추천' },
  { key: 'blur', title: '흔들리고 어두운 사진 감지', desc: '초점이 나갔거나 너무 어두운 사진을 후보로 표시' },
  { key: 'screenshot', title: '스크린샷 감지', desc: '화면 캡처로 보이는 이미지를 따로 분류' },
];

export function InsightsTab({ active }: { active: boolean }) {
  const { photos, analysis, settings, setSetting, resetAll, addPhotos, progress, showToast } = useStore();
  const analyzed = photos.filter((p) => p.f);
  const n = analyzed.length || 1;

  const seg = [
    { label: '보관할 사진', count: analyzed.length - analysis.candidates.size, color: '#4143d4', dot: 'bg-primary' },
    { label: '유사 중복', count: analysis.similar.length, color: '#6dfad2', dot: 'bg-secondary-container' },
    { label: '흐림·어두움', count: analysis.blurry.length + analysis.dark.length, color: '#5b5fee', dot: 'bg-primary-container' },
    { label: '스크린샷', count: analysis.screenshots.length, color: '#c6c5d7', dot: 'bg-outline-variant' },
  ];
  let acc = 0;

  const sharp = analyzed.filter((p) => p.f!.sharp >= THRESHOLD.sharp).length;
  const blurry = analyzed.filter((p) => p.f!.sharp < THRESHOLD.blurry).length;
  const quality = [
    { label: '선명', pct: Math.round((sharp / n) * 100), color: 'bg-primary' },
    { label: '보통', pct: Math.round(((analyzed.length - sharp - blurry) / n) * 100), color: 'bg-primary-container' },
    { label: '흐림', pct: Math.round((blurry / n) * 100), color: 'bg-outline-variant' },
  ];

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="insights" className="text-[15px]" />
          사진 분석 리포트
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">갤러리 인사이트</h1>
        <p className="text-xs text-on-surface-variant">불러온 사진의 품질 상태와 정리 요약입니다.</p>
      </div>

      {photos.length === 0 ? (
        <EmptyState title="리포트를 만들 사진이 없어요" desc="사진을 불러오면 품질 분포와 정리 요약을 보여드려요." />
      ) : (
        <>
          <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-outline">분석한 사진</span>
                <div className="text-base font-bold text-on-surface">{analyzed.length}장</div>
              </div>
              <button
                className="px-2.5 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                onClick={addPhotos}
                disabled={!!progress}
              >
                사진 더 분석하기
              </button>
            </div>
            <div className="flex items-center gap-3 pt-0.5">
              <div className="relative w-[72px] h-[72px] flex-shrink-0 flex items-center justify-center">
                <svg className="w-[72px] h-[72px] transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r={R} stroke="#eae7ed" strokeWidth="12" />
                  {seg.map((s) => {
                    const len = (s.count / n) * C;
                    const el = (
                      <circle
                        key={s.label} cx="50" cy="50" fill="transparent" r={R} stroke={s.color} strokeWidth="12"
                        strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc}
                      />
                    );
                    acc += len;
                    return s.count > 0 ? el : null;
                  })}
                </svg>
                <span className="absolute text-[11px] font-bold text-on-surface">{Math.round((seg[0].count / n) * 100)}%</span>
              </div>
              <div className="flex flex-col gap-1 flex-1 text-[11px]">
                {seg.map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="font-bold">{s.count}장</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-on-surface">사진 선명도 분포</h3>
              <span className="text-[10px] text-outline">불러온 사진 기준</span>
            </div>
            <div className="flex flex-col gap-1.5 text-[11px]">
              {quality.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="w-14 text-outline text-[10px]">{b.label}</span>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${b.color} transition-all`} style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-7 text-right font-medium">{b.pct}%</span>
                </div>
              ))}
            </div>
            <button
              className="mt-1 w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-error text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
              onClick={() => {
                resetAll();
                showToast('분석 기록을 모두 지웠어요. 갤러리 사진은 그대로예요.', 'delete_sweep');
              }}
            >
              <Icon name="delete_sweep" className="text-[15px]" />
              분석 기록 초기화
            </button>
          </section>
        </>
      )}

      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-on-surface">스마트 분석 설정</h3>
        {AUTOMATIONS.map((a, i) => {
          const on = settings[a.key];
          return (
            <div key={a.key} className={`flex items-center justify-between gap-2 text-[11px] ${i > 0 ? 'border-t border-surface-container pt-2' : ''}`}>
              <div>
                <div className="font-medium text-on-surface">{a.title}</div>
                <div className="text-[9px] text-outline">{a.desc}</div>
              </div>
              <button
                className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors flex-shrink-0 ${on ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'}`}
                onClick={() => {
                  setSetting(a.key, !on);
                  showToast(on ? '분석 기능을 껐어요.' : '분석 기능을 켰어요.', on ? 'toggle_off' : 'toggle_on');
                }}
                role="switch"
                aria-checked={on}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
