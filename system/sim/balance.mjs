import { createGameState } from '../core/gameState.mjs';
import { createUnit } from '../core/units.mjs';
import { earn } from '../core/economy.mjs';
import { getStage } from '../core/progression.mjs';
import { BALANCE, accountMods } from '../core/balance.mjs';
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
    dailyGem = 20, // 광고 보상 다이아 (펫 소환용)
    seed = 20260706,
    starter = { currency: 300, growth: 200, summon: 100 },
    balance = null, // BALANCE 오버라이드 (튜닝 실험)
    usePrestige = true, // 정체 시 환생 루프 사용
    useAccount = true, // 유물·펫 등 계정 성장 사용
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
  let prevPeak = 1;

  for (let day = 1; day <= days; day++) {
    // 일일 콘텐츠 faucet: 출석/미션(소환권) + 광고(다이아) + 던전(골드, 진행도 비례)
    earn(state.wallet, {
      summon: dailySummon,
      gem: useAccount ? dailyGem : 0,
      currency: Math.round(getStage(state.peakStage).rewards.currency * 80),
    });
    let clears = 0;
    for (let c = 0; c < checkinsPerDay; c++) {
      const before = state.maxStage;
      const t = idleGenre.tick(state, hoursPerCheckin * 3600);
      clears += t.clears;
      invest(state, rng, summonMulti, useAccount);
      // 벽에서 환생: 이번 체크인에 더 못 나아갔고 충분히 깊으면 환생
      if (usePrestige && state.maxStage <= before && state.maxStage >= 15) {
        idleGenre.prestige(state);
      }
    }
    const peak = state.peakStage;
    const mult = accountMods(state).powerMult;
    const pp = partyPower(state);
    // 게이트 통과 기록 (역대 최고 = 실제 진행도 기준)
    while (gateIdx < GATES.length && peak >= GATES[gateIdx].stage) {
      gateHits.push({ day, ...GATES[gateIdx] });
      gateIdx++;
    }
    daily.push({
      day,
      maxStage: peak, // 역대 최고 도달(실제 진행도)
      stageGain: peak - prevPeak,
      bestPower: Math.round(pp.best * mult), // 환생 배수 반영
      totalPower: Math.round(pp.total * mult),
      roster: pp.size,
      required: stagePower(peak),
      prestige: state.prestige,
      accMult: mult, // 계정 배수(환생×유물×펫)
      relicLv: Object.values(state.relics || {}).reduce((a, b) => a + b, 0),
      pets: (state.pets && state.pets.active.length) || 0,
      gold: Math.round(state.wallet.currency),
      clears,
    });
    prevPeak = peak;
  }

  // 병목 검출: 초반 러시(Day1) 이후 진행이 사실상 멈춘 날(일일 +1 이하).
  const bottlenecks = [];
  for (const d of daily) {
    if (d.day > 1 && d.stageGain <= 1) {
      bottlenecks.push({ day: d.day, stage: d.maxStage, gain: d.stageGain });
    }
  }

  // 곡선 매끄러움 지표
  const gains = daily.slice(1).map((d) => d.stageGain);
  const mean = gains.reduce((s, g) => s + g, 0) / (gains.length || 1);
  const variance = gains.reduce((s, g) => s + (g - mean) ** 2, 0) / (gains.length || 1);
  const cv = mean > 0 ? Math.sqrt(variance) / mean : Infinity; // 변동계수(낮을수록 매끄러움)
  const ratios = daily.map((d) => d.bestPower / d.required);
  const minRatio = Math.min(...ratios);
  const smoothness = { cv, minRatio, meanGain: mean };

  return { daily, gateHits, bottlenecks, smoothness, opts: { days, checkinsPerDay, hoursPerCheckin, dailySummon, seed } };
}

// ── CLI 리포트 ────────────────────────────────────────────────
function main() {
  const sim = runSimulation();
  const line = (c = '─') => console.log(c.repeat(66));

  console.log('\n■ 7일 성장 곡선 (합리적 오토플레이어, 하루 ~8h 파밍)\n');
  console.log('  Day  최고Stage  일일증가  최고전투력  환생  유물Lv  펫  계정배수  달성률');
  line();
  for (const d of sim.daily) {
    const ratio = ((d.bestPower / d.required) * 100).toFixed(0) + '%';
    console.log(
      `  ${String(d.day).padStart(3)}  ${String(d.maxStage).padStart(8)}  ` +
        `${String(d.stageGain).padStart(7)}  ${String(d.bestPower).padStart(9)}  ` +
        `${String(d.prestige).padStart(4)}  ${String(d.relicLv).padStart(5)}  ${String(d.pets).padStart(2)}  ` +
        `${('×' + d.accMult.toFixed(2)).padStart(7)}  ${ratio.padStart(6)}`
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
      console.log(`  Day ${b.day}: 스테이지 ${b.stage}에서 정체 (일일 +${b.gain})`);
    }
  }

  // ── 튜닝 실험: 보상/난이도 곡선을 조정하면 어떻게 달라지나 ──
  console.log('\n\n■ 튜닝 실험 — 곡선 상수를 바꿔 재시뮬레이션\n');
  const trials = [
    { label: '계정성장 OFF (유물·펫 없음)', opt: { useAccount: false } },
    { label: '기본 (환생+유물+펫)', opt: {} },
    { label: '환생 OFF', opt: { balance: { prestigeIncomeBonus: 0 }, usePrestige: false } },
    { label: '비용 완화', opt: { balance: { levelCostGrowth: 1.09, enhanceCostGrowth: 1.16, gearCostGrowth: 1.2 } } },
    { label: '종합안 (난이도↓+비용완화+환생1.0)',
      opt: { balance: { enemyGrowth: 1.12, rewardGrowth: 1.13, levelCostGrowth: 1.09, enhanceCostGrowth: 1.16, gearCostGrowth: 1.2, prestigeIncomeBonus: 1.0 } } },
  ];
  console.log('  튜닝안                                  7일차Stage  최저달성률  변동계수  병목');
  line();
  for (const t of trials) {
    const s = runSimulation(t.opt);
    const last = s.daily[s.daily.length - 1];
    const minR = (s.smoothness.minRatio * 100).toFixed(0) + '%';
    const cv = s.smoothness.cv.toFixed(2);
    console.log(
      `  ${t.label.padEnd(38)}  ${String(last.maxStage).padStart(8)}  ` +
        `${minR.padStart(8)}  ${cv.padStart(7)}  ${String(s.bottlenecks.length).padStart(4)}`
    );
  }
  console.log('\n  → 최저달성률이 높고(뒤처지지 않음) 변동계수가 낮은(매끄러운) 튜닝안이 좋다.');
  console.log('');
}

// 직접 실행 시에만 리포트
if (import.meta.url === `file://${process.argv[1]}`) main();
