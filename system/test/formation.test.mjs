import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit } from '../core/units.mjs';
import { createGameState, getPartyUnits, togglePartyMember } from '../core/gameState.mjs';
import { resolve } from '../core/resolution.mjs';
import { getStage } from '../core/progression.mjs';
import {
  setFormation, toggleFormation, unitRole, formationSummary,
  formationActive, pruneFormation,
} from '../core/formation.mjs';
import { serialize, deserialize } from '../core/save.mjs';

// 전열 1 + 후열 1 파티를 만든다.
function makeParty() {
  const s = createGameState({ units: [], party: [] });
  const a = createUnit('STRIKER', { level: 20, rank: 2 });
  const b = createUnit('VANGUARD', { level: 20, rank: 2 });
  s.units.push(a, b);
  s.party = [a.uid, b.uid];
  return { s, a, b };
}

test('진형: 후열 미지정이면 휴면(하위호환) — 판정 불변', () => {
  const { s } = makeParty();
  const ch = getStage(30).challenge;
  const party = getPartyUnits(s);
  const base = resolve(party, ch, {});
  const withEmpty = resolve(party, ch, {}, s.formation); // formation={} → 후열 0명
  assert.equal(formationActive(s.formation, party), false, '후열 0명 = 비활성');
  assert.equal(withEmpty.duration, base.duration, '휴면 시 동일 판정');
});

test('진형: 후열 배치 시 공격↑ (전열 존재 시 보호)', () => {
  const { s, a, b } = makeParty();
  const ch = getStage(30).challenge;
  const party = getPartyUnits(s);
  const before = resolve(party, ch, {}, s.formation).partyPower;
  setFormation(s, a.uid, 'back'); // a=후열(딜러), b=전열(탱커)
  assert.equal(unitRole(s, a.uid), 'back');
  assert.equal(unitRole(s, b.uid), 'front');
  assert.ok(formationActive(s.formation, party), '후열 1명 = 활성');
  const after = resolve(party, ch, {}, s.formation).partyPower;
  assert.ok(after > before, `후열 딜러 공격 상승 (${before} → ${after})`);
});

test('진형: 전원 후열은 노출 페널티 (공격 보너스 소멸)', () => {
  const { s, a, b } = makeParty();
  const ch = getStage(30).challenge;
  const party = getPartyUnits(s);
  setFormation(s, a.uid, 'back');
  const protectedPow = resolve(party, ch, {}, s.formation).partyPower; // a후열 b전열
  setFormation(s, b.uid, 'back'); // 전열 없음 → 전원 노출
  const exposedPow = resolve(party, ch, {}, s.formation).partyPower;
  assert.ok(exposedPow < protectedPow, '전열 없으면 후열 공격 보너스 상실');
});

test('진형: 토글 · 편성 해제 시 정리', () => {
  const { s, a } = makeParty();
  assert.equal(unitRole(s, a.uid), 'front');
  toggleFormation(s, a.uid);
  assert.equal(unitRole(s, a.uid), 'back');
  toggleFormation(s, a.uid);
  assert.equal(unitRole(s, a.uid), 'front', '다시 전열');
  assert.equal(s.formation[a.uid], undefined, '전열은 저장 안 함');
  // 편성 해제하면 진형에서도 빠진다.
  setFormation(s, a.uid, 'back');
  togglePartyMember(s, a.uid); // 파티에서 제거
  assert.equal(s.formation[a.uid], undefined, '해제 시 진형 정리');
});

test('진형: 미편성 유닛은 지정 거부', () => {
  const { s } = makeParty();
  const lone = createUnit('SUPPORT', { level: 5 });
  s.units.push(lone);
  const r = setFormation(s, lone.uid, 'back');
  assert.equal(r.ok, false, '편성되지 않은 유닛 거부');
});

test('진형: 세이브 왕복 보존 + 미편성 정리', () => {
  const { s, a, b } = makeParty();
  setFormation(s, a.uid, 'back');
  s.formation['u_ghost'] = 'back'; // 파티에 없는 유령 uid
  const loaded = deserialize(serialize(s));
  assert.equal(loaded.formation[a.uid], 'back', '후열 보존');
  assert.equal(loaded.formation['u_ghost'], undefined, '미편성 uid 정리');
  const sum = formationSummary(loaded);
  assert.deepEqual(sum.front, [b.uid]);
  assert.deepEqual(sum.back, [a.uid]);
  assert.equal(sum.active, true);
  assert.equal(sum.exposed, false);
});
