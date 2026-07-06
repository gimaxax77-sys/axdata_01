// ─────────────────────────────────────────────────────────────
// 스테이지 진행 사다리 — 장르/컨셉 무관.
// 스테이지 n이 오를수록 적이 강해지고 보상이 커진다.
// 무한 스테이지를 공식으로 생성(데이터 테이블 대신 함수형).
//
// 밸런스 상수는 core/balance.mjs 에 모여 있다 (시뮬레이터가 튜닝).
// ─────────────────────────────────────────────────────────────

import { BALANCE } from './balance.mjs';
import { ELEMENTS } from './elements.mjs';
export { BALANCE }; // 하위호환: 기존 import 경로 유지

// stage: 1부터 시작하는 정수
export function getStage(stage) {
  const g = Math.pow(BALANCE.enemyGrowth, stage - 1);
  const r = Math.pow(BALANCE.rewardGrowth, stage - 1);
  return {
    stage,
    challenge: {
      hp: Math.round(BALANCE.enemyBase.hp * g),
      atk: Math.round(BALANCE.enemyBase.atk * g),
      def: Math.round(BALANCE.enemyBase.def * g),
      element: ELEMENTS[(stage - 1) % ELEMENTS.length], // 스테이지마다 속성 순환
    },
    rewards: {
      // 컨셉 무관한 자원 키. 컨셉이 표시명을 붙인다.
      currency: Math.round(BALANCE.rewardBase.currency * r),
      growth: Math.round(BALANCE.rewardBase.growth * r),
    },
  };
}
