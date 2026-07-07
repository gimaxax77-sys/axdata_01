import { spend } from './economy.mjs';
import { BALANCE } from './balance.mjs';

// ─────────────────────────────────────────────────────────────
// 장비 시스템 — 슬롯별 장착 + 강화로 유닛을 추가 성장시킨다.
//   강화(각인)가 "본체 스탯 %투자"라면, 장비는 "착용형 flat 스탯 + 효과".
//   장비도 modifiers 파이프라인의 한 소스로 합산된다.
//
// 슬롯: weapon(공격) · armor(생존) · accessory(효과/속도)
// 장비 인스턴스는 unit.gear[slot] 또는 state.inventory 에 존재한다.
// ─────────────────────────────────────────────────────────────

export const GEAR_SLOTS = ['weapon', 'armor', 'accessory'];

// 장비 설계도(blueprint). flat=고정 스탯, effect=전투 효과.
export const GEAR_CATALOG = {
  IRON_SWORD: { id: 'IRON_SWORD', slot: 'weapon', label: '강철검', flat: { atk: 120 } },
  RUNE_BLADE: { id: 'RUNE_BLADE', slot: 'weapon', label: '룬블레이드', flat: { atk: 90 }, effect: { critChance: 0.08 } },
  PLATE_ARMOR: { id: 'PLATE_ARMOR', slot: 'armor', label: '판금갑옷', flat: { hp: 800, def: 60 } },
  AEGIS: { id: 'AEGIS', slot: 'armor', label: '이지스', flat: { hp: 500, def: 40 }, effect: { lifesteal: 0.12 } },
  CRIT_RING: { id: 'CRIT_RING', slot: 'accessory', label: '치명반지', flat: { spd: 30 }, effect: { critChance: 0.12, critDamage: 0.3 } },
  PIERCE_CHARM: { id: 'PIERCE_CHARM', slot: 'accessory', label: '관통부적', flat: { spd: 20 }, effect: { defPierce: 0.25 } },
  // ── P1 상위 티어 (제작 비용↑, 콘텐츠 진행 후 노림) ──
  DRAGON_FANG: { id: 'DRAGON_FANG', slot: 'weapon', label: '용아검', flat: { atk: 180 }, effect: { critChance: 0.1 }, craftCost: 600 },
  BULWARK_PLATE: { id: 'BULWARK_PLATE', slot: 'armor', label: '성벽갑옷', flat: { hp: 1100, def: 85 }, effect: {}, craftCost: 600 },
  OMNI_CHARM: { id: 'OMNI_CHARM', slot: 'accessory', label: '만능부적', flat: { spd: 35 }, effect: { critChance: 0.1, defPierce: 0.15 }, craftCost: 600 },
};

const GEAR_ENH_PER = 0.12; // 강화 레벨당 flat +12%

export function getBlueprint(id) {
  const b = GEAR_CATALOG[id];
  if (!b) throw new Error(`알 수 없는 장비: ${id}`);
  return b;
}

let _gseq = 0;
export function ensureGearSeq(n) { if (n > _gseq) _gseq = n; }

export function createGear(blueprintId) {
  const b = getBlueprint(blueprintId);
  return { uid: `g${++_gseq}`, blueprint: blueprintId, slot: b.slot, level: 1 };
}

// 장비 한 점이 유닛에 주는 기여분 (강화 레벨 반영).
export function gearContribution(gearItem) {
  const b = getBlueprint(gearItem.blueprint);
  const scale = 1 + GEAR_ENH_PER * (gearItem.level - 1);
  const flat = {};
  for (const [k, v] of Object.entries(b.flat || {})) flat[k] = v * scale;
  return { flat, effect: b.effect || {} };
}

// 장비 강화 비용 (currency).
export function gearEnhanceCost(level) {
  return {
    currency: Math.round(BALANCE.gearCostBase * Math.pow(BALANCE.gearCostGrowth, level - 1)),
  };
}

// ── 액션 (장르 무관) ──────────────────────────────────────────

// 설계도로 장비를 제작해 인벤토리에 넣는다.
export function gearCraftCost(blueprintId) {
  return { currency: getBlueprint(blueprintId).craftCost || 150 };
}
export function craftGear(state, blueprintId) {
  const cost = gearCraftCost(blueprintId);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '제작 재화 부족', cost };
  const item = createGear(blueprintId);
  state.inventory.push(item);
  return { ok: true, item };
}

function findUnit(state, uid) {
  const u = state.units.find((x) => x.uid === uid);
  if (!u) throw new Error(`유닛 없음: ${uid}`);
  return u;
}

// 인벤토리의 장비를 유닛 슬롯에 장착 (기존 장비는 인벤토리로 반환).
export function equipGear(state, unitUid, gearUid) {
  const unit = findUnit(state, unitUid);
  const idx = state.inventory.findIndex((g) => g.uid === gearUid);
  if (idx === -1) return { ok: false, reason: '인벤토리에 없는 장비' };
  const item = state.inventory[idx];
  const slot = item.slot;
  const prev = unit.gear[slot];
  state.inventory.splice(idx, 1);
  if (prev) state.inventory.push(prev); // 기존 장비 회수
  unit.gear[slot] = item;
  return { ok: true, slot, equipped: item.uid, unequipped: prev?.uid || null };
}

export function unequipGear(state, unitUid, slot) {
  const unit = findUnit(state, unitUid);
  const item = unit.gear[slot];
  if (!item) return { ok: false, reason: '빈 슬롯' };
  unit.gear[slot] = null;
  state.inventory.push(item);
  return { ok: true, unequipped: item.uid };
}

// 장착/보유 장비를 강화.
export function enhanceGear(state, gearUid) {
  let item =
    state.inventory.find((g) => g.uid === gearUid) ||
    state.units.flatMap((u) => GEAR_SLOTS.map((s) => u.gear[s]))
      .find((g) => g && g.uid === gearUid);
  if (!item) return { ok: false, reason: '장비 없음' };
  const cost = gearEnhanceCost(item.level);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '강화 재화 부족', cost };
  item.level += 1;
  return { ok: true, gear: item.uid, level: item.level, cost };
}
