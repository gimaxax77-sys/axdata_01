import { useRef, useState, useEffect, useCallback } from 'react';
import { createGameState } from '../system/core/gameState.mjs';
import { createUnit } from '../system/core/units.mjs';
import { earn } from '../system/core/economy.mjs';
import { computePower } from '../system/core/stats.mjs';
import { accountMods } from '../system/core/balance.mjs';
import { idleGenre } from '../system/genres/idle.mjs';
import { serialize, deserialize } from '../system/core/save.mjs';
import { fantasyConcept } from '../system/concepts/fantasy.mjs';
import { CONCEPTS } from '../system/concepts/index.mjs';
import { loadRaw, saveRaw, clearSave } from './storage';

// 게임 상태 훅. 저장/복원 + 오프라인 보상 정산 + 방치 틱.
const TICK_MS = 1000;
const TICK_GAME_SEC = 24; // 실제 1초 = 게임 24초 (숫자가 눈에 보이게)

// 운영 컨셉 선택 — 빌드/초기화 시점의 운영자 결정(글로벌로 주입).
// 같은 코어를 판타지/SF 두 제품으로 배포함을 실증. 기본은 판타지.
function activeConcept() {
  const id = (typeof globalThis !== 'undefined' && globalThis.__ELDRIA_CONCEPT__) || 'fantasy';
  return CONCEPTS[id] || fantasyConcept;
}
const CONCEPT = activeConcept();

function createFresh() {
  const starter = CONCEPT.roster.find((c) => c.id === 'mir') || CONCEPT.roster.find((c) => c.rarity === 'N') || CONCEPT.roster[0];
  const hero = createUnit(starter.archetype, {
    level: 1, rank: 1, characterId: starter.id, signature: starter.signature, element: starter.element,
  });
  hero.rarity = starter.rarity;
  const s = createGameState({ units: [hero], party: [hero.uid] });
  earn(s.wallet, { currency: 800, growth: 600, summon: 130, gem: 120 });
  return s;
}

export function useGame() {
  const ref = useRef(null);
  const offlineRef = useRef(null);
  if (!ref.current) {
    const raw = loadRaw();
    const loaded = raw ? deserialize(raw) : null;
    if (loaded) {
      // 재접속: 마지막 저장 이후 경과분 오프라인 정산
      const rew = idleGenre.collectOffline(loaded, Date.now());
      if (rew.gained && (rew.gained.currency > 0 || rew.gained.growth > 0)) {
        offlineRef.current = { ...rew, seconds: rew.seconds };
      }
      ref.current = loaded;
    } else {
      ref.current = createFresh();
    }
  }
  const [, force] = useState(0);
  const bump = useCallback(() => force((v) => (v + 1) % 1e9), []);
  const [offline, setOffline] = useState(offlineRef.current);
  const [lastGain, setLastGain] = useState({ currency: 0, growth: 0 });

  const save = useCallback(() => saveRaw(serialize(ref.current)), []);

  // 방치 틱 + 주기 저장
  useEffect(() => {
    const id = setInterval(() => {
      const before = { ...ref.current.wallet };
      idleGenre.tick(ref.current, TICK_GAME_SEC);
      setLastGain({
        currency: Math.round(ref.current.wallet.currency - before.currency),
        growth: Math.round(ref.current.wallet.growth - before.growth),
      });
      save();
      bump();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [bump, save]);

  // 창 닫힘/숨김 시 저장 (웹)
  useEffect(() => {
    const w = typeof globalThis !== 'undefined' ? globalThis : null;
    if (!w || !w.addEventListener) return;
    const onHide = () => save();
    w.addEventListener('beforeunload', onHide);
    w.addEventListener('visibilitychange', onHide);
    return () => {
      w.removeEventListener('beforeunload', onHide);
      w.removeEventListener('visibilitychange', onHide);
    };
  }, [save]);

  const dismissOffline = useCallback(() => setOffline(null), []);
  const reset = useCallback(() => {
    clearSave();
    ref.current = createFresh();
    save();
    setOffline(null);
    bump();
  }, [bump, save]);

  return { state: ref.current, bump, lastGain, offline, dismissOffline, reset, save, concept: CONCEPT };
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
