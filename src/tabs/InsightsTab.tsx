import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { type Settings } from '../lib/analyze';
import { saveFile } from '../lib/device';
import { CATEGORY, CATEGORY_ORDER, toCSV } from '../lib/scrap';
import { useScraps } from '../scrapStore';
import { useStore } from '../store';

const R = 38;
const C = 2 * Math.PI * R;
const COLORS: Record<string, string> = {
  food: '#904400', recipe: '#006b55', shopping: '#4143d4', travel: '#5b5fee', info: '#767586', other: '#c6c5d7',
};

const AUTOMATIONS: { key: keyof Settings; title: string; desc: string }[] = [
  { key: 'similar', title: '비슷한 사진 묶기', desc: '연사·중복 사진 중 가장 선명한 1장을 베스트로 추천' },
  { key: 'blur', title: '흔들리고 어두운 사진 감지', desc: '초점이 나갔거나 너무 어두운 사진을 후보로 표시' },
  { key: 'screenshot', title: '스크린샷 감지', desc: '화면 캡처로 보이는 이미지를 따로 분류' },
];

function topN(values: string[], n: number) {
  const m = new Map<string, number>();
  values.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function InsightsTab({ active }: { active: boolean }) {
  const { scraps } = useScraps();
  const { settings, setSetting, showToast, photos, analysis, marked } = useStore();
  const done = scraps.filter((s) => s.data);
  const n = done.length || 1;

  const stats = useMemo(() => {
    const d = new Date();
    const thisMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    return {
      byCat: CATEGORY_ORDER.map((c) => ({ c, count: done.filter((s) => s.data!.category === c).length })).filter((x) => x.count > 0),
      thisMonth: scraps.filter((s) => s.createdAt >= thisMonth).length,
      lastMonth: scraps.filter((s) => s.createdAt >= lastMonth && s.createdAt < thisMonth).length,
      areas: topN(done.flatMap((s) => s.data!.places.map((p) => p.area ?? '')), 5),
      tags: topN(done.flatMap((s) => s.data!.tags), 8),
    };
  }, [scraps, done]);

  let acc = 0;
  const top = stats.byCat.slice().sort((a, b) => b.count - a.count)[0];

  const exportCSV = async () => {
    if (done.length === 0) {
      showToast('내보낼 스크랩이 없어요.', 'info');
      return;
    }
    const csv = toCSV(done);
    const bytes = new TextEncoder().encode(csv);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const b64 = btoa(bin);
    const name = `onmedia_scraps_${new Date().toISOString().slice(0, 10)}.csv`;
    const ok = await saveFile(b64, name, 'text/csv');
    showToast(ok ? '스크랩 목록을 파일로 저장했어요.' : '이 기기에서는 파일 저장을 지원하지 않아요.', ok ? 'download_done' : 'error');
  };

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-col gap-4 px-3.5 pt-3 pb-24`}>
      <div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <Icon name="insights" className="text-[15px]" />
          스크랩 리포트
        </div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight mt-0.5">나의 취향 인사이트</h1>
        <p className="text-xs text-on-surface-variant">어떤 정보를 많이 모으는지 한눈에 볼 수 있어요.</p>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-outline">이번 달 스크랩</span>
            <div className="text-base font-bold text-on-surface">
              {stats.thisMonth}개
              <span className="text-[10px] font-medium text-outline ml-1.5">지난달 {stats.lastMonth}개</span>
            </div>
          </div>
          {top && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CATEGORY[top.c].bg} ${CATEGORY[top.c].color}`}>
              {CATEGORY[top.c].label} 러버
            </span>
          )}
        </div>
        {done.length === 0 ? (
          <p className="text-[11px] text-outline">스크랩을 모으면 취향 분석이 나타나요.</p>
        ) : (
          <div className="flex items-center gap-3 pt-0.5">
            <div className="relative w-[72px] h-[72px] flex-shrink-0 flex items-center justify-center">
              <svg className="w-[72px] h-[72px] transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r={R} stroke="#eae7ed" strokeWidth="12" />
                {stats.byCat.map((x) => {
                  const len = (x.count / n) * C;
                  const el = (
                    <circle key={x.c} cx="50" cy="50" fill="transparent" r={R} stroke={COLORS[x.c]} strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />
                  );
                  acc += len;
                  return el;
                })}
              </svg>
              <span className="absolute text-[11px] font-bold text-on-surface">{done.length}</span>
            </div>
            <div className="flex flex-col gap-1 flex-1 text-[11px]">
              {stats.byCat.map((x) => (
                <div key={x.c} className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS[x.c] }} />
                    {CATEGORY[x.c].label}
                  </span>
                  <span className="font-bold">{Math.round((x.count / n) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {(stats.areas.length > 0 || stats.tags.length > 0) && (
        <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2.5">
          {stats.areas.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-on-surface">자주 저장한 동네</h3>
              <div className="flex flex-col gap-1.5 text-[11px]">
                {stats.areas.map(([a, c]) => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="w-16 text-outline text-[10px] truncate">📍 {a}</span>
                    <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(c / stats.areas[0][1]) * 100}%` }} />
                    </div>
                    <span className="w-7 text-right font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {stats.tags.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-on-surface mt-1">자주 쓰인 키워드</h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.tags.map(([t, c]) => (
                  <span key={t} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                    #{t} <span className="text-outline">{c}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <button
        className="w-full py-2.5 rounded-xl bg-surface-container-lowest shadow-sm border border-black/[0.02] text-primary text-[11px] font-bold flex items-center justify-center gap-1 active:scale-[0.98]"
        onClick={exportCSV}
      >
        <Icon name="download" className="text-[15px]" />
        스크랩 목록 엑셀(CSV)로 내보내기
      </button>

      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-black/[0.02] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-on-surface">갤러리 정리 설정</h3>
          <span className="text-[10px] text-outline">
            분석 {photos.length}장 · 후보 {analysis.candidates.size} · 담김 {marked.size}
          </span>
        </div>
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
