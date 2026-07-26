// 양팀 전투력 비교 지표(score/enemyScore) — 큰 쪽이 반드시 이기는지 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit } from '../core/units.mjs';
import { createGameState, getPartyUnits } from '../core/gameState.mjs';
import { resolve } from '../core/resolution.mjs';
import { getStage } from '../core/progression.mjs';

function partyAt(level) {
  const s = createGameState({ units: [], party: [] });
  const a = createUnit('STRIKER', { level, rank: 2 });
  const b = createUnit('VANGUARD', { level, rank: 2 });
  s.units.push(a, b);
  s.party = [a.uid, b.uid];
  return getPartyUnits(s);
}

test('전투력 비교: score ≥ enemyScore 가 승패와 정확히 일치', () => {
  // 약한 파티 → 강한 스테이지까지 훑어 두 판정이 어긋나는 구간이 없는지 본다.
  for (const level of [1, 20, 60]) {
    const party = partyAt(level);
    for (let stage = 1; stage <= 200; stage += 7) {
      const r = resolve(party, getStage(stage).challenge, {});
      assert.equal(
        r.score >= r.enemyScore, r.win,
        `Lv${level} · ${stage}층: score ${r.score} vs ${r.enemyScore} 인데 win=${r.win}`,
      );
    }
  }
});

test('전투력 비교: 파티 없으면 0/0으로 표시 (NaN 방지)', () => {
  const r = resolve([], getStage(1).challenge, {});
  assert.equal(r.score, 0);
  assert.equal(r.enemyScore, 0);
});
