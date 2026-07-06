import { isUnlocked, unlockStage } from './unlocks.mjs';
import { MAX_PARTY } from './gameState.mjs';

// ─────────────────────────────────────────────────────────────
// 온보딩 목표 — 다음에 뭘 해야 하는지 state에서 유도한다(코치마크 대신 목표 배너).
// 핵심 루프를 순서대로 가르친다: 레벨업 → 소환 해금 → 팀 구성.
// id는 Concept가 현지화 텍스트를 붙이고, tab은 이동 안내에 쓴다.
// null 반환 = 온보딩 완료(배너 숨김).
// ─────────────────────────────────────────────────────────────

export function nextObjective(state) {
  const units = state.units || [];
  const gachaOpen = isUnlocked(state, 'gacha');

  // 1) 아직 팀 없음 + 소환 미해금 → 레벨업으로 강해져 소환 해금 스테이지 도달
  if (units.length <= 1 && !gachaOpen) {
    return { id: 'level', tab: 'roster', target: unlockStage('gacha') };
  }
  // 2) 소환 열림 + 아직 혼자 → 소환으로 파티원 확보
  if (gachaOpen && units.length <= 1) {
    return { id: 'summon', tab: 'gacha' };
  }
  // 3) 유닛 2+ 인데 편성이 1명 → 파티 편성
  if (units.length >= 2 && (state.party || []).length < Math.min(2, MAX_PARTY)) {
    return { id: 'party', tab: 'roster' };
  }
  // 4) 완료
  return null;
}
