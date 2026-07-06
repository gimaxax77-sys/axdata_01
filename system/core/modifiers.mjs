import { getArchetype } from './archetypes.mjs';
import { getSkill, skillPower } from './skills.mjs';
import { ENHANCE_NODES } from './enhance.mjs';
import { GEAR_SLOTS, gearContribution } from './gear.mjs';

// ─────────────────────────────────────────────────────────────
// 모디파이어 파이프라인 — 한 유닛의 "모든 성장 요소"를 하나로 합산.
// 소스: 원형(archetype) · 장착 스킬 · 강화(각인)
// 이 합산 결과를 stats(스탯 계산)와 resolution(판정)이 함께 쓴다.
//
// 반환 형태:
//   statPct   : { atk, hp, def, spd }  자기 스탯 % 가산
//   effect    : { critChance, critDamage, lifesteal, defPierce }
//   teamBuff  : { atk }                팀 전체 버프
// ─────────────────────────────────────────────────────────────

function emptyMods() {
  return {
    statPct: { atk: 0, hp: 0, def: 0, spd: 0 },
    statFlat: { atk: 0, hp: 0, def: 0, spd: 0 },
    effect: { critChance: 0, critDamage: 0, lifesteal: 0, defPierce: 0 },
    teamBuff: { atk: 0 },
  };
}

function addStatPct(mods, src, scale = 1) {
  if (!src) return;
  for (const k of Object.keys(mods.statPct)) {
    if (src[k]) mods.statPct[k] += src[k] * scale;
  }
}
function addStatFlat(mods, src) {
  if (!src) return;
  for (const k of Object.keys(mods.statFlat)) {
    if (src[k]) mods.statFlat[k] += src[k];
  }
}
function addEffect(mods, src, scale = 1) {
  if (!src) return;
  for (const k of Object.keys(mods.effect)) {
    if (src[k]) mods.effect[k] += src[k] * scale;
  }
}

// 한 유닛의 전체 모디파이어를 계산한다.
export function collectUnitModifiers(unit) {
  const mods = emptyMods();

  // 1) 원형 고유 팀 버프 (예: SUPPORT의 팀 ATK +15%)
  const arch = getArchetype(unit.archetype);
  if (arch.teamBuff && arch.teamBuff.stat === 'atk') {
    mods.teamBuff.atk += arch.teamBuff.mult;
  }

  // 1-b) 전용(시그니처) 스킬 — 항상 발동, 랭크에 비례해 강해짐(정체성=성장)
  if (unit.signature) {
    const sig = getSkill(unit.signature);
    const scale = skillPower(unit.rank);
    addStatPct(mods, sig.statPct, scale);
    addEffect(mods, sig.effect, scale);
    if (sig.teamBuff && sig.teamBuff.atk) mods.teamBuff.atk += sig.teamBuff.atk * scale;
  }

  // 2) 장착 스킬 (슬롯별, 스킬 레벨에 비례)
  for (const slot of unit.skills || []) {
    if (!slot || !slot.id) continue;
    const skill = getSkill(slot.id);
    const scale = skillPower(slot.level || 1);
    addStatPct(mods, skill.statPct, scale);
    addEffect(mods, skill.effect, scale);
    if (skill.teamBuff && skill.teamBuff.atk) {
      mods.teamBuff.atk += skill.teamBuff.atk * scale;
    }
  }

  // 3) 강화(각인) — 노드 레벨 × 노드당 증가값
  const enh = unit.enhance || {};
  for (const [stat, lvl] of Object.entries(enh)) {
    if (!lvl) continue;
    const node = ENHANCE_NODES[stat];
    if (!node) continue;
    if (node.kind === 'statPct') mods.statPct[node.stat] += node.per * lvl;
    else if (node.kind === 'effect') mods.effect[node.stat] += node.per * lvl;
  }

  // 4) 장착 장비 — flat 스탯 + 전투 효과
  const gear = unit.gear || {};
  for (const slot of GEAR_SLOTS) {
    const item = gear[slot];
    if (!item) continue;
    const c = gearContribution(item);
    addStatFlat(mods, c.flat);
    addEffect(mods, c.effect);
  }

  return mods;
}
