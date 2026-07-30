// 테스트 모드 스위치 검증 — system/core/testmode.mjs
//
// 여기서 지키는 것 두 가지.
//  1) 자동화 테스트 안에서는 TEST_MODE가 **반드시 꺼져** 있어야 한다.
//     이 안전장치가 고장나면 재화 차감·해금을 단언하는 다른 테스트 300여 개가
//     조용히 통과만 하고 아무것도 검증하지 못하게 된다. 가장 위험한 실패다.
//  2) 테스트 밖(=실제 앱)에서는 게이트가 실제로 열려야 한다.
//     같은 프로세스에서는 확인할 수 없어(위 1번 때문에) 자식 프로세스로 확인한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as pathResolve } from 'node:path';
import { TEST_MODE } from '../core/testmode.mjs';

// Windows에서는 ESM import에 절대경로를 그대로 못 쓴다 — file:// URL이어야 한다.
const coreDir = pathResolve(dirname(fileURLToPath(import.meta.url)), '../core');
const mod = (name) => JSON.stringify(pathToFileURL(pathResolve(coreDir, name)).href);

test('안전장치: 테스트 안에서는 TEST_MODE가 꺼져 있다', () => {
  assert.equal(TEST_MODE, false,
    '테스트에서 TEST_MODE가 켜지면 재화·해금 단언이 전부 무의미해진다');
});

test('안전장치: 테스트 안에서는 제약이 살아 있다', async () => {
  const { spend, createWallet } = await import('../core/economy.mjs');
  const w = createWallet({ summon: 5 });
  assert.equal(spend(w, { summon: 10 }), false, '잔액보다 크면 실패해야 함');
  assert.equal(spend(w, { summon: 5 }), true);
  assert.equal(w.summon, 0, '성공하면 실제로 차감돼야 함');
});

test('실제 앱(테스트 밖): 제약이 전부 풀린다', () => {
  // NODE_TEST_CONTEXT를 지운 환경 = 실제 앱과 같은 조건.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;

  const script = `
    import { TEST_MODE } from ${mod('testmode.mjs')};
    import { spend, createWallet } from ${mod('economy.mjs')};
    import { difficultyUnlocked } from ${mod('difficulty.mjs')};
    import { isUnlocked } from ${mod('unlocks.mjs')};
    import { levelCap } from ${mod('units.mjs')};
    import { skillSlots } from ${mod('skills.mjs')};
    const st = { peakStage: 1 };
    const w = createWallet({ summon: 0 });
    console.log(JSON.stringify({
      on: TEST_MODE,
      spendFree: spend(w, { summon: 9999 }),   // F 재화 (= D 돌파 비용도 같이 풀림)
      walletKept: w.summon === 0,              //   차감하지 않는다
      abyss: difficultyUnlocked(st, 'abyss'),  // A 난이도(원래 100층)
      guild: isUnlocked(st, 'guild'),          // B 콘텐츠 해금(원래 75층)
      cap: levelCap({ rank: 1 }),              // C 레벨 상한(원래 20)
      slots: skillSlots({ rank: 1 }),          // G 스킬 슬롯(원래 2)
    }));
  `;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { env, encoding: 'utf8' });
  const r = JSON.parse(out.trim().split('\n').pop());

  assert.equal(r.on, true, '앱에서는 TEST_MODE가 켜져 있어야 함');
  assert.equal(r.spendFree, true, '재화가 0이어도 지불이 통과해야 함');
  assert.equal(r.walletKept, true, '테스트 모드에서는 차감하지 않는다');
  assert.equal(r.abyss, true, '나락 난이도가 열려야 함');
  assert.equal(r.guild, true, '길드 해금이 열려야 함');
  assert.ok(r.cap > 20, `레벨 상한이 풀려야 함 (=${r.cap})`);
  assert.equal(r.slots, 3, '스킬 슬롯 3칸 전부 열려야 함');
});
