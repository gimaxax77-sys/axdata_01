// ─────────────────────────────────────────────────────────────
// 스테이지 진행 사다리 — 장르/컨셉 무관.
// 스테이지 n이 오를수록 적이 강해지고 보상이 커진다.
// 무한 스테이지를 공식으로 생성(데이터 테이블 대신 함수형).
// ─────────────────────────────────────────────────────────────

const BASE = { hp: 900, atk: 70, def: 30 };
const ENEMY_GROWTH = 1.14; // 스테이지당 적 강화율
const REWARD_GROWTH = 1.12; // 스테이지당 보상 증가율

// stage: 1부터 시작하는 정수
export function getStage(stage) {
  const g = Math.pow(ENEMY_GROWTH, stage - 1);
  return {
    stage,
    challenge: {
      hp: Math.round(BASE.hp * g),
      atk: Math.round(BASE.atk * g),
      def: Math.round(BASE.def * g),
    },
    rewards: {
      // 컨셉 무관한 자원 키. 컨셉이 표시명을 붙인다.
      currency: Math.round(20 * Math.pow(REWARD_GROWTH, stage - 1)),
      growth: Math.round(8 * Math.pow(REWARD_GROWTH, stage - 1)),
    },
  };
}
