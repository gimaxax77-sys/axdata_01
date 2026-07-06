import { spend } from './economy.mjs';
import { weightedPick } from './rng.mjs';

// 펫 등급 확률 (gacha와 분리해 순환 의존 방지).
const PET_RARITY = [
  { id: 'R', weight: 70 }, { id: 'SR', weight: 25 }, { id: 'SSR', weight: 5 },
];

// ─────────────────────────────────────────────────────────────
// 펫 — 계정 성장 축(유물과 형제). 차이: 수집(소환)+장착 루프가 있다.
//   · 소환으로 획득, 중복은 레벨업(합성)
//   · 최대 3마리 장착, 장착 펫 보너스만 accountMods에 합산
//   · 다이아(gem) 소비처 → BM과 연결
// 보너스 축은 power/currency/growth (accountMods와 동일).
// ─────────────────────────────────────────────────────────────

export const PETS = {
  P_CAT: { id: 'P_CAT', label: '럭키캣', emoji: '🐱', type: 'currency', rarity: 'R', per: 0.06 },
  P_WOLF: { id: 'P_WOLF', label: '늑대', emoji: '🐺', type: 'power', rarity: 'R', per: 0.04 },
  P_OWL: { id: 'P_OWL', label: '부엉이', emoji: '🦉', type: 'growth', rarity: 'R', per: 0.06 },
  P_FOX: { id: 'P_FOX', label: '황금여우', emoji: '🦊', type: 'currency', rarity: 'SR', per: 0.09 },
  P_BEAR: { id: 'P_BEAR', label: '큰곰', emoji: '🐻', type: 'power', rarity: 'SR', per: 0.07 },
  P_TURTLE: { id: 'P_TURTLE', label: '거북', emoji: '🐢', type: 'growth', rarity: 'SR', per: 0.09 },
  P_DRAGON: { id: 'P_DRAGON', label: '드래곤', emoji: '🐉', type: 'power', rarity: 'SSR', per: 0.12 },
};

export const MAX_ACTIVE_PETS = 3;
export const PET_PULL_COST = { gem: 30 };

export function petEffectLabel(type, concept) {
  if (type === 'power') return '전투력';
  if (type === 'currency') return `${concept ? concept.resources.currency.name : '골드'} 수입`;
  return `${concept ? concept.resources.growth.name : '정수'} 수입`;
}

// 펫 소환: 다이아 소모 → 등급 확률로 펫 획득(중복은 레벨업), 빈 슬롯이면 자동 장착.
export function petSummon(state, rng = Math.random) {
  if (!spend(state.wallet, PET_PULL_COST)) return { ok: false, reason: '다이아 부족', cost: PET_PULL_COST };
  const rarity = weightedPick(PET_RARITY, rng);
  const pool = Object.values(PETS).filter((p) => p.rarity === rarity.id);
  const from = pool.length ? pool : Object.values(PETS);
  const pet = from[Math.floor(rng() * from.length)];
  state.pets.owned[pet.id] = (state.pets.owned[pet.id] || 0) + 1;
  if (state.pets.active.length < MAX_ACTIVE_PETS && !state.pets.active.includes(pet.id)) {
    state.pets.active.push(pet.id);
  }
  return { ok: true, pet: pet.id, rarity: rarity.id, level: state.pets.owned[pet.id] };
}

export function equipPet(state, id) {
  if (!state.pets.owned[id]) return { ok: false, reason: '미보유' };
  if (state.pets.active.includes(id)) return { ok: false, reason: '이미 장착' };
  if (state.pets.active.length >= MAX_ACTIVE_PETS) return { ok: false, reason: '장착 슬롯 가득' };
  state.pets.active.push(id);
  return { ok: true };
}
export function unequipPet(state, id) {
  state.pets.active = state.pets.active.filter((x) => x !== id);
  return { ok: true };
}

// 장착 펫들의 계정 배수 (power/currency/growth). 없으면 전부 1.
export function petMods(state) {
  let power = 1, currency = 1, growth = 1;
  const pets = state.pets;
  if (!pets) return { power, currency, growth };
  for (const id of pets.active || []) {
    const p = PETS[id];
    const lv = pets.owned[id] || 0;
    if (!p || !lv) continue;
    if (p.type === 'power') power += p.per * lv;
    else if (p.type === 'currency') currency += p.per * lv;
    else if (p.type === 'growth') growth += p.per * lv;
  }
  return { power, currency, growth };
}
