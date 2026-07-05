import { resolve } from '../core/resolution.mjs';
import { getStage } from '../core/progression.mjs';
import { getPartyUnits } from '../core/gameState.mjs';
import { earn } from '../core/economy.mjs';
import { BALANCE } from '../core/balance.mjs';

// ─────────────────────────────────────────────────────────────
// 장르 어댑터: 방치형 (자동/누적형)
// 시간이 스스로 굴러간다. 현재 스테이지를 자동 반복 클리어하며
// 초당 보상을 누적하고, 충분히 강하면 자동으로 다음 스테이지로 전진.
// 오프라인(큰 dt) 누적과 환생(prestige)을 지원한다.
//
// 핵심: RPG와 "완전히 같은" resolve()를 쓰되, win 대신 duration을 쓴다.
// ─────────────────────────────────────────────────────────────

const OFFLINE_CAP_SEC = 8 * 3600; // 오프라인 보상 상한 8시간
// 현재 스테이지를 이 시간 안에 클리어할 만큼 강하면 "여유 있음"으로 보고
// 다음 스테이지로 전진한다. 벽(=이 값보다 오래 걸림)에 닿으면 거기서 파밍.
const AUTO_ADVANCE_MARGIN = 2.5; // 초

export const idleGenre = {
  id: 'idle',
  name: '방치형 (자동)',

  // dtSeconds 만큼 시간을 진행시키고 누적 보상을 반환.
  tick(state, dtSeconds) {
    let remaining = Math.min(dtSeconds, OFFLINE_CAP_SEC);
    const party = getPartyUnits(state);
    const gained = { currency: 0, growth: 0 };
    let clears = 0;

    // 시간 예산이 남는 동안 현재 스테이지를 반복
    while (remaining > 0) {
      const stageDef = getStage(state.stage);
      const result = resolve(party, stageDef.challenge);

      if (!result.win || result.duration === Infinity) break; // 벽에 막힘

      // 다음 스테이지가 너무 쉬우면 전진 (성장에 따른 자동 진행)
      if (result.duration <= AUTO_ADVANCE_MARGIN) {
        state.stage += 1;
        state.maxStage = Math.max(state.maxStage, state.stage);
        continue;
      }

      if (result.duration > remaining) break; // 한 판 돌릴 시간도 없음

      remaining -= result.duration;
      clears += 1;
      gained.currency += stageDef.rewards.currency;
      gained.growth += stageDef.rewards.growth;
    }

    // 환생 영구 보너스: 방치 수입 × (1 + prestige × 보너스)
    const mult = 1 + (state.prestige || 0) * BALANCE.prestigeIncomeBonus;
    gained.currency = Math.round(gained.currency * mult);
    gained.growth = Math.round(gained.growth * mult);

    earn(state.wallet, gained);
    state.lastTick = Date.now();
    return { clears, gained, stage: state.stage };
  },

  // 실제 경과 시간으로 오프라인 보상 정산
  collectOffline(state, nowMs = Date.now()) {
    if (!state.lastTick) {
      state.lastTick = nowMs;
      return { clears: 0, gained: { currency: 0, growth: 0 }, stage: state.stage };
    }
    const dt = (nowMs - state.lastTick) / 1000;
    return this.tick(state, dt);
  },

  // 환생: 진행도를 초기화하고 영구 배수를 얻는다 (방치형 전용 루프)
  prestige(state) {
    const gain = Math.floor(Math.sqrt(state.maxStage));
    state.prestige += gain;
    state.stage = 1;
    return { prestigeGained: gain, totalPrestige: state.prestige };
  },
};
