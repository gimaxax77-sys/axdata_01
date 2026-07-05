import { fantasyConcept } from './fantasy.mjs';
import { scifiConcept } from './scifi.mjs';

export const CONCEPTS = { fantasy: fantasyConcept, scifi: scifiConcept };

// 컨셉을 적용해 유닛을 사람이 읽을 수 있게 렌더 (숫자는 그대로).
export function renderUnit(concept, unit, stats) {
  const a = concept.archetypes[unit.archetype];
  return `${a.emoji} ${a.name} Lv.${unit.level}/R${unit.rank}` +
    (stats ? ` (HP ${stats.hp} / ATK ${stats.atk})` : '');
}

// 컨셉을 적용해 지갑을 렌더.
export function renderWallet(concept, wallet) {
  return Object.entries(wallet)
    .map(([k, v]) => {
      const r = concept.resources[k];
      return r ? `${r.emoji} ${r.name} ${v}` : `${k} ${v}`;
    })
    .join('  ·  ');
}
