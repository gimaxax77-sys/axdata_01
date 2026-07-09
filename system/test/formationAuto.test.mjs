import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit } from '../core/units.mjs';
import { createGameState, autoParty, MAX_PARTY } from '../core/gameState.mjs';
import { computePower } from '../core/stats.mjs';
import { autoFormation, unitRole, ROLE_CAP, formationSummary } from '../core/formation.mjs';
import { savePreset, loadPreset, presetInfo, listPresetInfo, clearPreset, PRESET_SLOTS } from '../core/partyPresets.mjs';
import { serialize, deserialize } from '../core/save.mjs';

function makeState(n, arch = 'STRIKER') {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: n }, () => createUnit(arch, { level: 20, rank: 2 }));
  s.units.push(...units);
  s.party = units.map((u) => u.uid);
  return { s, units };
}

test('자동배치: 정원(2·3·2)을 지키고 전원 배치한다', () => {
  const { s } = makeState(7);
  const r = autoFormation(s);
  assert.equal(r.ok, true);
  const sum = formationSummary(s);
  assert.equal(sum.front.length, ROLE_CAP.front);
  assert.equal(sum.mid.length, ROLE_CAP.mid);
  assert.equal(sum.back.length, ROLE_CAP.back);
});

test('자동배치: 탱커(VANGUARD)는 전열, 딜러(STRIKER)는 후열 우선', () => {
  const s = createGameState({ units: [], party: [] });
  const tank = createUnit('VANGUARD', { level: 30, rank: 3 }); // 방어 원형
  const dps = createUnit('STRIKER', { level: 30, rank: 3 }); // 공격 원형
  s.units.push(tank, dps);
  s.party = [tank.uid, dps.uid];
  autoFormation(s);
  assert.equal(unitRole(s, tank.uid), 'front', '탱커가 전열로');
  assert.equal(unitRole(s, dps.uid), 'back', '딜러가 후열로');
});

test('자동배치: 인원이 적어도(정원 미달) 실패하지 않는다', () => {
  const { s } = makeState(2);
  const r = autoFormation(s);
  assert.equal(r.ok, true);
  assert.equal(r.front.length + r.mid.length + r.back.length, 2);
});

test('자동배치: 편성 없으면 실패', () => {
  const s = createGameState({ units: [], party: [] });
  const r = autoFormation(s);
  assert.equal(r.ok, false);
});

test('autoParty: 보유 유닛 중 전투력 상위 MAX_PARTY명을 편성한다', () => {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: 10 }, (_, i) => createUnit('STRIKER', { level: 5 + i * 3, rank: 1 }));
  s.units.push(...units);
  s.party = [units[0].uid]; // 최초엔 1명만 편성된 상태(신규 유저 기본값)
  const r = autoParty(s);
  assert.equal(r.ok, true);
  assert.equal(s.party.length, Math.min(MAX_PARTY, units.length));
  // 상위 전투력 순으로 뽑혔는지 확인.
  const byPower = units.slice().sort((a, b) => computePower(b) - computePower(a)).slice(0, MAX_PARTY).map((u) => u.uid);
  assert.deepEqual(new Set(s.party), new Set(byPower));
});

test('autoParty: 보유 유닛이 없으면 실패', () => {
  const s = createGameState({ units: [], party: [] });
  assert.equal(autoParty(s).ok, false);
});

test('autoParty: 삼위일체(3원형) 시너지를 위해 순수 전투력 최상위가 아닌 조합을 고른다', () => {
  const s = createGameState({ units: [], party: [] });
  // VANGUARD/SUPPORT를 STRIKER와 거의 동급(근소하게만 낮은) 전투력으로 투자해둔 상태.
  // 순수 top-7(전투력만)이면 근소한 차이로 밀려 STRIKER 7명만 뽑히지만,
  // 삼위일체(+전 스탯 12%)를 포함하면 총합이 더 커야 한다.
  const strikers = Array.from({ length: 7 }, () => createUnit('STRIKER', { level: 40, rank: 3 }));
  const vanguard = createUnit('VANGUARD', { level: 47, rank: 3 }); // STRIKER보다 근소하게 약함
  const support = createUnit('SUPPORT', { level: 76, rank: 3 }); // STRIKER보다 근소하게 약함
  s.units.push(...strikers, vanguard, support);
  s.party = [strikers[0].uid];
  const r = autoParty(s);
  assert.equal(r.ok, true);
  assert.ok(s.party.includes(support.uid), 'SUPPORT가 근소하게 약해도 삼위일체를 위해 포함됨');
  assert.ok(s.party.includes(vanguard.uid), 'VANGUARD도 포함됨');
  assert.ok(r.synergy.includes('삼위일체'), '삼위일체 시너지가 실제로 반영됨');
});

