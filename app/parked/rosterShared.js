// 로스터 화면 공용 헬퍼 — RosterScreen·RosterPickerModal이 함께 쓰는 순수 표시 함수/상수.
//   (등급 색·스탯 아이콘·효과 서술·전투력 미리보기 등. 로직 없음, 표시 전용.)
import React from 'react';
import { Text } from 'react-native';
import { T, rarityMeta } from '../theme';
import { fmt } from '../components';
import { isOn } from '../../system/core/features.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { SKILL_CATALOG, skillPower } from '../../system/core/skills.mjs';
import { gearContribution } from '../../system/core/gear.mjs';
import { RUNE_SETS, RUNE_RARITY, runeMainValue } from '../../system/core/runes.mjs';

// 등급 순위(정렬용) — 인벤토리 상위 우선.
export const RARITY_RANK = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
// 등급 모듈 off면 등급 테두리는 중립색, 등급 라벨은 숨김(display:none).
export function rarityColor(r) { return isOn('rarity') ? rarityMeta(r).color : T.line; }
// 등급 인라인 배지 스타일 — 다크 배경 대비 확보(등급색 배경 + 어두운 글자).
export function rarityText(r) {
  if (!isOn('rarity')) return { display: 'none' };
  return { backgroundColor: rarityMeta(r).color, color: '#160f28', fontWeight: '900', fontSize: 11, borderRadius: 4, overflow: 'hidden' };
}

// 후보를 임시 장착했을 때의 실제 전투력 — 피커의 "변경 전후 비교"용.
export function powerWithGearItem(unit, slot, item) {
  const prev = unit.gear[slot];
  unit.gear[slot] = item || null;
  const p = computePower(unit);
  unit.gear[slot] = prev;
  return p;
}
export function powerWithRuneItem(unit, i, rune) {
  if (!unit.runes) unit.runes = [];
  const prev = unit.runes[i];
  unit.runes[i] = rune || null;
  const p = computePower(unit);
  unit.runes[i] = prev;
  return p;
}

// 전후 차이 표시 — 델타를 '채운 배지'로 강조(하향=빨강, 상향=초록).
export function DeltaText({ cur, next }) {
  const d = next - cur;
  const up = d > 0, down = d < 0;
  const badge = {
    backgroundColor: up ? T.good : down ? T.danger : T.surface2,
    color: up ? '#0f2a17' : down ? '#ffffff' : T.muted,
    fontWeight: '900', fontSize: 12, borderRadius: 5, overflow: 'hidden',
  };
  return (
    <Text style={{ color: T.muted, fontWeight: '700', fontSize: 12, marginTop: 4 }}>
      전투력 {fmt(cur)} → <Text style={{ color: up ? T.good : down ? T.danger : T.text, fontWeight: '900' }}>{fmt(next)}</Text>
      {'  '}<Text style={badge}> {up ? '▲ +' : down ? '▼ -' : '± '}{fmt(Math.abs(d))} </Text>
    </Text>
  );
}

// 스탯 → 아이콘(룬·장비·스킬 표기 일관).
export const STAT_ICON = {
  atk: '⚔️', hp: '❤️', def: '🛡️', spd: '👟',
  critChance: '💥', critDamage: '💥💥', lifesteal: '🩸', defPierce: '🏹',
  dmgReduce: '🧱', evasion: '🌀', accuracy: '🎯', trueDamage: '⚡', absDef: '🔰',
};
export function statIcon(key) { return STAT_ICON[key] || String(key).toUpperCase(); }
// 치명피해(💥💥)만 겹쳐 보이도록 음수 자간 적용 — 문자열을 Text 자식 배열로 변환.
export function ov(text) {
  const s = String(text);
  if (!s.includes('💥💥')) return s;
  const segs = s.split('💥💥');
  const out = [];
  segs.forEach((seg, i) => {
    if (seg) out.push(seg);
    if (i < segs.length - 1) out.push(<Text key={`cd${i}`} style={{ letterSpacing: -10 }}>💥💥</Text>);
  });
  return out;
}

// 효과 객체 → 사람이 읽는 문자열 (scale = 스킬 레벨/랭크 배수)
export function describeEffect(e = {}, scale = 1) {
  const p = [];
  const order = ['critChance', 'critDamage', 'lifesteal', 'defPierce', 'dmgReduce', 'evasion', 'accuracy', 'trueDamage', 'absDef'];
  for (const k of order) if (e[k]) p.push(`${statIcon(k)} +${Math.round(e[k] * scale * 100)}%`);
  return p;
}
// 팀버프 3종 표시 (공격/피해경감/치명)
export function describeTeamBuff(tb = {}, scale = 1) {
  const p = [];
  if (tb.atk) p.push(`팀 ⚔️ +${Math.round(tb.atk * scale * 100)}%`);
  if (tb.def) p.push(`팀 🛡️ +${Math.round(tb.def * scale * 100)}%`);
  if (tb.critChance) p.push(`팀 🎯 +${Math.round(tb.critChance * scale * 100)}%`);
  return p;
}
// scale: 스킬 레벨/랭크 배수.
export function describeSkill(id, scale = 1) {
  const s = SKILL_CATALOG[id];
  const p = [];
  if (s.statPct) for (const [k, v] of Object.entries(s.statPct)) p.push(`${statIcon(k)} +${Math.round(v * scale * 100)}%`);
  p.push(...describeEffect(s.effect, scale));
  p.push(...describeTeamBuff(s.teamBuff, scale));
  return p.join(' · ');
}
// 설계도 기준(강화 전 Lv1) 표시 — 제작 미리보기용.
export function describeGear(bp) {
  const p = [];
  for (const [k, v] of Object.entries(bp.flat || {})) p.push(`${statIcon(k)} +${v}`);
  p.push(...describeEffect(bp.effect));
  return p.join(' · ');
}
// 실제 장비 인스턴스(강화 레벨 + 등급 배수 + 부옵션 반영) 표시.
export function describeGearItem(item) {
  const c = gearContribution(item);
  const p = [];
  for (const [k, v] of Object.entries(c.flat)) p.push(`${statIcon(k)} +${Math.round(v)}`);
  for (const [k, v] of Object.entries(c.statPct)) p.push(`${statIcon(k)} +${Math.round(v * 100)}%`);
  p.push(...describeEffect(c.effect));
  return p.join(' · ');
}
// 장비 부옵션만 (재련 대상 강조용).
export function describeSubs(subs = []) {
  return subs.map((s) => `${statIcon(s.key)} +${Math.round(s.value * 100)}%`).join(' · ');
}
// 시그니처 각성 2차 효과 설명
export function describeAwaken(a = {}) {
  const p = [];
  if (a.statPct) for (const [k, v] of Object.entries(a.statPct)) p.push(`${statIcon(k)} +${Math.round(v * 100)}%`);
  p.push(...describeEffect(a.effect));
  p.push(...describeTeamBuff(a.teamBuff));
  return p.join(' · ');
}
// 룬 한 개 요약 (메인스탯 + 등급 + 부옵션)
export function describeRune(rune) {
  const set = RUNE_SETS[rune.set];
  const val = runeMainValue(rune);
  const stat = statIcon(set.main.stat);
  const pct = `${(val * 100).toFixed(1)}%`;
  const subTxt = (rune.subs || []).length ? ` · ${describeSubs(rune.subs)}` : '';
  return { title: `${set.emoji} ${set.label} +${rune.level}`, sub: `${stat} ${pct}${subTxt}`, rarity: rune.rarity, rarityLabel: RUNE_RARITY[rune.rarity].label };
}
