import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit } from '../core/units.mjs';
import { createGameState } from '../core/gameState.mjs';
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
