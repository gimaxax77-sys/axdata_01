import fs from 'fs';
import { fantasyConcept } from '/home/user/axdata_01/system/concepts/fantasy.mjs';
import { GEAR_CATALOG } from '/home/user/axdata_01/system/core/gear.mjs';
import { SKILL_CATALOG } from '/home/user/axdata_01/system/core/skills.mjs';
import { PETS } from '/home/user/axdata_01/system/core/pets.mjs';
import { RELICS } from '/home/user/axdata_01/system/core/relics.mjs';
import { EMBLEMS } from '/home/user/axdata_01/system/core/emblems.mjs';
import { GUARDIANS } from '/home/user/axdata_01/system/core/guardians.mjs';
import { COSTUMES } from '/home/user/axdata_01/system/core/costumes.mjs';
import * as runes from '/home/user/axdata_01/system/core/runes.mjs';
import * as cosmetics from '/home/user/axdata_01/system/core/cosmetics.mjs';

const rows = [];
const H = ['분류', '세부타입', 'ID', '이름', '규격', '현재상태', '파일경로/키', '우선순위', '비고'];
const add = (r) => rows.push(r);

// 무기 라벨 → 실루엣 타입
function weaponType(label) {
  if (/단검|비수/.test(label)) return '단검';        // '검' 보다 먼저
  if (/방패|실드|방벽|수호벽/.test(label)) return '방패';
  if (/궁|활/.test(label)) return '활';
  if (/도끼/.test(label)) return '도끼';
  if (/창|랜스|스피어/.test(label)) return '창';
  if (/완드|지팡이/.test(label)) return '완드';
  if (/비전서|마도서|스태프|톰/.test(label)) return '스태프';
  if (/검|블레이드|칼/.test(label)) return '검';
  return '기타';
}
// 스킬 효과 계열
function skillFamily(s) {
  const sp = s.statPct || {}, ef = s.effect || {}, tb = s.teamBuff || {};
  const fam = [];
  if (Object.keys(tb).length) fam.push('팀버프');
  if (ef.critChance || ef.critDamage) fam.push('치명타');
  if (ef.lifesteal) fam.push('흡혈');
  if (ef.defPierce || ef.trueDamage) fam.push('관통');
  if (sp.atk) fam.push('공격');
  if (sp.hp || sp.def) fam.push('방어');
  if (sp.spd) fam.push('속도');
  if (!fam.length) fam.push('기타');
  return fam.join('/');
}

// 등록된 초상 = assets/char/fantasy/<id>.png 존재 여부
const portraitDir = '/home/user/axdata_01/assets/char/fantasy/';
const havePng = new Set(fs.existsSync(portraitDir) ? fs.readdirSync(portraitDir).filter((f) => f.endsWith('.png')).map((f) => f.replace('.png', '')) : []);

// ── 1) 캐릭터 초상 ──
for (const ch of fantasyConcept.roster) {
  const registered = havePng.has(ch.id);
  add(['캐릭터', '초상', ch.id, ch.name || ch.id, '512x512 PNG', registered ? '등록됨' : '필요', `assets/char/fantasy/${ch.id}.png`, 'P1', ch.title || '']);
}
// ── 2) 캐릭터 전투 스프라이트 (상태 4종) ──
for (const ch of fantasyConcept.roster) {
  add(['캐릭터', '스프라이트', ch.id, ch.name || ch.id, '128x128 가로스트립', '없음', `assets/units/fantasy/${ch.id}/`, 'P5', 'idle/attack/hit/death 4상태']);
}

// ── 3) 장비 ──
for (const g of Object.values(GEAR_CATALOG)) {
  const isWeapon = g.slot === 'weapon' || g.slot === 'offhand';
  const sub = isWeapon ? `무기:${weaponType(g.label)}` : `방어구/장신구:${g.slot}`;
  add(['장비', sub, g.id, g.label, '128x128 PNG', '이모지', '', 'P4', g.set ? `세트:${g.set}` : '']);
}

