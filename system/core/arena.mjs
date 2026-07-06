import { computePower } from './stats.mjs';
import { accountMods } from './balance.mjs';
import { getStage } from './progression.mjs';
import { earn } from './economy.mjs';

// ─────────────────────────────────────────────────────────────
// 아레나 — 비동기 경쟁(랭크전) 골격. 실 PvP 대신 파워 기반 상대 생성.
// 하루 입장 제한, 승패로 랭크 포인트 변동, 승리 보상(다이아·골드).
// ─────────────────────────────────────────────────────────────

export const ARENA_ENTRIES = 5;
const TIERS = [
  { min: 0, name: '브론즈' }, { min: 300, name: '실버' }, { min: 700, name: '골드' },
  { min: 1200, name: '플래티넘' }, { min: 2000, name: '다이아' },
];

function partyPowerEff(state) {
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const mult = accountMods(state).powerMult;
  return party.reduce((s, u) => s + computePower(u), 0) * mult;
}

export function arenaTier(points) {
  let t = TIERS[0];
  for (const x of TIERS) if (points >= x.min) t = x;
  return t.name;
}

function refresh(state, now) {
  const d = Math.floor(now / 86400000);
  if (state.arena.day !== d) { state.arena.day = d; state.arena.entries = 0; }
}
export function arenaEntriesLeft(state, now = Date.now()) {
  refresh(state, now);
  return ARENA_ENTRIES - state.arena.entries;
}

// 한 판 대전. 상대는 내 전투력 × (0.75~1.35) 로 생성.
export function arenaFight(state, rng = Math.random, now = Date.now()) {
  if (arenaEntriesLeft(state, now) <= 0) return { ok: false, reason: '오늘 입장 소진' };
  state.arena.entries += 1;
  const my = partyPowerEff(state);
  const opp = my * (0.75 + rng() * 0.6);
  const win = my >= opp;
  state.arena.points = Math.max(0, state.arena.points + (win ? 25 : -12));
  const reward = win ? { gem: 6, currency: Math.round(getStage(state.peakStage).rewards.currency * 20) } : {};
  if (win) earn(state.wallet, reward);
  return {
    ok: true, win, points: state.arena.points, tier: arenaTier(state.arena.points),
    reward, myPower: Math.round(my), oppPower: Math.round(opp),
  };
}
