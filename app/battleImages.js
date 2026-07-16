// 전투 무대용 전신 아트 레지스트리 — 전투 화면(BattleView)에서 이모지 대신 캐릭터 그림 표시.
//
// 초상(charImages, 얼굴~상반신 컷)과 별개로, 전투 무대엔 정면 대기 전신 포즈를 쓴다.
//   규격: 512×512 투명 PNG(정면 전신). 위치: assets/char/battle/<characterId>.png
//   Metro 정적 require 규칙(동적 경로 불가)에 따라 한 줄씩 등록.
//   등록 안 된 캐릭터(예: scifi)는 null 반환 → 기존 이모지로 폴백.

export const BATTLE_IMAGES = {
  'fantasy:knight': require('../assets/char/battle/knight.png'),
  'fantasy:paladin': require('../assets/char/battle/paladin.png'),
  'fantasy:paladin_with_helmet': require('../assets/char/battle/paladin_with_helmet.png'),
  'fantasy:skeleton_golem': require('../assets/char/battle/skeleton_golem.png'),
  'fantasy:barbarian': require('../assets/char/battle/barbarian.png'),
  'fantasy:barbarian_large': require('../assets/char/battle/barbarian_large.png'),
  'fantasy:werewolf_man': require('../assets/char/battle/werewolf_man.png'),
  'fantasy:werewolf_wolf': require('../assets/char/battle/werewolf_wolf.png'),
  'fantasy:skeleton_warrior': require('../assets/char/battle/skeleton_warrior.png'),
  'fantasy:skeleton_minion': require('../assets/char/battle/skeleton_minion.png'),
  'fantasy:druid': require('../assets/char/battle/druid.png'),
  'fantasy:animatronic_normal': require('../assets/char/battle/animatronic_normal.png'),
  'fantasy:rogue': require('../assets/char/battle/rogue.png'),
  'fantasy:rogue_hooded': require('../assets/char/battle/rogue_hooded.png'),
  'fantasy:skeleton_rogue': require('../assets/char/battle/skeleton_rogue.png'),
  'fantasy:animatronic_creepy': require('../assets/char/battle/animatronic_creepy.png'),
  'fantasy:ranger': require('../assets/char/battle/ranger.png'),
  'fantasy:engineer': require('../assets/char/battle/engineer.png'),
  'fantasy:mage': require('../assets/char/battle/mage.png'),
  'fantasy:necromancer': require('../assets/char/battle/necromancer.png'),
  'fantasy:skeleton_mage': require('../assets/char/battle/skeleton_mage.png'),
};

// conceptId + characterId → 전신 이미지 소스 또는 null(이모지 폴백).
export function battleImage(conceptId, characterId) {
  if (!conceptId || !characterId) return null;
  return BATTLE_IMAGES[`${conceptId}:${characterId}`] || null;
}