// ── 4) 스킬 ──
for (const s of Object.values(SKILL_CATALOG)) {
  add(['스킬', skillFamily(s), s.id, s.label, '128x128 원형', '이모지', '', 'P4', s.desc || '']);
}

// ── 5) 기타 아이템 카탈로그 ──
function dumpCatalog(catObj, category, spec, prio) {
  for (const it of Object.values(catObj)) {
    if (!it || typeof it !== 'object' || !it.id) continue;
    add([category, it.tier || it.rarity || '', it.id, it.label || it.name || it.id, spec, '이모지', '', prio, it.desc || '']);
  }
}
dumpCatalog(PETS, '펫', '128x128 초상', 'P4');
dumpCatalog(RELICS, '유물', '128x128', 'P4');
dumpCatalog(EMBLEMS, '엠블럼', '128x128 문장', 'P4');
dumpCatalog(GUARDIANS, '정령/가디언', '128x128 초상', 'P4');
dumpCatalog(COSTUMES, '코스튬', '초상 변형', 'P4');
// 룬·프로필(코스메틱)은 export가 세트/배열 형태 — 있으면 덤프
for (const [k, v] of Object.entries(runes)) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const it of Object.values(v)) if (it && it.id && it.label) add(['룬', k, it.id, it.label, '128x128', '이모지', '', 'P4', it.desc || '']);
  }
}
for (const [k, v] of Object.entries(cosmetics)) {
  if (Array.isArray(v)) for (const it of v) { if (it && (it.id || it.label)) add(['개성/프로필', k, it.id || '', it.label || it.name || '', '프로필 아이콘', '이모지', '', 'P4', '']); }
  else if (v && typeof v === 'object') for (const it of Object.values(v)) if (it && it.id && it.label) add(['개성/프로필', k, it.id, it.label, '프로필 아이콘', '이모지', '', 'P4', '']);
}

// ── 6) UI 심볼 (고정 세트) ──
const elems = fantasyConcept.elements || {};
for (const [k, v] of Object.entries(elems)) add(['UI심볼', '속성', k, (v && v.name) || k, '128x128', v && v.emoji || '이모지', '', 'P3', '원형 뱃지']);
const arch = fantasyConcept.archetypes || {};
for (const [k, v] of Object.entries(arch)) add(['UI심볼', '직업', k, (v && v.name) || k, '128x128', v && v.emoji || '이모지', '', 'P3', '']);
for (const r of ['N', 'R', 'SR', 'SSR', 'UR']) add(['UI심볼', '등급프레임', r, r + ' 등급', '카드 테두리', '목업', '', 'P2', '9-slice']);
for (const [k, v] of Object.entries(fantasyConcept.resources || {})) add(['UI심볼', '재화', k, (v && v.label) || k, '128x128', v && v.emoji || '', '', 'P3', '자원바']);
for (const [id, nm] of [['normal', '일반'], ['hard', '험난'], ['hell', '지옥'], ['abyss', '나락']]) add(['UI심볼', '난이도', id, nm, '난이도칩', '이모지', '', 'P3', '']);
for (const [id, nm] of [['idle', '전투'], ['roster', '영웅'], ['gacha', '소환'], ['content', '콘텐츠'], ['shop', '상점']]) add(['UI심볼', '메인탭', id, nm, '탭 아이콘', '이모지', '', 'P3', '']);
add(['UI심볼', '성급배지', 'star', '성급(1~10)', '실버/골드 밴드', '코드생성', '', 'P2', '']);

// ── CSV 쓰기 (BOM + 따옴표 이스케이프) ──
const esc = (s) => { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = '﻿' + [H, ...rows].map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
const out = '/home/user/axdata_01/docs/art_assets.csv';
fs.writeFileSync(out, csv);
console.log('행 수:', rows.length, '→', out);
// 분류별 집계
const byCat = {};
for (const r of rows) byCat[r[0]] = (byCat[r[0]] || 0) + 1;
console.log(byCat);
