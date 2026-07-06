import { computePower } from '../core/stats.mjs';
import { levelCap, toCombatProfile } from '../core/units.mjs';
import { skillSlots } from '../core/skills.mjs';
import {
  levelUp, ascend, equipSkill, upgradeSkill, enhanceNode,
} from '../core/character.mjs';
import { craftGear, equipGear, enhanceGear, GEAR_SLOTS } from '../core/gear.mjs';
import { RELICS, upgradeRelic } from '../core/relics.mjs';
import { petSummon, PET_PULL_COST } from '../core/pets.mjs';
import { MAX_PARTY } from '../core/gameState.mjs';

// ─────────────────────────────────────────────────────────────
// 오토플레이어 — "합리적 유저"의 투자 전략을 흉내낸다.
// 자원 풀이 3종(growth/currency/summon)으로 분리돼 있어 서로 경쟁하지 않으므로,
// 매 세션 각 풀을 최대한 소진한다. 밸런스 곡선을 드러내는 게 목적.
// ─────────────────────────────────────────────────────────────

// 원형별 기본 스킬 우선순위
const DEFAULT_SKILLS = {
  STRIKER: ['BERSERK', 'PRECISION', 'SWIFT'],
  VANGUARD: ['FORTRESS', 'RALLY', 'VAMPIRIC'],
  SUPPORT: ['RALLY', 'PRECISION', 'FORTRESS'],
};
// 원형별 각인 우선순위
const ENHANCE_ORDER = {
  STRIKER: ['atk', 'crit', 'atk', 'hp'],
  VANGUARD: ['hp', 'def', 'hp', 'atk'],
  SUPPORT: ['atk', 'hp', 'crit', 'def'],
};
// 슬롯별 기본 장비
const DEFAULT_GEAR = { weapon: 'RUNE_BLADE', armor: 'PLATE_ARMOR', accessory: 'CRIT_RING' };

const CAP_ITERS = 5000; // 무한루프 방지

function partyUnits(state) {
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  return state.party.map((id) => byId.get(id)).filter(Boolean);
}

// 파티 = 전투력 상위 N명 (투자한 유닛이 자연스럽게 주력이 됨)
export function pickParty(state, size = MAX_PARTY) {
  const sorted = [...state.units].sort((a, b) => computePower(b) - computePower(a));
  state.party = sorted.slice(0, size).map((u) => u.uid);
}

// 빈 스킬 슬롯 채우기 (무료) — 가능한 만큼
function fillSkills(state) {
  for (const u of partyUnits(state)) {
    const order = DEFAULT_SKILLS[u.archetype] || [];
    for (let i = 0; i < skillSlots(u); i++) {
      if (!u.skills[i] && order[i]) equipSkill(state, u.uid, i, order[i]);
    }
  }
}

// growth 풀 소진: 가장 레벨 낮은(=효율 높은) 파티원부터 레벨업
function drainGrowth(state) {
  let iters = 0;
  while (iters++ < CAP_ITERS) {
    const cand = partyUnits(state)
      .filter((u) => u.level < levelCap(u))
      .sort((a, b) => a.level - b.level)[0];
    if (!cand) break;
    if (!levelUp(state, cand.uid).ok) break;
  }
  // 남은 growth는 스킬 강화에
  iters = 0;
  while (iters++ < CAP_ITERS) {
    let did = false;
    for (const u of partyUnits(state)) {
      for (let i = 0; i < skillSlots(u); i++) {
        if (u.skills[i] && upgradeSkill(state, u.uid, i).ok) { did = true; }
      }
    }
    if (!did) break;
  }
}

// summon 풀 소진: 상한에 걸린 파티원 돌파(싼 편) → 남으면 10연차로 로스터 확장
function drainSummon(state, rng, summonFn) {
  let iters = 0;
  while (iters++ < CAP_ITERS) {
    const capped = partyUnits(state).find((u) => u.level >= levelCap(u));
    if (!capped) break;
    if (!ascend(state, capped.uid).ok) break;
  }
  // 넉넉하면 로스터 확장 (10연차)
  while (state.wallet.summon >= 100) {
    const r = summonFn(state, 10, rng);
    if (!r.ok) break;
    pickParty(state);
    fillSkills(state);
  }
}

// currency 풀 소진: 빈 장비 슬롯 채움 → 장비강화/각인/유물을 번갈아
function drainCurrency(state, useAccount) {
  // 1) 빈 장비 슬롯 채우기
  let iters = 0;
  while (iters++ < CAP_ITERS) {
    let did = false;
    for (const u of partyUnits(state)) {
      for (const slot of GEAR_SLOTS) {
        if (!u.gear[slot]) {
          const c = craftGear(state, DEFAULT_GEAR[slot]);
          if (c.ok) { equipGear(state, u.uid, c.item.uid); did = true; }
        }
      }
    }
    if (!did) break;
  }
  // 2) 각인 + 장비강화 + 유물을 번갈아, 싼 것부터
  iters = 0;
  const enhIdx = {};
  const relicIds = Object.keys(RELICS);
  let relicIdx = 0;
  while (iters++ < CAP_ITERS) {
    let did = false;
    for (const u of partyUnits(state)) {
      const order = ENHANCE_ORDER[u.archetype] || ['atk'];
      const stat = order[(enhIdx[u.uid] = (enhIdx[u.uid] || 0) + 1) % order.length];
      if (enhanceNode(state, u.uid, stat).ok) did = true;
      for (const slot of GEAR_SLOTS) {
        if (u.gear[slot] && enhanceGear(state, u.gear[slot].uid).ok) did = true;
      }
    }
    // 유물 강화 (계정 성장) — 라운드로빈
    if (useAccount) {
      const rid = relicIds[relicIdx++ % relicIds.length];
      if (upgradeRelic(state, rid).ok) did = true;
    }
    if (!did) break;
  }
}

// gem 풀 소진: 펫 소환(중복 레벨업·자동 장착)
function drainPets(state, rng) {
  let iters = 0;
  while (iters++ < CAP_ITERS) {
    if ((state.wallet.gem || 0) < PET_PULL_COST.gem) break;
    if (!petSummon(state, rng).ok) break;
  }
}

// 한 세션의 전체 투자 (모든 풀 소진)
export function invest(state, rng, summonFn, useAccount = true) {
  fillSkills(state);
  drainGrowth(state);
  drainSummon(state, rng, summonFn);
  drainCurrency(state, useAccount);
  if (useAccount) drainPets(state, rng);
  pickParty(state);
}

// 파티 합계/최고 전투력
export function partyPower(state) {
  const us = partyUnits(state);
  return {
    best: us.length ? Math.max(...us.map(computePower)) : 0,
    total: us.reduce((s, u) => s + computePower(u), 0),
    size: state.units.length,
  };
}
