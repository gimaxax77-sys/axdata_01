import { ensureUnitSeq } from './units.mjs';
import { ensureGearSeq } from './gear.mjs';
import { ensureRuneSeq } from './runes.mjs';
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
  state.runeBag = state.runeBag || [];
  state.wallet = { ...createWallet(), ...(state.wallet || {}) };
  state.gacha = state.gacha || { pity: 0 };
  state.relics = state.relics || {};
  state.pets = state.pets || { owned: {}, active: [] };
  state.pets.owned = state.pets.owned || {};
  state.pets.active = state.pets.active || [];
  state.daily = state.daily || {};
  state.daily.epochDay = state.daily.epochDay || 0;
  state.daily.streak = state.daily.streak || 0;
  state.daily.claimedDay = state.daily.claimedDay ?? -1;
  state.daily.missions = state.daily.missions || { summon: 0, upgrade: 0, dungeon: 0 };
  state.daily.claimed = state.daily.claimed || {};
  state.daily.dungeon = state.daily.dungeon || { GOLD: 0, ESSENCE: 0 };
  state.daily.ads = state.daily.ads || {};
  state.shop = state.shop || { purchased: {} };
  state.shop.purchased = state.shop.purchased || {};
  state.arena = state.arena || { points: 0, day: -1, entries: 0 };
  state.arena.points = state.arena.points || 0;
  state.arena.day = state.arena.day ?? -1;
  state.arena.entries = state.arena.entries || 0;
  state.guild = state.guild || { coins: 0, day: -1, attacks: 0, tier: 1, bossHp: null };
  state.guild.coins = state.guild.coins || 0;
  state.guild.day = state.guild.day ?? -1;
  state.guild.attacks = state.guild.attacks || 0;
  state.guild.tier = state.guild.tier || 1;
  if (state.guild.bossHp === undefined) state.guild.bossHp = null;
  state.stage = state.stage || 1;
  state.maxStage = state.maxStage || 1;
  state.peakStage = state.peakStage || state.maxStage || 1;
  state.energy = state.energy ?? 60;
  state.prestige = state.prestige || 0;
  state.party = state.party || [];
  // 파티가 비었거나 보유하지 않은 uid만 남았다면 최소 1명 보정.
  const owned = new Set((state.units || []).map((u) => u.uid));
  state.party = state.party.filter((uid) => owned.has(uid));
  if (state.party.length === 0 && state.units && state.units.length) {
    state.party = [state.units[0].uid];
  }
  for (const u of state.units || []) {
    if (!u.skills) u.skills = [null, null, null];
    if (!u.enhance) u.enhance = { atk: 0, hp: 0, def: 0, crit: 0 };
    if (!u.gear) u.gear = { weapon: null, armor: null, accessory: null };
    if (u.characterId === undefined) u.characterId = null;
    if (u.signature === undefined) u.signature = null;
    if (u.element === undefined) u.element = null;
    if (u.intimacy === undefined) u.intimacy = 0;
    if (u.costume === undefined) u.costume = null;
    if (!u.costumeBonus) u.costumeBonus = {};
    if (!u.sigWeapon) u.sigWeapon = { level: 0 };
    if (u.sigAwaken === undefined) u.sigAwaken = 0;
    if (!u.runes) u.runes = [null, null, null];
  }
  return state;
}

// uid("u12"/"g3")를 스캔해 시퀀스를 끌어올린다 → 로드 후 신규 생성 충돌 방지.
function syncSeq(state) {
  let maxU = 0, maxG = 0, maxR = 0;
  const num = (id, pfx) => parseInt(String(id || '').replace(pfx, ''), 10) || 0;
  for (const u of state.units || []) {
    maxU = Math.max(maxU, num(u.uid, 'u'));
    for (const slot of Object.keys(u.gear || {})) {
      const it = u.gear[slot];
      if (it) maxG = Math.max(maxG, num(it.uid, 'g'));
    }
    for (const r of u.runes || []) if (r) maxR = Math.max(maxR, num(r.uid, 'r'));
  }
  for (const it of state.inventory || []) maxG = Math.max(maxG, num(it.uid, 'g'));
  for (const r of state.runeBag || []) maxR = Math.max(maxR, num(r.uid, 'r'));
  ensureUnitSeq(maxU);
  ensureGearSeq(maxG);
  ensureRuneSeq(maxR);
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
