import { equippableSkills, skillSlots } from './skills.mjs';
import { GEAR_SLOTS, gearContribution, equipGear } from './gear.mjs';
import { RUNE_SLOTS, runeMainValue, equipRune } from './runes.mjs';
import { equipSkill } from './character.mjs';

// ─────────────────────────────────────────────────────────────
// 추천 빌드 — 보유 자원 중 최적 조합을 한 번에 장착하는 QoL.
//   · 비파괴적: 빈 스킬 슬롯만 채우고(기존 선택·레벨 보존),
//     장비·룬은 "보유분 중 더 나은 것"으로만 교체(밀려난 것은 회수).
//   · 원형별 가중치로 딜러/탱커/서포터에 맞는 스킬을 고른다.
// ─────────────────────────────────────────────────────────────

const ROLE_W = {
  VANGUARD: { atk: 0.7, hp: 1.1, def: 1.1, spd: 0.6, effect: 0.8, team: 1.0 },
  STRIKER: { atk: 1.2, hp: 0.4, def: 0.4, spd: 0.9, effect: 1.0, team: 1.0 },
  SUPPORT: { atk: 0.6, hp: 0.9, def: 0.8, spd: 0.7, effect: 0.9, team: 1.4 },
};
function weights(unit) { return ROLE_W[unit.archetype] || ROLE_W.STRIKER; }

function effectSum(e = {}) {
  return (e.critChance || 0) + (e.critDamage || 0) + (e.lifesteal || 0) + (e.defPierce || 0);
}
function skillScore(skill, w) {
  const p = skill.statPct || {};
  const tb = skill.teamBuff || {};
  const team = (tb.atk || 0) + (tb.def || 0) + (tb.critChance || 0);
  return (p.atk || 0) * w.atk + (p.hp || 0) * w.hp + (p.def || 0) * w.def + (p.spd || 0) * w.spd
    + effectSum(skill.effect) * w.effect + team * w.team;
}
// 장비 flat은 스탯 규모가 달라 정규화(hp/40)해서 합산. 부옵션 statPct/effect도 반영.
function gearScore(item, w) {
  const c = gearContribution(item);
  const f = c.flat;
  const p = c.statPct || {};
  return (f.atk || 0) * w.atk + ((f.hp || 0) / 40) * w.hp + (f.def || 0) * w.def
    + (f.spd || 0) * w.spd + effectSum(c.effect) * 120 * w.effect
    + ((p.atk || 0) + (p.hp || 0) + (p.def || 0) + (p.spd || 0)) * 200; // 부옵션 statPct 가중
}

// 한 유닛의 스킬·장비·룬을 추천값으로 장착. { ok, changed:{skills,gear,runes} }.
export function optimizeLoadout(state, unitUid) {
  const unit = state.units.find((u) => u.uid === unitUid);
  if (!unit) return { ok: false, reason: '유닛 없음' };
  const w = weights(unit);
  const changed = { skills: 0, gear: 0, runes: 0 };

  // 1) 스킬 — 빈 슬롯만 최고 점수의 미장착 스킬로 채운다(기존 슬롯·레벨 보존).
  const slots = skillSlots(unit);
  const used = new Set((unit.skills || []).filter(Boolean).map((s) => s.id));
  const ranked = equippableSkills()
    .filter((s) => !used.has(s.id))
    .sort((a, b) => skillScore(b, w) - skillScore(a, w));
  let ri = 0;
  for (let i = 0; i < slots; i++) {
    if (unit.skills[i]) continue;
    const s = ranked[ri++];
    if (!s) break;
    if (equipSkill(state, unitUid, i, s.id).ok) changed.skills++;
  }

  // 2) 장비 — 슬롯별 인벤토리 최고 후보가 장착품보다 나으면 교체.
  for (const slot of GEAR_SLOTS) {
    const cands = state.inventory.filter((g) => g.slot === slot);
    if (!cands.length) continue;
    const best = cands.reduce((a, b) => (gearScore(b, w) > gearScore(a, w) ? b : a));
    const equipped = unit.gear[slot];
    if (!equipped || gearScore(best, w) > gearScore(equipped, w)) {
      if (equipGear(state, unitUid, best.uid).ok) changed.gear++;
    }
  }

  // 3) 룬 — 슬롯별 가방 최고 메인값이 장착품보다 크면 교체.
  for (let i = 0; i < RUNE_SLOTS; i++) {
    const bag = state.runeBag || [];
    if (!bag.length) continue;
    const best = bag.reduce((a, b) => (runeMainValue(b) > runeMainValue(a) ? b : a));
    const equipped = (unit.runes || [])[i];
    if (!equipped || runeMainValue(best) > runeMainValue(equipped)) {
      if (equipRune(state, unitUid, i, best.uid).ok) changed.runes++;
    }
  }

  return { ok: true, changed };
}
