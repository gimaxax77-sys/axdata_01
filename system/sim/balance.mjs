import { createGameState } from '../core/gameState.mjs';
import { createUnit } from '../core/units.mjs';
import { earn } from '../core/economy.mjs';
import { getStage } from '../core/progression.mjs';
import { BALANCE } from '../core/balance.mjs';
import { idleGenre } from '../genres/idle.mjs';
import { summonMulti } from '../core/gacha.mjs';
import { makeRng } from '../core/rng.mjs';
import { invest, pickParty, partyPower } from './autoplayer.mjs';

// ─────────────────────────────────────────────────────────────
// 밸런스 시뮬레이터 — 합리적 오토플레이어를 N일간 돌려
// 성장 곡선 / 병목 / 문서 해금 게이트 페이싱을 검출한다.
// 문서가 "미정"으로 남긴 수치 감각을 코드로 채운다.
// ─────────────────────────────────────────────────────────────

// 문서(04장/03장)의 스테이지 해금 게이트
export const GATES = [
  { stage: 2, name: '캐릭터 강화' },
  { stage: 5, name: '장비' },
  { stage: 10, name: '보스 도전' },
  { stage: 20, name: '소환' },
  { stage: 30, name: '골드 던전' },
  { stage: 50, name: '강화석 던전' },
  { stage: 80, name: '도감' },
  { stage: 100, name: '펫' },
  { stage: 150, name: '시즌 패스' },
  { stage: 200, name: '아레나' },
  { stage: 300, name: '길드' },
];

// 스테이지 요구 전투력(비교용 지표)
export function stagePower(stage) {
  const c = getStage(stage).challenge;
  return Math.round(c.hp * 0.15 + c.atk * 1.2 + c.def * 0.6);
}

// BALANCE 상수를 잠시 바꿔 fn을 실행하고 원복한다 (튜닝 실험용).
export function withBalance(override, fn) {
  const snapshot = JSON.parse(JSON.stringify(BALANCE));
  Object.assign(BALANCE, override);
  try {
    return fn();
  } finally {
    Object.assign(BALANCE, snapshot);
  }
}

export function runSimulation(opts = {}) {
  const {
    days = 7,
    checkinsPerDay = 8,
    hoursPerCheckin = 1, // 하루 약 8시간 파밍(오프라인 상한)
    dailySummon = 40, // 출석/미션 소환권
    seed = 20260706,
    starter = { currency: 300, growth: 200, summon: 100 },
    balance = null, // BALANCE 오버라이드 (튜닝 실험)
    usePrestige = true, // 정체 시 환생 루프 사용
  } = opts;

  if (balance) return withBalance(balance, () => runSimulation({ ...opts, balance: null }));

  const rng = makeRng(seed);
  const hero = createUnit('STRIKER', { level: 1, rank: 1 });
  const state = createGameState({ units: [hero], party: [hero.uid] });
  earn(state.wallet, starter);
  pickParty(state);

  const daily = [];
  const gateHits = [];
  let gateIdx = 0;
  let prevStage = 1;

  for (let day = 1; day <= days; day++) {
    earn(state.wallet, { summon: dailySummon });
    let clears = 0;
    for (let c = 0; c < checkinsPerDay; c++) {
      const t = idleGenre.tick(state, hoursPerCheckin * 3600);
      clears += t.clears;
      invest(state, rng, summonMulti);
    }
    const stageGain = state.maxStage - prevStage;
    // 정체 시 환생: 진행이 막히고 어느 정도 깊이면 곱셈형 루프 발동
    if (usePrestige && stageGain <= 1 && state.maxStage >= 15) {
      idleGenre.prestige(state);
    }
    // 게이트 통과 기록
    while (gateIdx < GATES.length && state.maxStage >= GATES[gateIdx].stage) {
      gateHits.push({ day, ...GATES[gateIdx] });
      gateIdx++;
    }
    const pp = partyPower(state);
    daily.push({
      day,
      maxStage: state.maxStage,
      stageGain,
      bestPower: pp.best,
      totalPower: pp.total,
      roster: pp.size,
      required: stagePower(state.maxStage),
      prestige: state.prestige,
      gold: Math.round(state.wallet.currency),
      clears,
    });
    prevStage = state.maxStage;
  }

  // 병목 검출: 일일 스테이지 증가가 직전 피크의 50% 미만으로 꺾이는 날
  let peakGain = 0;
  const bottlenecks = [];
  for (const d of daily) {
    peakGain = Math.max(peakGain, d.stageGain);
    if (peakGain > 0 && d.stageGain < peakGain * 0.5 && d.day > 1) {
      bottlenecks.push({ day: d.day, stage: d.maxStage, gain: d.stageGain, peakGain });
    }
  }

  return { daily, gateHits, bottlenecks, opts: { days, checkinsPerDay, hoursPerCheckin, dailySummon, seed } };
}

