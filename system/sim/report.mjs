import { writeFileSync } from 'node:fs';
import { runSimulation } from './balance.mjs';

// ─────────────────────────────────────────────────────────────
// 밸런스 리포트 생성기 — 시뮬레이션을 돌려 성장 곡선을
// 자체완결 HTML(인라인 SVG 차트)로 렌더한다.
//   실행:  node system/sim/report.mjs [출력경로]
// ─────────────────────────────────────────────────────────────

const base = runSimulation();
const scenarios = {
  off: runSimulation({ balance: { prestigeIncomeBonus: 0 }, usePrestige: false }),
  base,
  tuned: runSimulation({
    balance: { enemyGrowth: 1.12, rewardGrowth: 1.13, levelCostGrowth: 1.09,
      enhanceCostGrowth: 1.16, gearCostGrowth: 1.2, prestigeIncomeBonus: 1.0 },
  }),
};
const trials = [
  { label: '환생 OFF', s: scenarios.off },
  { label: '기본', s: base },
  { label: '환생 1.0', s: runSimulation({ balance: { prestigeIncomeBonus: 1.0 } }) },
  { label: '비용완화', s: runSimulation({ balance: { levelCostGrowth: 1.09, enhanceCostGrowth: 1.16, gearCostGrowth: 1.2 } }) },
  { label: '종합안', s: scenarios.tuned },
];

const days = base.daily.map((d) => d.day);
const P = { blue: ['#2a78d6', '#3987e5'], aqua: ['#1baf7a', '#199e70'], yellow: ['#eda100', '#c98500'], red: ['#e34948', '#e66767'] };

