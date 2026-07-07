// ─────────────────────────────────────────────────────────────
// 캐릭터 아트 레지스트리 — 진짜 일러스트를 붙이는 단일 지점.
//
// 규격: 512×512 투명 PNG(얼굴~상반신 중앙). 파일 위치:
//   assets/char/<conceptId>/<characterId>.png   (예: assets/char/fantasy/kael.png)
//
// Metro는 "정적" require만 번들한다(동적 경로 불가). 그래서 이미지를 넣은 뒤
// 아래 맵에 한 줄만 추가하면 로스터·파티·소환·도감 전역에 자동 반영된다.
// 등록 안 된 캐릭터는 이모지로 자연스럽게 폴백 → 점진 도입 가능.
//
//   예) 'fantasy:kael': require('../assets/char/fantasy/kael.png'),
//       'scifi:kael':   require('../assets/char/scifi/kael.png'),
// ─────────────────────────────────────────────────────────────

export const CHAR_IMAGES = {
  // ↓ 여기에 등록. (비어 있으면 전부 이모지 폴백)
  // 'fantasy:kael': require('../assets/char/fantasy/kael.png'),
};

// conceptId + characterId → 이미지 소스(require 결과) 또는 null(폴백).
export function charImage(conceptId, characterId) {
  if (!conceptId || !characterId) return null;
  return CHAR_IMAGES[`${conceptId}:${characterId}`] || null;
}
