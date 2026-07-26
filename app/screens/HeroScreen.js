// 영웅 탭 — 호드워 영웅 화면. 기준: Gim 실기 캡처 2장(2026-07-26), docs/HORDWAR_SPEC.md.
//   골격 = 상단 서브탭(장신구·도감·영웅) + 보유수 알약 · 카드 그리드 4열 · 하단 필터바([공명] ⌃ ALL 속성 [편성]).
//   카드 = 좌측 세로 원형뱃지(속성·역할) · 상단 등급 메달(S+/S/A) · ❗ · 전장 대기중 라벨 · Lv 리본 · 이름.
//   엘드리아 대응 / 의도적 차이
//     · 장신구=장비(gear) · 도감=meta — 둘 다 파킹이라 잠금 서브탭(docs/PARKED.md).
//     · 보유수 — 호드워는 107/200(용량 과금). 엘드리아엔 상한 개념이 없어 **보유수만** 표시.
//     · '핵심' 라벨, '상위 5명 최저레벨 공유' 안내 — 호드워 고유 시스템이라 넣지 않음.
//     · 공명 — 대응이 없어 팀 시너지 개수로 대체.
//     · 상세 — 참조 화면엔 없지만 레벨업·돌파 경로가 필요해 **카드 탭 시 모달**로 띄운다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { T } from '../theme';
import { Btn, fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { togglePartyMember, MAX_PARTY, getPartyUnits } from '../../system/core/gameState.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap } from '../../system/core/units.mjs';
import { levelUp, ascend, ascendCost } from '../../system/core/character.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { starOf } from '../../system/core/starGrade.mjs';
import FormationModal from './FormationModal';

// 호드워 등급 메달 표기 — 엘드리아 N~UR을 같은 자리에 얹는다.
const GRADE = { UR: 'S+', SSR: 'S', SR: 'A', R: 'B', N: 'C' };
const GRADE_BG = { UR: '#c0392b', SSR: '#c9962a', SR: '#2f8f7f', R: '#3a6ea8', N: '#6b6b6b' };

const SUBS = [
  { key: 'gear', label: '장신구', lock: '장비는 준비 중입니다' },
  { key: 'dex', label: '도감', lock: '도감은 준비 중입니다' },
  { key: 'hero', label: '영웅' },
];

// 영웅 카드 한 장 — 세로 장식 카드.
const HeroCard = React.memo(function HeroCard({ u, name, emoji, elemIc, roleIc, img, sel, inParty, onPress }) {
  const g = GRADE[u.rarity] || 'C';
  return (
    <TouchableOpacity style={[c.card, sel && c.cardSel]} activeOpacity={0.85} onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} ${g}등급 ${u.level}레벨${inParty ? ' 편성됨' : ''}`}>
      {/* 좌측 세로 원형 뱃지 — 속성 · 역할 */}
      <View style={c.badges}>
        {elemIc ? <View style={c.badge}><Text style={c.badgeTx}>{elemIc}</Text></View> : null}
        <View style={c.badge}><Text style={c.badgeTx}>{roleIc}</Text></View>
      </View>
      {/* 상단 중앙 등급 메달 */}
      {isOn('rarity') && (
        <View style={[c.medal, { backgroundColor: GRADE_BG[u.rarity] || '#6b6b6b' }]}>
          <Text style={c.medalTx}>{g}</Text>
        </View>
      )}
      {inParty && <View style={c.dot} />}

      <View style={c.art}>
        <Portrait emoji={emoji} image={img} rarity={u.rarity} size={54} />
      </View>
      {inParty && <Text style={c.standby}>전장 대기중</Text>}
      {/* 하단 리본 — Lv */}
      <View style={c.ribbon}><Text style={c.ribbonTx}>Lv{u.level}</Text></View>
      <Text style={c.name} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
});

export default function HeroScreen({ state, bump, concept, onLocked }) {
  const [sub, setSub] = useState('hero');
  const [elemFilter, setElemFilter] = useState(null);
  const [barOpen, setBarOpen] = useState(true);
  const [detail, setDetail] = useState(null);   // 상세 모달 uid
  const [formOpen, setFormOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  // 동일 캐릭터는 한 칸으로 묶고(대표=최강) 편성된 영웅을 앞으로.
  const pw = new Map();
  const powOf = (u) => { let v = pw.get(u.uid); if (v === undefined) { v = computePower(u); pw.set(u.uid, v); } return v; };
  const seen = new Set();
  const cards = [];
  for (const u of state.units.slice().sort((a, b) => powOf(b) - powOf(a))) {
    const key = u.characterId || u.uid;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(u);
  }
  const partySet = new Set(state.party);
  cards.sort((a, b) => (partySet.has(b.uid) ? 1 : 0) - (partySet.has(a.uid) ? 1 : 0));
  const shown = elemFilter ? cards.filter((u) => identity(concept, u).element === elemFilter) : cards;

  const synCount = teamSynergy(getPartyUnits(state)).list.length;
  const unit = detail && state.units.find((u) => u.uid === detail);

  return (
    <View style={c.wrap}>
      {/* 상단 — 보유수 알약 + 서브탭 3개 */}
      <View style={c.top}>
        <View style={{ flex: 1 }} />
        <View style={c.cap}><Text style={c.capTx}>🦸 {state.units.length}</Text></View>
      </View>
      <View style={c.subbar}>
        {SUBS.map((s) => {
          const on = s.key === sub;
          return (
            <TouchableOpacity key={s.key} style={[c.sub, on && c.subOn]} activeOpacity={0.85}
              onPress={() => { if (s.lock) { fx('error'); onLocked?.(`🔒 ${s.lock}`); } else { fx('tap'); setSub(s.key); } }}
              accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={s.lock ? `${s.label} 잠김` : s.label}>
              <Text style={[c.subTx, on && c.subTxOn]}>{s.label}</Text>
              {s.lock && <Text style={c.subLock}>🔒</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 카드 그리드 4열 */}
      <ScrollView style={c.flex} contentContainerStyle={c.grid}>
        {shown.length === 0 && <Text style={c.empty}>이 속성의 {concept.terms.unit}이 없습니다</Text>}
        {shown.map((u) => {
          const id = identity(concept, u);
          const arch = concept.archetypes[u.archetype];
          return (
            <HeroCard key={u.uid} u={u} name={id.name} emoji={id.emoji}
              elemIc={elementMeta(concept, id.element)?.emoji}
              roleIc={arch ? arch.emoji : '❔'}
              img={charImage(concept.id, u.characterId)}
              sel={u.uid === detail} inParty={partySet.has(u.uid)}
              onPress={() => { fx('tap'); setDetail(u.uid); }} />
          );
        })}
      </ScrollView>

      {/* 하단 필터바 — [공명] ⌃ ALL 속성… [편성] */}
      <View style={c.filter}>
        <View style={c.reso}>
          <Text style={c.resoIc}>✦</Text>
          <Text style={c.resoTx}>시너지 {synCount}</Text>
        </View>
        {isOn('elements') && (<>
          <TouchableOpacity onPress={() => setBarOpen((v) => !v)} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel={barOpen ? '속성 필터 접기' : '속성 필터 펼치기'}>
            <Text style={c.fold}>{barOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setElemFilter(null)}
            style={[c.all, !elemFilter && c.allOn]} accessibilityRole="button" accessibilityLabel="전체 속성">
            <Text style={[c.allTx, !elemFilter && c.allTxOn]}>ALL</Text>
          </TouchableOpacity>
          {barOpen && Object.keys(concept.elements || {}).map((eid) => {
            const on = elemFilter === eid;
            return (
              <TouchableOpacity key={eid} activeOpacity={0.8} style={[c.eChip, on && c.eChipOn]}
                onPress={() => setElemFilter(on ? null : eid)}
                accessibilityRole="button" accessibilityLabel={`${concept.elements[eid].name} 속성`}>
                <Text style={c.eChipIc}>{concept.elements[eid].emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </>)}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={c.formBtn} activeOpacity={0.85}
          onPress={() => { fx('tap'); setFormOpen(true); }}
          accessibilityRole="button" accessibilityLabel="편성 열기">
          <Text style={c.formIc}>👥</Text><Text style={c.formTx}>편성</Text>
        </TouchableOpacity>
      </View>
      {msg ? <Text style={c.msg}>{msg}</Text> : null}

      {/* 상세 모달 — 참조 화면엔 없지만 육성 경로가 필요해 추가 */}
      <Modal transparent animationType="fade" visible={!!unit} onRequestClose={() => setDetail(null)}>
        <TouchableOpacity style={c.backdrop} activeOpacity={1} onPress={() => setDetail(null)}
          accessibilityRole="button" accessibilityLabel="닫기">
          {unit && (() => {
            const id = identity(concept, unit);
            const st8 = computeStats(unit);
            const asc = ascendCost(unit);
            const inParty = state.party.includes(unit.uid);
            const atCap = unit.level >= levelCap(unit);
            return (
              <TouchableOpacity activeOpacity={1} style={c.dcard}>
                <Portrait emoji={id.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} size={84} badge />
                <Text style={c.dname}>
                  {id.element ? `${elementMeta(concept, id.element).emoji} ` : ''}{id.name}
                </Text>
                <Text style={c.dsub}>Lv.{unit.level}/{levelCap(unit)} · R{unit.rank} · {starOf(unit)}★ · ⚔{fmt(computePower(unit))}</Text>
                <View style={c.dstats}>
                  <Text style={c.dstat}>❤️ {fmt(st8.hp)}</Text>
                  <Text style={c.dstat}>⚔️ {fmt(st8.atk)}</Text>
                  <Text style={c.dstat}>🛡️ {fmt(st8.def)}</Text>
                </View>
                <View style={c.dbtns}>
                  <Btn small kind={inParty ? 'ghost' : 'gold'} label={inParty ? '편성 해제' : '편성'}
                    disabled={!inParty && state.party.length >= MAX_PARTY}
                    onPress={() => { togglePartyMember(state, unit.uid); fx('tap'); bump(); }} />
                  <Btn small kind="primary" label="레벨업" disabled={atCap}
                    onPress={() => { const r = levelUp(state, unit.uid); if (r.ok) recordMission(state, 'upgrade', 1); else setMsg(`⚠ ${r.reason}`); fx(r.ok ? 'success' : 'error'); bump(); }} />
                  <Btn small kind="ghost" label={`돌파 ${concept.resources.summon.emoji}${fmt(asc.summon || 0)}`}
                    onPress={() => { const r = ascend(state, unit.uid); if (r.ok) recordMission(state, 'upgrade', 1); setMsg(r.ok ? '⭐ 돌파 성공' : `⚠ ${r.reason}`); fx(r.ok ? 'success' : 'error'); bump(); }} />
                </View>
              </TouchableOpacity>
            );
          })()}
        </TouchableOpacity>
      </Modal>

      <FormationModal visible={formOpen} state={state} bump={bump} concept={concept}
        onClose={() => setFormOpen(false)} onMsg={setMsg} />
    </View>
  );
}

const c = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },

  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 6 },
  cap: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 2 },
  capTx: { color: T.text, fontSize: 10, fontWeight: '800' },

  // 상단 서브탭 — 선택된 것만 밝게(호드워: 카드형 탭)
  subbar: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 6 },
  sub: { flex: 1, alignItems: 'center', paddingVertical: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#3b2d1d', borderWidth: 1, borderColor: '#6b543a' },
  subOn: { backgroundColor: T.accent, borderColor: T.accent },
  subTx: { color: '#b09a76', fontSize: 12, fontWeight: '900' },
  subTxOn: { color: '#3d2a00' },
  subLock: { position: 'absolute', top: 3, right: 6, fontSize: 9 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 8, paddingTop: 8 },
  empty: { color: T.muted, fontSize: 11, padding: 12 },

  // 카드 — 세로 장식형
  card: { width: '23.5%', backgroundColor: '#8a5a2b', borderRadius: 8, borderWidth: 2, borderColor: '#c08b4a', paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  cardSel: { borderColor: T.danger, backgroundColor: '#9b4a34' },
  badges: { position: 'absolute', left: 3, top: 4, gap: 3, zIndex: 3 },
  badge: { width: 15, height: 15, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: '#e0c08a', alignItems: 'center', justifyContent: 'center' },
  badgeTx: { fontSize: 8 },
  medal: { position: 'absolute', top: -1, alignSelf: 'center', minWidth: 22, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  medalTx: { color: '#fff', fontSize: 10, fontWeight: '900' },
  dot: { position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger, zIndex: 3 },
  art: { marginTop: 8 },
  standby: { color: '#eaffe0', backgroundColor: 'rgba(40,120,50,0.9)', fontSize: 7, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  // 하단 Lv 리본
  ribbon: { alignSelf: 'stretch', marginTop: 4, marginHorizontal: 3, backgroundColor: '#f0e0bd', borderRadius: 4, alignItems: 'center', paddingVertical: 1 },
  ribbonTx: { color: '#2c62a8', fontSize: 11, fontWeight: '900' },
  name: { color: '#f5e6c8', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2, paddingHorizontal: 2 },

  // 하단 필터바
  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#2b2013', borderTopWidth: 1, borderTopColor: '#6b543a' },
  reso: { alignItems: 'center', paddingRight: 3 },
  resoIc: { color: T.accent, fontSize: 14, fontWeight: '900' },
  resoTx: { color: '#b09a76', fontSize: 8, fontWeight: '800' },
  fold: { color: '#b09a76', fontSize: 14, fontWeight: '900', width: 14, textAlign: 'center' },
  all: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  allOn: { borderColor: T.accent, backgroundColor: 'rgba(255,201,60,0.15)' },
  allTx: { color: '#b09a76', fontSize: 9, fontWeight: '900' },
  allTxOn: { color: T.accent },
  eChip: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#3b2d1d', borderWidth: 1, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  eChipOn: { borderColor: T.accent, borderWidth: 2 },
  eChipIc: { fontSize: 13 },
  formBtn: { alignItems: 'center', paddingHorizontal: 4 },
  formIc: { fontSize: 17 },
  formTx: { color: '#e6d3ae', fontSize: 8, fontWeight: '900' },
  msg: { color: T.accent, fontSize: 10, fontWeight: '800', textAlign: 'center', paddingBottom: 4, backgroundColor: '#2b2013' },

  // 상세 모달
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dcard: { width: '100%', maxWidth: 320, alignItems: 'center', backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.accent, padding: 18 },
  dname: { color: T.text, fontSize: 16, fontWeight: '900', marginTop: 8 },
  dsub: { color: T.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  dstats: { flexDirection: 'row', gap: 12, marginTop: 10 },
  dstat: { color: T.text, fontSize: 11, fontWeight: '700' },
  dbtns: { flexDirection: 'row', gap: 6, marginTop: 14 },
});
