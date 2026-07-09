// ─────────────────────────────────────────────────────────────
// 유닛 스프라이트 레지스트리 — 3D 프리렌더(경로 Y) 스프라이트를 캐릭↔상태로 연결.
//   규격: assets/units/<concept>/<key>/<key>_<state>.png (가로 스트립)
//         docs/ART_PIPELINE_3D.md §4 참조.
//   스프라이트 미배치(현재) → null 반환 → 기존 초상/이모지 폴백(무해).
//   MVP 렌더 도착 시 아래 SHEETS에 require 한 줄씩 추가하면 자동 활성.
// ─────────────────────────────────────────────────────────────

// 예시(주석): 스프라이트가 준비되면 이렇게 등록.
// 'fantasy:knight': {
//   frameW: 128, frameH: 128,
//   idle:   require('../assets/units/fantasy/knight/knight_idle.png'),
//   attack: require('../assets/units/fantasy/knight/knight_attack.png'),
//   hit:    require('../assets/units/fantasy/knight/knight_hit.png'),
//   death:  require('../assets/units/fantasy/knight/knight_death.png'),
// },
const SHEETS = {};

// 캐릭터의 특정 상태 스프라이트 조회. 없으면 null(→ 폴백).
export function unitSprite(conceptId, key, state) {
  const rec = SHEETS[`${conceptId}:${key}`];
  if (!rec || !rec[state]) return null;
  return { source: rec[state], frameW: rec.frameW || 128, frameH: rec.frameH || 128 };
}

// 이 캐릭터가 스프라이트를 갖고 있는지(있으면 SpriteAnim, 없으면 Portrait).
export function hasUnitSprite(conceptId, key) {
  return !!SHEETS[`${conceptId}:${key}`];
}
