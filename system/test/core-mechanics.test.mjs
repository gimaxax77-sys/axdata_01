import { test } from 'node:test';
import assert from 'node:assert/strict';
import { affinity, affinityLabel } from '../core/elements.mjs';
import { createUnit } from '../core/units.mjs';
import { createGameState, getPartyUnits } from '../core/gameState.mjs';
import { earn } from '../core/economy.mjs';
import { collectUnitModifiers } from '../core/modifiers.mjs';
import { equipSkill, enhanceNode } from '../core/character.mjs';
import { craftGear, equipGear } from '../core/gear.mjs';
import { intimacyLevel, intimacyBonus, giveGift, giftCost, INTIMACY_MAX } from '../core/intimacy.mjs';
import { idleGenre } from '../genres/idle.mjs';

test('elements: 상성 순환(가위바위보) + 빛↔어둠', () => {
  assert.equal(affinity('FIRE', 'WOOD'), 1.3, 'FIRE>WOOD 유리');
  assert.equal(affinity('WOOD', 'FIRE'), 0.8, '역은 불리');
  assert.equal(affinity('WATER', 'FIRE'), 1.3, 'WATER>FIRE');
  assert.equal(affinity('LIGHT', 'DARK'), 1.3);
  assert.equal(affinity('DARK', 'LIGHT'), 1.3, '빛·어둠 상호 유리');
  assert.equal(affinity('FIRE', 'LIGHT'), 1, '무관');
  assert.equal(affinity(null, 'FIRE'), 1, '속성 없으면 무관');
  assert.equal(affinityLabel('FIRE', 'WOOD'), '유리');
  assert.equal(affinityLabel('WOOD', 'FIRE'), '불리');
  assert.equal(affinityLabel('FIRE', 'DARK'), '무관');
});

test('modifiers: 스킬·각인·장비가 합산된다', () => {
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { currency: 1e6, growth: 1e6 });
  const u = createUnit('STRIKER', { level: 10, rank: 2 });
  s.units.push(u);
  const base = collectUnitModifiers(u);
  assert.deepEqual(Object.keys(base.statPct).sort(), ['atk', 'def', 'hp', 'spd']);
  equipSkill(s, u.uid, 0, 'BERSERK'); // atk +30%
  const afterSkill = collectUnitModifiers(u);
  assert.ok(afterSkill.statPct.atk >= 0.3, '스킬 statPct 반영');
  enhanceNode(s, u.uid, 'atk'); // 각인 atk
  assert.ok(collectUnitModifiers(u).statPct.atk > afterSkill.statPct.atk, '각인 추가 합산');
  const c = craftGear(s, 'IRON_SWORD'); equipGear(s, u.uid, c.item.uid); // atk flat +120
  assert.ok(collectUnitModifiers(u).statFlat.atk >= 120, '장비 flat 반영');
});

test('intimacy: 선물로 상승, 보너스 스케일, 상한', () => {
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { currency: 1e9 });
  const u = createUnit('SUPPORT', { level: 5, rank: 1 });
  s.units.push(u);
  assert.equal(intimacyLevel(u), 0);
  assert.equal(intimacyBonus(u), 0);
  const r = giveGift(s, u.uid);
  assert.equal(r.ok, true);
  assert.ok(u.intimacy > 0, '친밀도 포인트 상승');
  assert.ok(giftCost(u).currency > 0);
  // 최대까지 선물
  let guard = 0;
  while (intimacyLevel(u) < INTIMACY_MAX && guard++ < 999) { if (!giveGift(s, u.uid).ok) break; }
  assert.equal(intimacyLevel(u), INTIMACY_MAX);
  assert.ok(intimacyBonus(u) > 0, 'MAX에서 보너스 존재');
  assert.equal(giveGift(s, u.uid).ok, false, 'MAX 초과 차단');
});

test('idle: 틱 누적 + 강하면 자동 전진', () => {
  const units = [createUnit('STRIKER', { level: 30, rank: 3 }), createUnit('VANGUARD', { level: 30, rank: 3 })];
  const s = createGameState({ units, party: units.map((u) => u.uid) });
  const t = idleGenre.tick(s, 3600);
  assert.ok(t.gained.currency > 0 && t.clears > 0, '보상 누적');
  assert.ok(s.stage >= 1);
  assert.equal(typeof s.lastTick, 'number');
});

test('idle: 환생은 sqrt(maxStage) 획득·회차 리셋·peakStage 유지', () => {
  const u = createUnit('STRIKER', { level: 20, rank: 2 });
  const s = createGameState({ units: [u], party: [u.uid] });
  s.maxStage = 25; s.stage = 25; s.peakStage = 25;
  const r = idleGenre.prestige(s);
  assert.equal(r.prestigeGained, 5, 'floor(sqrt(25))=5');
  assert.equal(s.stage, 1, '회차 리셋');
  assert.equal(s.maxStage, 1);
  assert.equal(s.peakStage, 25, '역대 최고는 유지');
  assert.equal(s.prestige, 5);
});

