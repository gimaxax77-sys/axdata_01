// ─────────────────────────────────────────────────────────────
// 유닛 스프라이트 레지스트리 — 3D 프리렌더 스프라이트를 캐릭↔상태로 연결.
//   규격: assets/units/<concept>/<key>/<key>_<state>.png (가로 스트립 8프레임)
//         docs/ART_PIPELINE_3D.md §4 참조. 현재 상태: idle(순환)·attack(1회).
//   미등록 캐릭터 → null 반환 → 기존 초상/이모지 폴백(무해).
//   (hit 스트립도 assets에 있으나 용량 절약 위해 미등록 — 필요 시 한 줄 추가.)
// ─────────────────────────────────────────────────────────────

const SHEETS = {
  'fantasy:knight': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/knight/knight_idle.png'), attack: require('../assets/units/fantasy/knight/knight_attack.png') },
  'fantasy:paladin': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/paladin/paladin_idle.png'), attack: require('../assets/units/fantasy/paladin/paladin_attack.png') },
  'fantasy:paladin_with_helmet': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/paladin_with_helmet/paladin_with_helmet_idle.png'), attack: require('../assets/units/fantasy/paladin_with_helmet/paladin_with_helmet_attack.png') },
  'fantasy:skeleton_golem': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/skeleton_golem/skeleton_golem_idle.png'), attack: require('../assets/units/fantasy/skeleton_golem/skeleton_golem_attack.png') },
  'fantasy:barbarian': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/barbarian/barbarian_idle.png'), attack: require('../assets/units/fantasy/barbarian/barbarian_attack.png') },
  'fantasy:barbarian_large': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/barbarian_large/barbarian_large_idle.png'), attack: require('../assets/units/fantasy/barbarian_large/barbarian_large_attack.png') },
  'fantasy:werewolf_man': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/werewolf_man/werewolf_man_idle.png'), attack: require('../assets/units/fantasy/werewolf_man/werewolf_man_attack.png') },
  'fantasy:werewolf_wolf': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/werewolf_wolf/werewolf_wolf_idle.png'), attack: require('../assets/units/fantasy/werewolf_wolf/werewolf_wolf_attack.png') },
  'fantasy:skeleton_warrior': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/skeleton_warrior/skeleton_warrior_idle.png'), attack: require('../assets/units/fantasy/skeleton_warrior/skeleton_warrior_attack.png') },
  'fantasy:skeleton_minion': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/skeleton_minion/skeleton_minion_idle.png'), attack: require('../assets/units/fantasy/skeleton_minion/skeleton_minion_attack.png') },
  'fantasy:druid': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/druid/druid_idle.png'), attack: require('../assets/units/fantasy/druid/druid_attack.png') },
  'fantasy:animatronic_normal': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/animatronic_normal/animatronic_normal_idle.png'), attack: require('../assets/units/fantasy/animatronic_normal/animatronic_normal_attack.png') },
  'fantasy:rogue': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/rogue/rogue_idle.png'), attack: require('../assets/units/fantasy/rogue/rogue_attack.png') },
  'fantasy:rogue_hooded': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/rogue_hooded/rogue_hooded_idle.png'), attack: require('../assets/units/fantasy/rogue_hooded/rogue_hooded_attack.png') },
  'fantasy:skeleton_rogue': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/skeleton_rogue/skeleton_rogue_idle.png'), attack: require('../assets/units/fantasy/skeleton_rogue/skeleton_rogue_attack.png') },
  'fantasy:animatronic_creepy': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/animatronic_creepy/animatronic_creepy_idle.png'), attack: require('../assets/units/fantasy/animatronic_creepy/animatronic_creepy_attack.png') },
  'fantasy:ranger': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/ranger/ranger_idle.png'), attack: require('../assets/units/fantasy/ranger/ranger_attack.png') },
  'fantasy:engineer': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/engineer/engineer_idle.png'), attack: require('../assets/units/fantasy/engineer/engineer_attack.png') },
  'fantasy:mage': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/mage/mage_idle.png'), attack: require('../assets/units/fantasy/mage/mage_attack.png') },
  'fantasy:necromancer': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/necromancer/necromancer_idle.png'), attack: require('../assets/units/fantasy/necromancer/necromancer_attack.png') },
  'fantasy:skeleton_mage': { frameW: 128, frameH: 128, frames: 8, idle: require('../assets/units/fantasy/skeleton_mage/skeleton_mage_idle.png'), attack: require('../assets/units/fantasy/skeleton_mage/skeleton_mage_attack.png') },
};

// 캐릭터의 특정 상태 스프라이트 조회. 없으면 null(→ 폴백).
export function unitSprite(conceptId, key, state) {
  const rec = SHEETS[`${conceptId}:${key}`];
  if (!rec || !rec[state]) return null;
  return { source: rec[state], frameW: rec.frameW || 128, frameH: rec.frameH || 128, frames: rec.frames || 1 };
}

// 이 캐릭터가 스프라이트를 갖고 있는지(있으면 SpriteAnim, 없으면 Portrait).
export function hasUnitSprite(conceptId, key) {
  return !!SHEETS[`${conceptId}:${key}`];
}
