// 원정(로그라이트) 런 검증 — 진행·소모전·패배종료·보상·세이브 왕복
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../core/gameState.mjs';
import { createUnit } from '../core/units.mjs';
import { serialize, deserialize } from '../core/save.mjs';
import { startRun, fightNode, pickBoon, endRun, currentNode, RUN_NODES } from '../core/run.mjs';

// 강한 파티(층1 노드를 압도) — 큰 margin으로 낮은 소모 → 완주 가능.
function strongState(n = 5) {
  const units = Array.from({ length: n }, () =>
    createUnit('STRIKER', { level: 80, rank: 5, signature: 'SIG_FLAME_EDGE' }));
  return createGameState({ units, party: units.map((u) => u.uid) });
}

test('startRun: 파티 없으면 실패, 있으면 활성 런 생성', () => {
  const empty = createGameState({ units: [], party: [] });
  assert.equal(startRun(empty).ok, false);

  const s = strongState();
  const r = startRun(s, { floor: 1 });
  assert.ok(r.ok);
  assert.equal(s.run.status, 'active');
  assert.equal(s.run.nodes.length, RUN_NODES);
  assert.equal(s.run.idx, 0);
  assert.equal(s.run.runHP, 1);
  assert.ok(currentNode(s));
});

test('fightNode 승리: 진행 + 생명 소모 + 보상 3택 제시', () => {
  const s = strongState();
  startRun(s, { floor: 1 });
  const res = fightNode(s, () => 0);
  assert.ok(res.ok && res.win);
  assert.equal(s.run.idx, 1);
  assert.ok(s.run.runHP < 1, '승리 후 생명이 소모돼야 함');
  assert.equal(res.offer.length, 3);
  // 보상 선택 전에는 다음 전투 불가
  assert.equal(fightNode(s, () => 0).ok, false);
});

test('pickBoon: 회복 boon이 생명 복구, offer 해제', () => {
  const s = strongState();
  startRun(s, { floor: 1 });
  fightNode(s, () => 0);
  const before = s.run.runHP;
  // mend(생명+30%)를 강제 제시 후 선택
  s.run.offer = ['mend'];
  const p = pickBoon(s, 'mend');
  assert.ok(p.ok);
  assert.ok(s.run.runHP >= before, '회복 boon 후 생명이 줄지 않아야 함');
  assert.equal(s.run.offer, null);
});

test('패배: 감당 못할 난이도면 런 종료(dead)', () => {
  const s = strongState();
  startRun(s, { floor: 50 }); // 극악 난이도
  const res = fightNode(s, () => 0);
  assert.ok(res.ok);
  assert.equal(res.win, false);
  assert.equal(s.run.status, 'dead');
  assert.ok(res.ended);
});

test('완주 루프 → won, endRun이 보상 지급 + 런 비움', () => {
  const s = strongState();
  const gem0 = s.wallet.gem;
  startRun(s, { floor: 1 });
  let guard = 0;
  while (s.run && s.run.status === 'active' && guard++ < 60) {
    if (s.run.offer) pickBoon(s, s.run.offer[0]);
    else fightNode(s, () => 0);
  }
  assert.equal(s.run.status, 'won');
  assert.equal(s.run.idx, RUN_NODES);
  const sum = endRun(s);
  assert.ok(sum.ok && sum.won);
  assert.equal(sum.cleared, RUN_NODES);
  assert.ok(s.wallet.gem > gem0, '보상 젬이 지갑에 지급돼야 함');
  assert.equal(s.run, null, '정산 후 런이 비워져야 함');
});

test('boon 심화: 보호막은 소모전 1회 무효', () => {
  const s = strongState();
  startRun(s, { floor: 1 });
  fightNode(s, () => 0);           // 첫 승리 → offer 발생, 생명 일부 소모
  const hp1 = s.run.runHP;
  s.run.offer = ['ward'];          // 보호막 강제 제시
  pickBoon(s, 'ward');
  assert.equal(s.run.shield, 1);
  fightNode(s, () => 0);           // 보호막 소모 → 소모전 0
  assert.equal(s.run.shield, 0);
  assert.ok(s.run.runHP >= hp1 - 1e-9, '보호막 덕에 생명이 줄지 않아야');
});

test('boon 심화: gambit 즉시 생명↓·파워↑, 광폭 생명소모 배수↑', () => {
  const s = strongState();
  startRun(s, { floor: 1 });
  s.run.offer = ['gambit'];
  const before = s.run.runHP;
  pickBoon(s, 'gambit');
  assert.ok(s.run.runHP < before, 'gambit은 즉시 생명 감소');
  assert.ok(s.run.powerMult > 1, 'gambit 파워 증가');
  s.run.offer = ['berserk'];
  pickBoon(s, 'berserk');
  assert.ok(s.run.attritionMult > 1, '광폭은 생명소모 배수 증가');
});

test('세이브 왕복: 진행 중 런 상태 보존', () => {
  const s = strongState();
  startRun(s, { floor: 1 });
  fightNode(s, () => 0); // idx=1, boon offer, runHP<1
  const r2 = deserialize(serialize(s));
  assert.equal(r2.run.idx, s.run.idx);
  assert.equal(r2.run.runHP, s.run.runHP);
  assert.deepEqual(r2.run.offer, s.run.offer);
  assert.equal(r2.run.status, 'active');
  assert.equal(r2.run.nodes.length, RUN_NODES);
});
