import { computePower } from './stats.mjs';
import { accountMods } from './balance.mjs';
import { getStage } from './progression.mjs';
import { earn } from './economy.mjs';

// ─────────────────────────────────────────────────────────────
// 아레나 — 전투력(파워) 기반 리그. 비동기 경쟁(랭크전).
//   · 리그(티어)를 "전투력"으로 나눠, 초보/약자가 고전투력 강자와 붙지 않게 한다.
//   · 매칭은 같은 리그 안에서, 내 전투력 대비 "공정 밴드"로 상대를 생성한다.
//     (약자 보호: 상대 전투력은 내 전투력의 1.12배를 절대 넘지 않는다.)
//   · 승패로 랭크 포인트가 오르내리고, 상위 리그일수록 보상이 크다.
// ─────────────────────────────────────────────────────────────

export const ARENA_ENTRIES = 5;

// 전투력 리그 — min은 진입 전투력 하한. 상대는 같은 리그 안에서만 매칭된다.
export const ARENA_POWER_TIERS = [
  { min: 0, name: '브론즈', emoji: '🥉' },
  { min: 3000, name: '실버', emoji: '🥈' },
  { min: 12000, name: '골드', emoji: '🥇' },
  { min: 40000, name: '플래티넘', emoji: '💠' },
  { min: 120000, name: '다이아', emoji: '💎' },
  { min: 350000, name: '마스터', emoji: '👑' },
  { min: 1000000, name: '그랜드마스터', emoji: '🔱' },
];

// 약자 보호 상수: 상대 전투력 상한 배수(내 전투력의 몇 배까지 허용하나).
const OPP_CAP_MULT = 1.12;

// 전투력 → 리그(인덱스·이름·이모지·구간 [min,max)).
export function arenaPowerTier(power) {
  let idx = 0;
  for (let i = 0; i < ARENA_POWER_TIERS.length; i++) {
    if (power >= ARENA_POWER_TIERS[i].min) idx = i; else break;
  }
  const t = ARENA_POWER_TIERS[idx];
  const max = idx + 1 < ARENA_POWER_TIERS.length ? ARENA_POWER_TIERS[idx + 1].min : Infinity;
  return { ...t, index: idx, max };
}

// 내 파티 실효 전투력(계정 배수 포함).
export function partyPowerEff(state) {
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const mult = accountMods(state).powerMult;
  return party.reduce((s, u) => s + computePower(u), 0) * mult;
}

// UI용 현황(대전 없이 조회): 내 전투력·리그·랭크 포인트.
export function arenaInfo(state) {
  const power = partyPowerEff(state);
  return { power: Math.round(power), tier: arenaPowerTier(power), points: state.arena.points };
}

// (하위호환) 포인트 기반 이름 — 일부 표시에 남겨두되, 리그는 전투력 기준을 쓴다.
export function arenaTier(points) {
  const P = [[2000, '다이아'], [1200, '플래티넘'], [700, '골드'], [300, '실버'], [0, '브론즈']];
  for (const [min, name] of P) if (points >= min) return name;
  return '브론즈';
}

function refresh(state, now) {
  const d = Math.floor(now / 86400000);
  if (state.arena.day !== d) { state.arena.day = d; state.arena.entries = 0; }
}
export function arenaEntriesLeft(state, now = Date.now()) {
  refresh(state, now);
  return ARENA_ENTRIES - state.arena.entries;
}

// 한 판 대전. 상대는 "같은 리그 + 공정 밴드"로 생성하며, 내 전투력의 1.12배를 넘지 않는다.
export function arenaFight(state, rng = Math.random, now = Date.now()) {
  if (arenaEntriesLeft(state, now) <= 0) return { ok: false, reason: '오늘 입장 소진' };
  state.arena.entries += 1;

  const my = partyPowerEff(state);
  const tier = arenaPowerTier(my);
  // 공정 밴드 0.80~1.12 → 약자 보호 상한(my×1.12)과 리그 상한 이내로 클램프.
  const band = 0.80 + rng() * 0.32;
  let opp = my * band;
  opp = Math.min(opp, my * OPP_CAP_MULT, tier.max - 1);
  opp = Math.max(opp, my * 0.70, tier.min);

  const win = my >= opp;
  const gain = win ? 25 : -12;
  state.arena.points = Math.max(0, state.arena.points + gain);

  // 상위 리그일수록 보상↑.
  const reward = win
    ? { gem: 5 + tier.index * 2, currency: Math.round(getStage(state.peakStage).rewards.currency * 20 * (1 + tier.index * 0.5)) }
    : {};
  if (win) earn(state.wallet, reward);

  return {
    ok: true, win, points: state.arena.points,
    tier: tier.name, tierEmoji: tier.emoji, tierIndex: tier.index,
    reward, myPower: Math.round(my), oppPower: Math.round(opp), gain,
  };
}