// ── SVG 라인차트 ──────────────────────────────────────────────
function lineChart(series, yLabelFmt = (v) => v, opts = {}) {
  const W = 680, H = 300, pad = { l: 52, r: 96, t: 18, b: 34 };
  const xs = days;
  const yMax = Math.max(...series.flatMap((s) => s.points)) * 1.1;
  const xAt = (i) => pad.l + (i / (xs.length - 1)) * (W - pad.l - pad.r);
  const yAt = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b);
  const grid = [];
  for (let g = 0; g <= 4; g++) {
    const v = (yMax / 4) * g, y = yAt(v);
    grid.push(`<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" class="grid"/>`);
    grid.push(`<text x="${pad.l - 8}" y="${y + 4}" class="tick" text-anchor="end">${yLabelFmt(Math.round(v))}</text>`);
  }
  const xticks = xs.map((d, i) => `<text x="${xAt(i)}" y="${H - pad.b + 20}" class="tick" text-anchor="middle">${d}일</text>`);
  const paths = series.map((s) => {
    const pts = s.points.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
    const dots = s.points.map((v, i) =>
      `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="3.5" fill="${s.color}" stroke="var(--surface-1)" stroke-width="2"><title>${s.name} · ${xs[i]}일: ${yLabelFmt(v)}</title></circle>`
    ).join('');
    const endX = xAt(xs.length - 1), endY = yAt(s.points[s.points.length - 1]);
    const label = `<text x="${endX + 8}" y="${endY + 4}" class="endlabel" fill="${s.color}">${s.name}</text>`;
    return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${label}`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${opts.aria || ''}">
    ${grid.join('')}<line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" class="axis"/>
    ${xticks.join('')}${paths.join('')}</svg>`;
}

// ── SVG 막대차트 ──────────────────────────────────────────────
function barChart(items) {
  const W = 680, H = 260, pad = { l: 52, r: 20, t: 18, b: 48 };
  const yMax = Math.max(...items.map((i) => i.value)) * 1.15;
  const bw = (W - pad.l - pad.r) / items.length;
  const yAt = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b);
  const grid = [];
  for (let g = 0; g <= 4; g++) {
    const v = (yMax / 4) * g, y = yAt(v);
    grid.push(`<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" class="grid"/>`);
    grid.push(`<text x="${pad.l - 8}" y="${y + 4}" class="tick" text-anchor="end">${Math.round(v)}</text>`);
  }
  const bars = items.map((it, i) => {
    const x = pad.l + i * bw + bw * 0.2, w = bw * 0.6, y = yAt(it.value), h = H - pad.b - y;
    const hi = it.label === '종합안';
    const col = hi ? P.aqua[0] : P.blue[0];
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${col}"><title>${it.label}: ${it.value}층</title></rect>
      <text x="${x + w / 2}" y="${y - 6}" class="barval" text-anchor="middle">${it.value}</text>
      <text x="${x + w / 2}" y="${H - pad.b + 18}" class="tick" text-anchor="middle">${it.label}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="튜닝안별 7일차 도달 스테이지">
    ${grid.join('')}<line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" class="axis"/>${bars.join('')}</svg>`;
}

// ── 데이터 시리즈 ─────────────────────────────────────────────
const powerFig = lineChart([
  { name: '보유', color: P.blue[0], points: base.daily.map((d) => d.bestPower) },
  { name: '요구', color: P.red[0], points: base.daily.map((d) => d.required) },
], (v) => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v), { aria: '보유 vs 요구 전투력' });

const stageFig = lineChart([
  { name: '환생OFF', color: P.blue[0], points: scenarios.off.daily.map((d) => d.maxStage) },
  { name: '기본', color: P.aqua[0], points: base.daily.map((d) => d.maxStage) },
  { name: '종합안', color: P.yellow[0], points: scenarios.tuned.daily.map((d) => d.maxStage) },
], (v) => v, { aria: '튜닝 시나리오별 스테이지 도달' });

const barFig = barChart(trials.map((t) => ({ label: t.label, value: t.s.daily[t.s.daily.length - 1].maxStage })));

const wallStage = base.daily[0].maxStage;
const baseFinal = base.daily[base.daily.length - 1].maxStage;
const tunedFinal = scenarios.tuned.daily[scenarios.tuned.daily.length - 1].maxStage;
const offFinal = scenarios.off.daily[scenarios.off.daily.length - 1].maxStage;

function dataTable() {
  const rows = base.daily.map((d) => `<tr><td>${d.day}</td><td>${d.maxStage}</td><td>${d.stageGain}</td><td>${d.bestPower.toLocaleString()}</td><td>${d.required.toLocaleString()}</td><td>${d.prestige}</td></tr>`).join('');
  return `<table class="dtable"><thead><tr><th>Day</th><th>최고Stage</th><th>일일증가</th><th>보유전투력</th><th>요구전투력</th><th>환생</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ── HTML (body-only; Artifact 스켈레톤이 head/body 감쌈) ────────
const html = `<title>밸런스 시뮬레이터 리포트</title>
<style>
  .viz-root{--surface-1:#fcfcfb;--plane:#f9f9f7;--text-primary:#0b0b0b;--text-secondary:#52514e;--muted:#898781;--grid:#e1e0d9;--axis:#c3c2b7;--border:rgba(11,11,11,.10);--good:#006300;--crit:#d03b3b;
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--text-primary);background:var(--plane);max-width:860px;margin:0 auto;padding:28px 20px 56px;line-height:1.5;}
  @media (prefers-color-scheme:dark){.viz-root{--surface-1:#1a1a19;--plane:#0d0d0d;--text-primary:#fff;--text-secondary:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--border:rgba(255,255,255,.10);--good:#0ca30c;--crit:#e66767;}}
  :root[data-theme="dark"] .viz-root{--surface-1:#1a1a19;--plane:#0d0d0d;--text-primary:#fff;--text-secondary:#c3c2b7;--grid:#2c2c2a;--axis:#383835;--border:rgba(255,255,255,.10);--good:#0ca30c;--crit:#e66767;}
  :root[data-theme="light"] .viz-root{--surface-1:#fcfcfb;--plane:#f9f9f7;--text-primary:#0b0b0b;--text-secondary:#52514e;--grid:#e1e0d9;--axis:#c3c2b7;--border:rgba(11,11,11,.10);--good:#006300;--crit:#d03b3b;}
  .viz-root h1{font-size:24px;margin:0 0 6px;}
  .viz-root .sub{color:var(--text-secondary);margin:0 0 24px;font-size:15px;}
  .tiles{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;}
  .tile{flex:1;min-width:150px;background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:16px 18px;}
  .tile .k{font-size:13px;color:var(--muted);margin-bottom:6px;}
  .tile .v{font-size:30px;font-weight:800;letter-spacing:-.02em;}
  .tile .v small{font-size:15px;font-weight:600;color:var(--text-secondary);}
  .card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:18px 18px 12px;margin-bottom:22px;overflow-x:auto;}
  .card h2{font-size:16px;margin:0 0 4px;}
  .card p.note{font-size:13px;color:var(--text-secondary);margin:0 0 12px;}
  .chart{width:100%;height:auto;min-width:520px;display:block;}
  .grid{stroke:var(--grid);stroke-width:1;}
  .axis{stroke:var(--axis);stroke-width:1;}
  .tick{fill:var(--muted);font-size:11px;font-variant-numeric:tabular-nums;}
  .endlabel{font-size:12px;font-weight:700;}
  .barval{fill:var(--text-primary);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;}
  .legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--text-secondary);margin:4px 2px 0;}
  .legend span{display:inline-flex;align-items:center;gap:6px;}
  .dot{width:10px;height:10px;border-radius:3px;display:inline-block;}
  .findings{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:18px 20px;}
  .findings h2{font-size:16px;margin:0 0 10px;}
  .findings li{margin:6px 0;}
  .crit{color:var(--crit);font-weight:700;}
  .good{color:var(--good);font-weight:700;}
  details{margin-top:18px;}summary{cursor:pointer;color:var(--text-secondary);font-size:14px;}
  .dtable{border-collapse:collapse;width:100%;margin-top:12px;font-size:13px;font-variant-numeric:tabular-nums;}
  .dtable th,.dtable td{border:1px solid var(--border);padding:6px 10px;text-align:right;}
  .dtable th{background:var(--plane);color:var(--text-secondary);font-weight:600;}
</style>
<div class="viz-root">
  <h1>🎮 밸런스 시뮬레이터 리포트</h1>
  <p class="sub">합리적 오토플레이어를 7일간 시뮬레이션 — Core 엔진이 실제로 돌린 성장 곡선. 문서가 "미정"으로 남긴 수치를 코드로 검증.</p>

  <div class="tiles">
    <div class="tile"><div class="k">Day 1 도달 (벽 시작)</div><div class="v">${wallStage}<small>층</small></div></div>
    <div class="tile"><div class="k">기본 7일차</div><div class="v crit">${baseFinal}<small>층</small></div></div>
    <div class="tile"><div class="k">종합안 7일차</div><div class="v good">${tunedFinal}<small>층</small></div></div>
    <div class="tile"><div class="k">환생 OFF 7일차</div><div class="v">${offFinal}<small>층</small></div></div>
  </div>

  <div class="card">
    <h2>① 전투력 격차 — 플레이어가 뒤처진다</h2>
    <p class="note">요구 전투력(적)이 보유 전투력보다 빠르게 벌어짐 = 초반 러시 후 콘크리트 벽. 이게 방치형의 대표 실패 모드.</p>
    ${powerFig}
    <div class="legend"><span><i class="dot" style="background:${P.blue[0]}"></i>보유 전투력</span><span><i class="dot" style="background:${P.red[0]}"></i>요구 전투력</span></div>
  </div>

  <div class="card">
    <h2>② 스테이지 도달 곡선 — 튜닝 시나리오 비교</h2>
    <p class="note">환생(곱셈형 루프)을 실제 보너스로 고치고 곡선 상수를 완화한 "종합안"이 가장 깊이 도달.</p>
    ${stageFig}
    <div class="legend"><span><i class="dot" style="background:${P.blue[0]}"></i>환생 OFF</span><span><i class="dot" style="background:${P.aqua[0]}"></i>기본</span><span><i class="dot" style="background:${P.yellow[0]}"></i>종합안</span></div>
  </div>

  <div class="card">
    <h2>③ 튜닝안별 7일차 도달 스테이지</h2>
    <p class="note">레버를 겹칠수록 도달 깊이가 커짐. 환생 루프가 단일 최대 레버.</p>
    ${barFig}
  </div>

  <div class="findings">
    <h2>핵심 발견</h2>
    <ol>
      <li><span class="crit">지수적 벽</span>: Day 1에 ${wallStage}층 폭발 후 하루 +1씩. 적 성장(1.14ⁿ) &gt; 보상 성장(1.12ⁿ) + 강화비용 폭증이 겹침.</li>
      <li>곡선 상수(적/보상) 조정만으로는 벽이 안 풀림 → 진짜 원인은 <b>지출 곡선</b>과 <b>곱셈형 루프 부재</b>.</li>
      <li><span class="crit">환생이 장식용이었다</span>: <code>state.prestige</code>가 포인트만 쌓고 보너스 미적용 → 수정(수입 배수)하니 곡선이 개선(${baseFinal}→${tunedFinal}층).</li>
      <li>더 깊은 구조적 병목: 유닛 파워가 <b>레벨 상한(랭크×20)</b>에 묶여, 상한 개방은 소환(희소 자원)에 의존 → 수입만으로는 못 넘음.</li>
    </ol>
  </div>

  <details>
    <summary>표로 보기 (기본 시나리오 원자료)</summary>
    ${dataTable()}
  </details>
</div>`;

const out = process.argv[2] || 'docs/balance-report.html';
writeFileSync(out, html);
console.log('리포트 생성:', out, `(${html.length} bytes)`);
