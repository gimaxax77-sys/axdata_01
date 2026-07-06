import { earn } from './economy.mjs';
import { getStage } from './progression.mjs';

// ─────────────────────────────────────────────────────────────
// 일일 콘텐츠 — 출석 · 일일 미션 · 던전. (장르/컨셉 무관)
// 자원 faucet: 특히 소환권(summon)을 공급해 수집 루프를 돌린다.
// 하루 경계는 UTC epoch-day 기준.
// ─────────────────────────────────────────────────────────────

export function epochDay(now = Date.now()) {
  return Math.floor(now / 86400000);
}

// 출석 7일 순환 보상
export const ATTENDANCE = [
  { currency: 500 }, { growth: 300 }, { summon: 20 }, { currency: 1000 },
  { growth: 600 }, { summon: 30 }, { summon: 60 },
];

// 일일 미션
export const MISSIONS = [
  { id: 'summon', label: '소환 1회', goal: 1, reward: { growth: 300 } },
  { id: 'upgrade', label: '캐릭터 강화 5회', goal: 5, reward: { summon: 20 } },
  { id: 'dungeon', label: '던전 3회', goal: 3, reward: { currency: 800 } },
];

// 던전: 자원별 파밍. 하루 입장 제한.
export const DUNGEONS = {
  GOLD: { resource: 'currency', entriesPerDay: 3 },
  ESSENCE: { resource: 'growth', entriesPerDay: 3 },
};

// 하루가 바뀌면 미션/던전 초기화 (출석 streak은 유지).
export function refreshDaily(state, now = Date.now()) {
  const d = epochDay(now);
  const dl = state.daily;
  if (dl.epochDay !== d) {
    dl.epochDay = d;
    dl.missions = { summon: 0, upgrade: 0, dungeon: 0 };
    dl.claimed = {};
    dl.dungeon = { GOLD: 0, ESSENCE: 0 };
  }
}

// ── 출석 ──────────────────────────────────────────────────────
export function canClaimAttendance(state, now = Date.now()) {
  refreshDaily(state, now);
  return state.daily.claimedDay !== epochDay(now);
}
export function claimAttendance(state, now = Date.now()) {
  if (!canClaimAttendance(state, now)) return { ok: false, reason: '오늘 이미 수령' };
  const idx = state.daily.streak % ATTENDANCE.length;
  const reward = ATTENDANCE[idx];
  earn(state.wallet, reward);
  state.daily.streak += 1;
  state.daily.claimedDay = epochDay(now);
  return { ok: true, reward, day: idx + 1, streak: state.daily.streak };
}

// ── 미션 ──────────────────────────────────────────────────────
export function recordMission(state, key, n = 1, now = Date.now()) {
  refreshDaily(state, now);
  state.daily.missions[key] = (state.daily.missions[key] || 0) + n;
}
export function missionList(state, now = Date.now()) {
  refreshDaily(state, now);
  return MISSIONS.map((m) => {
    const progress = Math.min(state.daily.missions[m.id] || 0, m.goal);
    const claimed = !!state.daily.claimed[m.id];
    return { ...m, progress, done: progress >= m.goal, claimed };
  });
}
export function claimMission(state, id) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) return { ok: false };
  const progress = state.daily.missions[m.id] || 0;
  if (progress < m.goal) return { ok: false, reason: '미완료' };
  if (state.daily.claimed[m.id]) return { ok: false, reason: '이미 수령' };
  earn(state.wallet, m.reward);
  state.daily.claimed[m.id] = true;
  return { ok: true, reward: m.reward };
}

// ── 던전 ──────────────────────────────────────────────────────
export function dungeonEntriesLeft(state, type, now = Date.now()) {
  refreshDaily(state, now);
  return DUNGEONS[type].entriesPerDay - (state.daily.dungeon[type] || 0);
}
export function enterDungeon(state, type, now = Date.now()) {
  if (dungeonEntriesLeft(state, type, now) <= 0) return { ok: false, reason: '입장 횟수 소진' };
  const res = DUNGEONS[type].resource;
  // 즉시 대량 보상: 현재 진행도(peakStage) 보상 × 40
  const amount = Math.round(getStage(state.peakStage).rewards[res] * 40);
  earn(state.wallet, { [res]: amount });
  state.daily.dungeon[type] = (state.daily.dungeon[type] || 0) + 1;
  recordMission(state, 'dungeon', 1, now);
  return { ok: true, amount, resource: res };
}
