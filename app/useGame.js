import { useRef, useState, useEffect, useCallback } from 'react';
import { createGameState } from '../system/core/gameState.mjs';
import { createUnit } from '../system/core/units.mjs';
import { earn } from '../system/core/economy.mjs';
import { computePower } from '../system/core/stats.mjs';
import { accountMods } from '../system/core/balance.mjs';
import { idleGenre } from '../system/genres/idle.mjs';
import { fantasyConcept } from '../system/concepts/fantasy.mjs';

// 게임 상태 훅.
// Core는 상태를 제자리에서 변형하므로, 액션 후 bump()로 강제 리렌더한다.
// 방치형 틱을 1초마다 돌려(가속 dt) "살아있는" 자동 성장을 보여준다.
const TICK_MS = 1000;
const TICK_GAME_SEC = 24; // 실제 1초 = 게임 24초 (숫자가 눈에 보이게)

export function useGame() {
  const ref = useRef(null);
  if (!ref.current) {
    // 시작 캐릭터: 견습 검사 미르 (정체성 부여)
    const starter = fantasyConcept.roster.find((c) => c.id === 'mir');
    const hero = createUnit(starter.archetype, {
      level: 1, rank: 1, characterId: starter.id, signature: starter.signature, element: starter.element,
    });
    hero.rarity = starter.rarity;
    const s = createGameState({ units: [hero], party: [hero.uid] });
    earn(s.wallet, { currency: 800, growth: 600, summon: 130 });
    ref.current = s;
  }
  const [, force] = useState(0);
  const bump = useCallback(() => force((v) => (v + 1) % 1e9), []);

  const [lastGain, setLastGain] = useState({ currency: 0, growth: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      const before = { ...ref.current.wallet };
      idleGenre.tick(ref.current, TICK_GAME_SEC);
      setLastGain({
        currency: Math.round(ref.current.wallet.currency - before.currency),
        growth: Math.round(ref.current.wallet.growth - before.growth),
      });
      bump();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [bump]);

  return { state: ref.current, bump, lastGain, concept: fantasyConcept };
}

// 파티 최고 유닛의 "실효 전투력"(환생 배수 포함)
export function effectivePower(state) {
  const mult = accountMods(state).powerMult;
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const best = party.length ? Math.max(...party.map(computePower)) : 0;
  return Math.round(best * mult);
}

export function powerMultOf(state) {
  return accountMods(state).powerMult;
}