test('autoParty: 단일 원형만 보유하면 기존과 동일하게 전투력 상위로 채운다', () => {
  const { s, units } = makeState(10);
  const r = autoParty(s);
  assert.equal(r.ok, true);
  const byPower = units.slice().sort((a, b) => computePower(b) - computePower(a)).slice(0, MAX_PARTY).map((u) => u.uid);
  assert.deepEqual(new Set(s.party), new Set(byPower), '시너지 후보가 없으면 기준선(전투력 상위)과 동일');
});

test('자동배치 버튼 흐름: 1명만 편성된 상태에서도 autoParty+autoFormation으로 전원 배치된다', () => {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: 7 }, () => createUnit('STRIKER', { level: 20, rank: 2 }));
  s.units.push(...units);
  s.party = [units[0].uid]; // 사용자가 보고한 상황 재현: 파티에 1명뿐
  autoParty(s);
  const r = autoFormation(s);
  assert.equal(r.ok, true);
  const sum = formationSummary(s);
  assert.equal(sum.front.length + sum.mid.length + sum.back.length, 7, '보유한 7명 전원이 배치됨');
});

test('프리셋: 저장 → 파티 변경 → 불러오기로 복원', () => {
  const { s, units } = makeState(3);
  autoFormation(s);
  const savedFormation = { ...s.formation };
  const r1 = savePreset(s, 1);
  assert.equal(r1.ok, true);
  assert.equal(presetInfo(s, 1).exists, true);
  // 파티를 다르게 바꾼다.
  s.party = [units[0].uid];
  s.formation = {};
  const r2 = loadPreset(s, 1);
  assert.equal(r2.ok, true);
  assert.equal(r2.applied, 3);
  assert.deepEqual(new Set(s.party), new Set(units.map((u) => u.uid)));
  assert.deepEqual(s.formation, savedFormation);
});

test('프리셋: 슬롯 범위(1~5) 및 빈 파티 저장 거부', () => {
  const { s } = makeState(2);
  assert.equal(savePreset(s, 0).ok, false);
  assert.equal(savePreset(s, 6).ok, false);
  const empty = createGameState({ units: [], party: [] });
  assert.equal(savePreset(empty, 1).ok, false);
  assert.equal(PRESET_SLOTS, 5);
});

test('프리셋: 없는 슬롯 불러오기는 실패', () => {
  const { s } = makeState(2);
  const r = loadPreset(s, 3);
  assert.equal(r.ok, false);
});

test('프리셋: 분해되어 사라진 유닛은 불러오기 시 자동 제외', () => {
  const { s, units } = makeState(3);
  savePreset(s, 2);
  // 유닛 하나가 이후 분해(제거)됨.
  s.units = s.units.filter((u) => u.uid !== units[0].uid);
  const r = loadPreset(s, 2);
  assert.equal(r.ok, true);
  assert.equal(r.applied, 2);
  assert.equal(r.missing, 1);
  assert.equal(s.party.includes(units[0].uid), false);
});

test('프리셋: 목록 조회 + 슬롯 삭제', () => {
  const { s } = makeState(2);
  savePreset(s, 1);
  savePreset(s, 5);
  const list = listPresetInfo(s);
  assert.equal(list.length, 5);
  assert.equal(list[0].exists, true);
  assert.equal(list[4].exists, true);
  assert.equal(list[1].exists, false);
  clearPreset(s, 1);
  assert.equal(presetInfo(s, 1).exists, false);
});

test('프리셋: 세이브 왕복 보존', () => {
  const { s } = makeState(2);
  savePreset(s, 4);
  const loaded = deserialize(serialize(s));
  assert.equal(presetInfo(loaded, 4).exists, true);
});
