import { spend } from './economy.mjs';

// ─────────────────────────────────────────────────────────────
// 유물(Relic) — 계정 단위 영구 성장. 환생 배수와 함께 accountMods로 합산된다.
// 유닛과 무관하게 계정 전체에 곱해지는 배수라, 장기 성장 축을 만든다.
// 3종 유물이 처음부터 존재(레벨 0)하고 currency로 강화한다(성장 재화 싱크).
// ─────────────────────────────────────────────────────────────

export const RELICS = {
  R_POWER: { id: 'R_POWER', kind: 'power', per: 0.03, label: '전투의 성물' }, // 레벨당 +3% 전투력
  R_GOLD: { id: 'R_GOLD', kind: 'currency', per: 0.05, label: '황금 우상' }, // 레벨당 +5% 골드 수입
  R_GROWTH: { id: 'R_GROWTH', kind: 'growth', per: 0.05, label: '정수의 결정' }, // 레벨당 +5% 정수 수입
};

export const RELIC_CAP = 20;

export function relicUpgradeCost(level) {
  return { currency: Math.round(500 * Math.pow(1.5, level)) };
}

export function upgradeRelic(state, id) {
  if (!RELICS[id]) return { ok: false, reason: '알 수 없는 유물' };
  const lv = (state.relics && state.relics[id]) || 0;
  if (lv >= RELIC_CAP) return { ok: false, reason: `강화 상한 ${RELIC_CAP}` };
  const cost = relicUpgradeCost(lv);
  if (!spend(state.wallet, cost)) return { ok: false, reason: '재화 부족', cost };
  state.relics = state.relics || {};
  state.relics[id] = lv + 1;
  return { ok: true, id, level: lv + 1, cost };
}

// 계정 배수 (power / currency / growth). 유물 없으면 전부 1.
export function relicMods(state) {
  let power = 1, currency = 1, growth = 1;
  const owned = state.relics || {};
  for (const [id, lv] of Object.entries(owned)) {
    const r = RELICS[id];
    if (!r || !lv) continue;
    if (r.kind === 'power') power += r.per * lv;
    else if (r.kind === 'currency') currency += r.per * lv;
    else if (r.kind === 'growth') growth += r.per * lv;
  }
  return { power, currency, growth };
}