test('강화가 실제 수치에 반영: 스킬 레벨·장비 강화 스케일', async () => {
  const { skillPower } = await import('../core/skills.mjs');
  const { createGear, gearContribution } = await import('../core/gear.mjs');
  // 스킬 레벨 배수는 레벨마다 증가
  assert.equal(skillPower(1), 1);
  assert.ok(skillPower(2) > skillPower(1));
  assert.ok(skillPower(10) > skillPower(5));
  // 장비 강화는 flat 기여를 키운다
  const gr = createGear('IRON_SWORD'); // level 1
  const base = gearContribution(gr).flat.atk;
  gr.level = 5;
  assert.ok(gearContribution(gr).flat.atk > base, '강화 레벨↑ → flat↑');
  // 장착 스킬 레벨업이 모디파이어를 키운다
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { currency: 1e9, growth: 1e9 });
  const u = createUnit('STRIKER', { level: 10, rank: 2 });
  s.units.push(u);
  equipSkill(s, u.uid, 0, 'BERSERK');
  const atk1 = collectUnitModifiers(u).statPct.atk;
  u.skills[0].level = 3;
  assert.ok(collectUnitModifiers(u).statPct.atk > atk1, '스킬 레벨↑ → statPct↑');
});

test('팀버프 def/crit: 파티 판정에 실제 반영', async () => {
  const { resolve } = await import('../core/resolution.mjs');
  const { getPartyUnits: gpu } = await import('../core/gameState.mjs');
  const mk = (sig) => {
    const u = createUnit('SUPPORT', { level: 40, rank: 3, signature: sig });
    u.rarity = 'SR'; return u;
  };
  const dealer = () => { const u = createUnit('STRIKER', { level: 40, rank: 3 }); u.rarity = 'SR'; return u; };
  const challenge = { hp: 60000, atk: 900, def: 200, element: null };
  // 팀 치명 버프(빛의 신탁) → dps↑ → 적 처치 빨라짐(margin↑)
  const critParty = [dealer(), mk('SIG_LIGHT_ORACLE')];
  const noneParty = [dealer(), createUnit('SUPPORT', { level: 40, rank: 3 })];
  noneParty[1].rarity = 'SR';
  const rc = resolve(critParty, challenge);
  const rn = resolve(noneParty, challenge);
  assert.ok(rc.partyPower > rn.partyPower, '팀 치명 버프가 파티 파워↑');
  // 팀 방어 버프(조수 성가) → 파티 생존↑(margin↑)
  const defParty = [dealer(), mk('SIG_TIDE_HYMN')];
  const rd = resolve(defParty, challenge);
  assert.ok(rd.margin > rn.margin, '팀 방어 버프가 생존 여유↑');
});

test('장비 세트: 2/3피스 보너스가 모디파이어에 합산', async () => {
  const { gearSetBonus, createGear, GEAR_CATALOG } = await import('../core/gear.mjs');
  const u = createUnit('STRIKER', { level: 10, rank: 2 });
  u.gear = { weapon: createGear('DRAGON_FANG'), armor: null, accessory: null };
  assert.equal(gearSetBonus(u).statPct.atk || 0, 0, '1피스는 미발동');
  u.gear.armor = createGear('BULWARK_PLATE');
  assert.ok(gearSetBonus(u).statPct.atk >= 0.08, '2피스 보너스');
  u.gear.accessory = createGear('OMNI_CHARM');
  const full = gearSetBonus(u);
  assert.ok(full.statPct.atk >= 0.15 && full.effect.critChance >= 0.1, '3피스 풀세트');
});

test('추천 빌드: 빈 스킬 슬롯 채움·더 나은 장비 교체(비파괴)', async () => {
  const { optimizeLoadout } = await import('../core/loadout.mjs');
  const { skillSlots } = await import('../core/skills.mjs');
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { currency: 1e6 });
  const u = createUnit('STRIKER', { level: 20, rank: 2 }); // 슬롯 3개
  s.units.push(u);
  // 슬롯 0에 기존 스킬을 두고 레벨업 → 추천이 이를 보존해야 함
  equipSkill(s, u.uid, 0, 'FORTRESS');
  u.skills[0].level = 4;
  // 인벤토리에 약/강 무기 → 강한 것을 장착해야 함
  const weak = craftGear(s, 'RUNE_BLADE').item; // atk 90
  const strong = craftGear(s, 'IRON_SWORD').item; // atk 120
  const r = optimizeLoadout(s, u.uid);
  assert.equal(r.ok, true);
  // 슬롯0 보존(레벨 유지)
  assert.equal(u.skills[0].id, 'FORTRESS');
  assert.equal(u.skills[0].level, 4, '기존 스킬 레벨 보존');
  // 나머지 슬롯이 채워짐
  assert.equal(u.skills.filter(Boolean).length, skillSlots(u));
  // 더 강한 무기 장착
  assert.equal(u.gear.weapon.uid, strong.uid, '강한 무기 선택');
  assert.ok(r.changed.skills >= 1 && r.changed.gear >= 1);
});

test('gameState: getPartyUnits는 유효 uid만 반환', () => {
  const u = createUnit('STRIKER', { level: 1, rank: 1 });
  const s = createGameState({ units: [u], party: [u.uid, 'ghost'] });
  assert.equal(getPartyUnits(s).length, 1);
});
