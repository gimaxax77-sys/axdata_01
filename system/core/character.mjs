import { spend } from './economy.mjs';
import { levelUpCost, levelCap } from './units.mjs';
import { getSkill, skillSlots, skillUpCost } from './skills.mjs';
import { getEnhanceNode, enhanceCost, ENHANCE_CAP } from './enhance.mjs';

// ─────────────────────────────────────────────────────────────
// 캐릭터 성장 액션 — 장르 무관(RPG도 방치형도 캐릭터를 키운다).
// 상태(state.wallet)에서 자원을 소모하고 유닛을 강하게 만든다.
// 모든 액션은 { ok, ... } 를 반환한다.
// ─────────────────────────────────────────────────────────────

function findUnit(state, uid) {
  const u = state.units.find((x) => x.uid === uid);
  if (!u) throw new Error(`유닛 없음: ${uid}`);
  return u;
}

// ── 레벨업 ────────────────────────────────────────────────────
export function levelUp(state, uid) {
  const unit = findUnit(state, uid);
  if (unit.level >= levelCap(unit)) {
    return { ok: false, reason: `레벨 상한 ${levelCap(unit)} (돌파 필요)` };
  }
  const cost = levelUpCost(unit);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '성장 재료 부족', cost };
  unit.level += 1;
  return { ok: true, level: unit.level, cost };
}

// ── 돌파(랭크업) : 레벨 상한을 열고 스킬 슬롯을 늘린다 ──────────
export function ascend(state, uid) {
  const unit = findUnit(state, uid);
  const cost = { summon: unit.rank * 2 }; // 중복 유닛/조각 소모 개념
  if (!spend(state.wallet, cost)) return { ok: false, reason: '돌파 재료 부족', cost };
  unit.rank += 1;
  return { ok: true, rank: unit.rank, newCap: levelCap(unit), slots: skillSlots(unit) };
}

// ── 스킬 장착 ─────────────────────────────────────────────────
export function equipSkill(state, uid, slotIndex, skillId) {
  const unit = findUnit(state, uid);
  getSkill(skillId); // 검증
  if (slotIndex < 0 || slotIndex >= skillSlots(unit)) {
    return { ok: false, reason: `슬롯 ${slotIndex} 잠김 (현재 ${skillSlots(unit)}개, 돌파 필요)` };
  }
  // 같은 스킬 중복 장착 방지
  const dup = unit.skills.some((s, i) => s && s.id === skillId && i !== slotIndex);
  if (dup) return { ok: false, reason: '이미 장착된 스킬' };
  unit.skills[slotIndex] = { id: skillId, level: unit.skills[slotIndex]?.id === skillId ? unit.skills[slotIndex].level : 1 };
  return { ok: true, slot: slotIndex, skill: skillId };
}

export function unequipSkill(state, uid, slotIndex) {
  const unit = findUnit(state, uid);
  unit.skills[slotIndex] = null;
  return { ok: true };
}

// ── 스킬 강화(레벨업) ─────────────────────────────────────────
export function upgradeSkill(state, uid, slotIndex) {
  const unit = findUnit(state, uid);
  const slot = unit.skills[slotIndex];
  if (!slot || !slot.id) return { ok: false, reason: '빈 슬롯' };
  const cost = skillUpCost(slot.level);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '스킬 강화 재료 부족', cost };
  slot.level += 1;
  return { ok: true, skill: slot.id, level: slot.level, cost };
}

// ── 강화(각인) : 특정 스탯에 집중 투자 ────────────────────────
export function enhanceNode(state, uid, stat) {
  const unit = findUnit(state, uid);
  getEnhanceNode(stat); // 검증
  const cur = unit.enhance[stat] || 0;
  if (cur >= ENHANCE_CAP) return { ok: false, reason: `강화 상한 ${ENHANCE_CAP}` };
  const cost = enhanceCost(cur);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '강화 재료 부족', cost };
  unit.enhance[stat] = cur + 1;
  return { ok: true, stat, level: unit.enhance[stat], cost };
}
