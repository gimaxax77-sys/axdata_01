import { fantasyConcept } from './fantasy.mjs';
import { scifiConcept } from './scifi.mjs';

export const CONCEPTS = { fantasy: fantasyConcept, scifi: scifiConcept };

// 컨셉 도감에서 characterId로 정체성을 찾는다.
export function characterOf(concept, id) {
  return (concept.roster || []).find((c) => c.id === id) || null;
}

// 유닛의 표시 정체성: 캐릭터가 있으면 이름/이모지/칭호/성격, 없으면 원형 fallback.
export function identity(concept, unit) {
  const ch = unit.characterId && characterOf(concept, unit.characterId);
  if (ch) return { name: ch.name, emoji: ch.emoji, title: ch.title, personality: ch.personality, element: ch.element };
  const a = concept.archetypes[unit.archetype];
  return { name: a.name, emoji: a.emoji, title: null, personality: null, element: null };
}

// 컨셉을 적용해 유닛을 사람이 읽을 수 있게 렌더 (숫자는 그대로).
export function renderUnit(concept, unit, stats) {
  const id = identity(concept, unit);
  return `${id.emoji} ${id.name} Lv.${unit.level}/R${unit.rank}` +
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
