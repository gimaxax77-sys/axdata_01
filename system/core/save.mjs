import { ensureUnitSeq } from './units.mjs';
import { ensureGearSeq } from './gear.mjs';
import { createWallet } from './economy.mjs';

// ─────────────────────────────────────────────────────────────
// 세이브 직렬화 — gameState는 순수 데이터라 JSON으로 그대로 왕복 가능.
// 로드 시 (1) 누락 필드 기본값 보정 (2) uid 시퀀스 동기화를 한다.
// ─────────────────────────────────────────────────────────────

export const SAVE_VERSION = 2;

export function serialize(state) {
  return JSON.stringify({ v: SAVE_VERSION, ts: Date.now(), state });
}

// 누락/구버전 필드 보정 (안전한 로드).
function normalize(state) {
  state.inventory = state.inventory || [];
  state.wallet = { ...createWallet(), ...(state.wallet || {}) };
  state.gacha = state.gacha || { pity: 0 };
  state.stage = state.stage || 1;
  state.maxStage = state.maxStage || 1;
  state.peakStage = state.peakStage || state.maxStage || 1;
  state.energy = state.energy ?? 60;
  state.prestige = state.prestige || 0;
  state.party = state.party || [];
  for (const u of state.units || []) {
    if (!u.skills) u.skills = [null, null, null];
    if (!u.enhance) u.enhance = { atk: 0, hp: 0, def: 0, crit: 0 };
    if (!u.gear) u.gear = { weapon: null, armor: null, accessory: null };
    if (u.characterId === undefined) u.characterId = null;
    if (u.signature === undefined) u.signature = null;
    if (u.element === undefined) u.element = null;
  }
  return state;
}

// uid("u12"/"g3")를 스캔해 시퀀스를 끌어올린다 → 로드 후 신규 생성 충돌 방지.
function syncSeq(state) {
  let maxU = 0, maxG = 0;
  const num = (id, pfx) => parseInt(String(id || '').replace(pfx, ''), 10) || 0;
  for (const u of state.units || []) {
    maxU = Math.max(maxU, num(u.uid, 'u'));
    for (const slot of Object.keys(u.gear || {})) {
      const it = u.gear[slot];
      if (it) maxG = Math.max(maxG, num(it.uid, 'g'));
    }
  }
  for (const it of state.inventory || []) maxG = Math.max(maxG, num(it.uid, 'g'));
  ensureUnitSeq(maxU);
  ensureGearSeq(maxG);
}

// json → state (실패/버전불일치 시 null).
export function deserialize(json) {
  let obj;
  try { obj = JSON.parse(json); } catch { return null; }
  if (!obj || obj.v !== SAVE_VERSION || !obj.state) return null;
  const state = normalize(obj.state);
  syncSeq(state);
  return state;
}
