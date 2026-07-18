// UI 아이콘 레지스트리 — 상단 자원바 등에서 이모지 대신 KayKit 3D 렌더 아이콘 사용.
//   규격: 128×128 투명 PNG. 위치: assets/ui/<key>.png
//   미등록 키는 null → 호출부가 이모지로 폴백.

const RES_ICONS = {
  currency: require('../assets/ui/currency.png'),
  growth: require('../assets/ui/growth.png'),
  summon: require('../assets/ui/summon.png'),
  gem: require('../assets/ui/gem.png'),
};

// 자원 키 → 아이콘 소스 또는 null(이모지 폴백).
export function resIcon(key) {
  return (key && RES_ICONS[key]) || null;
}

// 장비(무기·방패) 3D 아이콘 — 블루프린트별. 모델 없는 방어구·장신구는 미등록 → 이모지 폴백.
const GEAR_IMG = {
  sword: require('../assets/ui/gear/sword.png'),
  dagger: require('../assets/ui/gear/dagger.png'),
  bow: require('../assets/ui/gear/bow.png'),
  axe: require('../assets/ui/gear/axe.png'),
  greatsword: require('../assets/ui/gear/greatsword.png'),
  shield: require('../assets/ui/gear/shield.png'),
  tome: require('../assets/ui/gear/tome.png'),
};
// 장비 블루프린트 → 아이콘 종류.
const BLUEPRINT_ICON = {
  IRON_SWORD: 'sword', RUNE_BLADE: 'sword', VOID_EDGE: 'sword', DRAGON_FANG: 'sword', RAGE_BLADE: 'sword',
  DAGGER: 'dagger', BOW: 'bow', AXE: 'axe', GREATSWORD: 'greatsword',
  TOWER_SHIELD: 'shield', GUARDIAN_WALL: 'shield', BASTION_WALL: 'shield', ARCANE_TOME: 'tome',
};
// 장비 블루프린트 → 아이콘 소스 또는 null(이모지 폴백).
export function gearIcon(blueprint) {
  const kind = blueprint && BLUEPRINT_ICON[blueprint];
  return (kind && GEAR_IMG[kind]) || null;
}

// 펫·가디언 3D 아이콘 — Quaternius Cute Monsters(CC0) 렌더로 이모지 대체.
//   창작 id → 몬스터 모델 매핑(의미 근접). 미매핑 id는 null → 이모지 폴백.
const CREATURE_IMG = {
  Pig: require('../assets/ui/creatures/Pig.png'),
  Yeti: require('../assets/ui/creatures/Yeti.png'),
  Chicken: require('../assets/ui/creatures/Chicken.png'),
  Deer: require('../assets/ui/creatures/Deer.png'),
  Panda: require('../assets/ui/creatures/Panda.png'),
  Crab: require('../assets/ui/creatures/Crab.png'),
  YellowDragon: require('../assets/ui/creatures/YellowDragon.png'),
  Bat: require('../assets/ui/creatures/Bat.png'),
  Bee: require('../assets/ui/creatures/Bee.png'),
  Cthulhu: require('../assets/ui/creatures/Cthulhu.png'),
  GreenDemon: require('../assets/ui/creatures/GreenDemon.png'),
  Cyclops: require('../assets/ui/creatures/Cyclops.png'),
  Demon: require('../assets/ui/creatures/Demon.png'),
  Ghost: require('../assets/ui/creatures/Ghost.png'),
  Mushroom: require('../assets/ui/creatures/Mushroom.png'),
  Alien_Tall: require('../assets/ui/creatures/Alien_Tall.png'),
  Penguin: require('../assets/ui/creatures/Penguin.png'),
  Skull: require('../assets/ui/creatures/Skull.png'),
};
const PET_MONSTER = {
  P_CAT: 'Pig', P_WOLF: 'Yeti', P_OWL: 'Chicken', P_FOX: 'Deer', P_BEAR: 'Panda', P_TURTLE: 'Crab',
  P_DRAGON: 'YellowDragon', P_PHOENIX: 'Bat', P_UNICORN: 'Bee', P_KRAKEN: 'Cthulhu', P_KIRIN: 'GreenDemon', P_LEVIATHAN: 'Cyclops',
};
const GUARDIAN_MONSTER = {
  G_SALAMANDER: 'Demon', G_UNDINE: 'Ghost', G_SYLPH: 'Mushroom', G_GOLEM: 'Alien_Tall', G_KELPIE: 'Penguin', G_PHOENIX: 'Skull',
};
export function petIcon(id) { const m = id && PET_MONSTER[id]; return (m && CREATURE_IMG[m]) || null; }
export function guardianIcon(id) { const m = id && GUARDIAN_MONSTER[id]; return (m && CREATURE_IMG[m]) || null; }

// 난이도 마커 3D(보석 색상별). 🟢🟡🔴🟣 대체.
const DIFF_IMG = {
  normal: require('../assets/ui/diff/normal.png'),
  hard: require('../assets/ui/diff/hard.png'),
  hell: require('../assets/ui/diff/hell.png'),
  abyss: require('../assets/ui/diff/abyss.png'),
};
export function diffIcon(id) {
  return (id && DIFF_IMG[id]) || null;
}
