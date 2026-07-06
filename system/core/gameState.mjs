import { createWallet } from './economy.mjs';

// ─────────────────────────────────────────────────────────────
// 게임 상태(세이브) — IP의 지속 자산.
// 장르도 컨셉도 여기 없다. 순수하게 "무엇을 가졌고 어디까지 왔나".
// 같은 상태 객체를 RPG 어댑터에도, 방치형 어댑터에도 그대로 넣을 수 있다.
// ─────────────────────────────────────────────────────────────

export function createGameState({ units = [], party = [] } = {}) {
  return {
    units, // 보유 유닛 인스턴스 배열
    party, // 편성된 유닛 uid 배열 (최대 정책은 장르가 정함)
    inventory: [], // 미장착 장비 인스턴스 배열
    wallet: createWallet(),
    stage: 1, // 현재 도전/진행 스테이지 (환생 시 리셋)
    maxStage: 1, // 이번 회차 최고 도달 (환생 시 리셋)
    peakStage: 1, // 역대 최고 도달 (환생해도 유지 — 실제 진행도)
    energy: 60, // RPG 장르가 사용하는 행동력 (방치형은 무시)
    prestige: 0, // 방치형 장르가 사용하는 환생 횟수 (RPG는 무시)
    lastTick: null, // 방치형 오프라인 계산 기준 시각(ms)
    gacha: { pity: 0 }, // 소환 천장 카운터
    // 일일 콘텐츠(출석·미션·던전) 상태
    daily: { epochDay: 0, streak: 0, claimedDay: -1, missions: { summon: 0, upgrade: 0, dungeon: 0 }, claimed: {}, dungeon: { GOLD: 0, ESSENCE: 0 }, ads: {} },
    relics: {}, // 유물 id → 레벨
    pets: { owned: {}, active: [] }, // 펫 보유(id→레벨) + 장착(최대 3)
    shop: { purchased: {} }, // 1회성 패키지 구매 기록
  };
}

// party uid → 유닛 인스턴스 배열
export function getPartyUnits(state) {
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  return state.party.map((uid) => byId.get(uid)).filter(Boolean);
}
