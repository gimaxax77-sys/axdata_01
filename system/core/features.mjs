// 기능 플래그 — 선택 모듈 on/off (단순 코어 + 옵션 모듈 구조)
// 기본값은 전부 on = 기존 '풀 모드' 동작 그대로(비파괴). 최소 코어는 여기 없다(항상 켜짐).
// 각 선택 모듈은 진입점에서 isOn('key') 로 확인해 off면 스킵한다.

export const FEATURES = {
  elements: true,   // 속성 상성·시너지
  rarity: true,     // 등급(N~UR) 품질 — 캐릭터/장비/펫/룬/유물 공통
  gacha: true,
  gear: true,
  pets: true,
  runes: true,
  relics: true,
  emblems: true,
  guardians: true,
  costumes: true,
  arena: true,
  guild: true,
  season: true,
  events: true,
  tower: true,
  summon: true,
  sigweapon: true,
  intimacy: true,
  shop: true,
};

// 선택 모듈이 켜져 있는지. 코어(플래그 없는 키)는 항상 true.
export function isOn(key) {
  return FEATURES[key] !== false;
}

// 단순 코어 프리셋 — 최소 코어 외 선택 모듈을 전부 끈다.
export function simplePreset() {
  const f = {};
  for (const k of Object.keys(FEATURES)) f[k] = false;
  return f;
}
