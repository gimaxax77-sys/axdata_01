// 전투 데미지 숫자 슬롯 — 화면에 쌓이고 겹치던 버그(2026-07-26 실기 제보)의 재현 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptySlots, nextSlot, writeSlot, expireSlots, FLOAT_MS, FLOAT_SLOTS,
} from '../core/battleFloats.mjs';

const f = (born, val) => ({ born, val, tok: born });

test('데미지 숫자: 아무리 밀어넣어도 칸 수가 늘지 않는다 (누적 버그 재현)', () => {
  // 이전 구현은 배열에 push하고 나중에 잘랐다 — 실기에서 14개가 동시에 남았다.
  let slots = emptySlots();
  let idx = 0;
  for (let i = 0; i < 200; i++) {
    slots = writeSlot(slots, idx, f(1000 + i, i));
    idx = nextSlot(idx);
    assert.equal(slots.length, FLOAT_SLOTS, `${i}번째 푸시 후에도 칸 수 고정`);
  }
  assert.equal(slots.filter(Boolean).length, FLOAT_SLOTS);
});

test('데미지 숫자: 라운드로빈이라 가장 오래된 것이 밀려난다', () => {
  let slots = emptySlots();
  for (let i = 0; i < FLOAT_SLOTS + 1; i++) slots = writeSlot(slots, i, f(1000 + i, i));
  // 0번 칸은 마지막(FLOAT_SLOTS번째) 푸시가 덮어썼다 — 첫 값은 사라진다.
  assert.equal(slots[0].val, FLOAT_SLOTS);
  assert.equal(slots.length, FLOAT_SLOTS);
});

test('데미지 숫자: 푸시 없이 틱만 돌아도 수명이 지나면 비워진다', () => {
  let slots = writeSlot(emptySlots(), 0, f(1000, 'x'));
  for (let now = 1000; now <= 1000 + FLOAT_MS + 200; now += 150) slots = expireSlots(slots, now);
  assert.deepEqual(slots, emptySlots());
});

test('데미지 숫자: 바뀐 게 없으면 같은 배열을 돌려준다 (헛 리렌더 방지)', () => {
  const slots = writeSlot(emptySlots(), 0, f(1000, 'x'));
  assert.equal(expireSlots(slots, 1050), slots, '수명 내면 동일 참조');
  assert.notEqual(expireSlots(slots, 1000 + FLOAT_MS), slots, '만료되면 새 배열');
});
