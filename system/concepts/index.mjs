import { fantasyConcept } from './fantasy.mjs';
import { scifiConcept } from './scifi.mjs';
import { intimacyLevel } from '../core/intimacy.mjs';
import { COSTUMES } from '../core/costumes.mjs';

export const CONCEPTS = { fantasy: fantasyConcept, scifi: scifiConcept };

// 컨셉 도감에서 characterId로 정체성을 찾는다.
export function characterOf(concept, id) {
  return (concept.roster || []).find((c) => c.id === id) || null;
}

// 유닛의 표시 정체성: 캐릭터가 있으면 이름/이모지/칭호/성격, 없으면 원형 fallback.
export function identity(concept, unit) {
  const ch = unit.characterId && characterOf(concept, unit.characterId);
  // 외형 우선순위: 코스튬 스킨(unit.skin) > 레거시 컨셉 코스튬 > 기본
  const skin = unit.skin && COSTUMES[unit.skin];
  if (ch) {
    let emoji = ch.emoji;
    if (skin) emoji = skin.emoji;
    else {
      const cos = concept.costumes && concept.costumes[unit.characterId];
      if (unit.costume && cos && cos.id === unit.costume) emoji = cos.emoji;
    }
    return { name: ch.name, emoji, title: ch.title, personality: ch.personality, element: ch.element };
  }
  const a = concept.archetypes[unit.archetype];
  return { name: a.name, emoji: skin ? skin.emoji : a.emoji, title: null, personality: null, element: unit.element || null };
}

// 유닛의 코스튬 목록 (해금 여부 포함).
export function costumesOf(concept, unit) {
  const c = concept.costumes && concept.costumes[unit.characterId];
  if (!c) return [];
  return [{ ...c, unlocked: intimacyLevel(unit) >= c.unlock, equipped: unit.costume === c.id }];
}
// 코스튬 장착 — 보너스를 유닛에 세팅(Core가 읽을 plain data). 친밀도 게이트.
export function equipCostume(concept, unit, costumeId) {
  const c = concept.costumes && concept.costumes[unit.characterId];
  if (!c || c.id !== costumeId) return { ok: false, reason: '코스튬 없음' };
  if (intimacyLevel(unit) < c.unlock) return { ok: false, reason: '친밀도 부족' };
  unit.costume = c.id;
  unit.costumeBonus = { ...c.bonus };
  return { ok: true };
}
export function unequipCostume(unit) {
  unit.costume = null;
  unit.costumeBonus = {};
  return { ok: true };
}

// 전용무기 표시명/이모지. 컨셉이 weapons[characterId]로 지정하면 그걸 쓰고,
// 없으면 원형에 맞춰 파생(캐릭터명 + 무기 종류). Core 수치와는 무관한 렌더용.
const ARCH_WEAPON = {
  STRIKER: { emoji: '⚔️', kind: '검' },
  VANGUARD: { emoji: '🛡️', kind: '중갑' },
  SUPPORT: { emoji: '🔮', kind: '법구' },
};
export function sigWeaponOf(concept, unit) {
  const w = concept.weapons && concept.weapons[unit.characterId];
  if (w) return { name: w.name, emoji: w.emoji };
  const a = ARCH_WEAPON[unit.archetype] || ARCH_WEAPON.STRIKER;
  const ch = unit.characterId && characterOf(concept, unit.characterId);
  const base = ch ? ch.name : (concept.archetypes[unit.archetype]?.name || '영웅');
  return { name: `${base}의 ${a.kind}`, emoji: a.emoji };
}

// 속성 ID → 표시명/이모지 (컨셉 매핑). 없으면 ID 그대로.
export function elementMeta(concept, id) {
  if (!id) return null;
  return (concept.elements && concept.elements[id]) || { name: id, emoji: '' };
}

// 유닛의 대사 세트 (캐릭터가 있을 때만).
export function linesOf(concept, unit) {
  const ch = unit.characterId && characterOf(concept, unit.characterId);
  return (ch && ch.lines) || null;
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