// ── CLI 리포트 ────────────────────────────────────────────────
function main() {
  const sim = runSimulation();
  const line = (c = '─') => console.log(c.repeat(66));

  console.log('\n■ 7일 성장 곡선 (합리적 오토플레이어, 하루 ~8h 파밍)\n');
  console.log('  Day  최고Stage  일일증가  최고전투력  파티합   로스터  환생  달성률');
  line();
  for (const d of sim.daily) {
    const ratio = ((d.bestPower / d.required) * 100).toFixed(0) + '%';
    console.log(
      `  ${String(d.day).padStart(3)}  ${String(d.maxStage).padStart(8)}  ` +
        `${String(d.stageGain).padStart(7)}  ${String(d.bestPower).padStart(9)}  ` +
        `${String(d.totalPower).padStart(7)}  ${String(d.roster).padStart(5)}  ` +
        `${String(d.prestige).padStart(4)}  ${ratio.padStart(6)}`
    );
  }

  console.log('\n\n■ 콘텐츠 해금 게이트 도달 페이싱 (문서 기준)\n');
  line();
  for (const g of GATES) {
    const hit = sim.gateHits.find((h) => h.stage === g.stage);
    const when = hit ? `Day ${hit.day} 도달` : '7일 내 미도달 ✗';
    console.log(`  스테이지 ${String(g.stage).padStart(3)}  ${g.name.padEnd(12)}  ${when}`);
  }

  console.log('\n\n■ 병목(성장 정체) 검출\n');
  line();
  if (!sim.bottlenecks.length) {
    console.log('  뚜렷한 급정체 없음 (곡선이 매끄러움)');
  } else {
    for (const b of sim.bottlenecks) {
      console.log(`  Day ${b.day}: 스테이지 ${b.stage}에서 정체 (일일 +${b.gain}, 피크 +${b.peakGain})`);
    }
  }

  // ── 튜닝 실험: 보상/난이도 곡선을 조정하면 어떻게 달라지나 ──
  console.log('\n\n■ 튜닝 실험 — 곡선 상수를 바꿔 재시뮬레이션\n');
  const trials = [
    { label: '환생 OFF (bonus 0)', opt: { balance: { prestigeIncomeBonus: 0 }, usePrestige: false } },
    { label: '기본 (환생 ON)', opt: {} },
    { label: '환생 강화 (bonus 0.5→1.0)', opt: { balance: { prestigeIncomeBonus: 1.0 } } },
    { label: '비용 완화만', opt: { balance: { levelCostGrowth: 1.09, enhanceCostGrowth: 1.16, gearCostGrowth: 1.2 } } },
    { label: '종합안 (난이도↓+비용완화+환생1.0)',
      opt: { balance: { enemyGrowth: 1.12, rewardGrowth: 1.13, levelCostGrowth: 1.09, enhanceCostGrowth: 1.16, gearCostGrowth: 1.2, prestigeIncomeBonus: 1.0 } } },
  ];
  console.log('  튜닝안                                  7일차Stage  달성률  병목수');
  line();
  for (const t of trials) {
    const s = runSimulation(t.opt);
    const last = s.daily[s.daily.length - 1];
    const ratio = ((last.bestPower / last.required) * 100).toFixed(0) + '%';
    console.log(
      `  ${t.label.padEnd(38)}  ${String(last.maxStage).padStart(8)}  ` +
        `${ratio.padStart(6)}  ${String(s.bottlenecks.length).padStart(5)}`
    );
  }
  console.log('\n  → 환생(곱셈형 루프)이 지수적 벽을 넘는 가장 큰 레버임을 확인.');
  console.log('');
}

// 직접 실행 시에만 리포트
if (import.meta.url === `file://${process.argv[1]}`) main();
