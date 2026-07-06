// ─────────────────────────────────────────────────────────────
// 콘텐츠 게이팅 — 기능별 해금 요구 스테이지(peakStage 기준).
// 문서 권장(소환20 · 골드던전30 · 강화석던전50 · 펫100 · 아레나200 · 길드300)은
// 더 긴 수명을 가정. 본 빌드 곡선(7일 ≈ 57층)에 맞춰 실제 경험되도록 조정했다.
// 값은 데이터라 언제든 프로덕션 수치로 바꿀 수 있다.
// ─────────────────────────────────────────────────────────────

export const UNLOCKS = {
  gacha: 12,          // 소환
  dungeonGold: 20,    // 골드 던전
  dungeonEssence: 35, // 정수(강화석) 던전
  pets: 45,           // 펫
  arena: 55,          // 아레나 (경쟁)
  guild: 75,          // 길드 (경쟁)
};

export function unlockStage(feature) {
  return UNLOCKS[feature] ?? 0;
}
export function isUnlocked(state, feature) {
  return (state.peakStage || 1) >= unlockStage(feature);
}
