// 모험 탭 하단 편성 줄 — 호드워 편성 화면. 기준: Gim 실기 캡처 `184914`(2026-07-27).
//   골격 = 영웅 카드 가로 목록(✅ 편성됨 · N레벨) · 속성 필터 바(⌃ ALL + 속성 원형)
//          · 하단 액션 [일괄 진형 배치] [전투].
//   여기가 **파티에 영웅을 넣는 유일한 경로**다(Gim 결정 2026-07-27).
//   엘드리아 대응 / 의도적 차이
//     · 호드워는 전투 화면 위에 겹치는 별도 화면. 엘드리아는 모험 탭 하단에 상주시켜
//       한 번의 탭도 없이 편성할 수 있게 했다.
//     · `전투` — 호드워는 전투를 시작하는 버튼이지만 엘드리아는 상시 자동 전투라
//       **요새(전투 화면)로 이동**한다(docs/HORDWAR_SPEC.md "7번 전제 정정").
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T, GRADE, GRADE_BG } from '../theme';
import { Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { togglePartyMember, MAX_PARTY } from '../../system/core/gameState.mjs';
import { autoFormation } from '../../system/core/formation.mjs';

export default function PartyStrip({ state, bump, concept, onBattle }) {
  const [elemFilter, setElemFilter] = useState(null);
  const [barOpen, setBarOpen] = useState(true);
  const [msg, setMsg] = useState(null);

  // 같은 캐릭터는 한 칸으로 묶고(대표=최강) 편성된 영웅을 앞으로 — 영웅 탭과 같은 규약.
  const pw = new Map();
  const powOf = (u) => { let v = pw.get(u.uid); if (v === undefined) { v = computePower(u); pw.set(u.uid, v); } return v; };
  const seen = new Set();
  const cards = [];
  for (const u of state.units.slice().sort((x, y) => powOf(y) - powOf(x))) {
    const key = u.characterId || u.uid;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(u);
  }
  const partySet = new Set(state.party);
  cards.sort((x, y) => (partySet.has(y.uid) ? 1 : 0) - (partySet.has(x.uid) ? 1 : 0));
  const shown = elemFilter ? cards.filter((u) => identity(concept, u).element === elemFilter) : cards;

  const toggle = (u) => {
    const r = togglePartyMember(state, u.uid);
    setMsg(r.ok ? null : `⚠ ${r.reason}`);
    fx(r.ok ? 'tap' : 'error');
    bump();
  };

  // `일괄 진형 배치` — 빈 자리를 먼저 채우고 나서 진형을 배치한다.
  //   autoFormation은 **이미 편성된 파티만** 배치한다. 파티가 1명이면 1명만 배치돼
  //   "일괄"이라는 말과 어긋난다(Gim 지적 2026-07-27).
  //   코어의 autoParty는 쓰지 않는다 — 파티를 통째로 갈아치워서 Gim이 직접 고른
  //   조합이 소리 없이 사라진다. 여기서는 **빈 자리만** 강한 순으로 메운다.
  const doArrange = () => {
    let added = 0;
    for (const u of cards) {
      if (state.party.length >= MAX_PARTY) break;
      if (partySet.has(u.uid)) continue;
      if (togglePartyMember(state, u.uid).ok) added += 1;
    }
    const r = autoFormation(state);
    if (!r.ok) { setMsg(`⚠ ${r.reason}`); fx('error'); bump(); return; }
    setMsg(added ? `🪄 ${added}명 편성 · 전열 ${r.front.length} · 후열 ${r.back.length}`
                 : `🪄 진형 재배치 · 전열 ${r.front.length} · 후열 ${r.back.length}`);
    fx('success');
    bump();
  };

  return (
    <View style={p.wrap}>
      {/* 카드 가로 목록 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.deck}>
        {shown.length === 0 && <Text style={p.empty}>이 속성의 {concept.terms.unit}이 없습니다</Text>}
        {shown.map((u) => {
          const id = identity(concept, u);
          const inParty = partySet.has(u.uid);
          return (
            <TouchableOpacity key={u.uid} style={[p.card, inParty && p.cardOn]} activeOpacity={0.85}
              onPress={() => toggle(u)}
              accessibilityRole="button"
              accessibilityState={{ selected: inParty }}
              accessibilityLabel={`${id.name} ${u.level}레벨 ${inParty ? '편성됨 · 누르면 해제' : '누르면 편성'}`}>
              {isOn('rarity') && (
                <View style={[p.medal, { backgroundColor: GRADE_BG[u.rarity] || '#6b6b6b' }]}>
                  <Text style={p.medalTx}>{GRADE[u.rarity] || 'C'}</Text>
                </View>
              )}
              <Portrait emoji={id.emoji} image={charImage(concept.id, u.characterId)} rarity={u.rarity} size={40} />
              {inParty && <Text style={p.check}>✅</Text>}
              <Text style={p.lv}>{u.level}레벨</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 속성 필터 바 */}
      <View style={p.filter}>
        <Text style={p.count}>{state.party.length}/{MAX_PARTY}</Text>
        {isOn('elements') && (<>
          <TouchableOpacity onPress={() => setBarOpen((v) => !v)} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel={barOpen ? '속성 필터 접기' : '속성 필터 펼치기'}>
            <Text style={p.fold}>{barOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setElemFilter(null)}
            style={[p.all, !elemFilter && p.allOn]}
            accessibilityRole="button" accessibilityLabel="전체 속성">
            <Text style={[p.allTx, !elemFilter && p.allTxOn]}>ALL</Text>
          </TouchableOpacity>
          {barOpen && Object.keys(concept.elements || {}).map((eid) => {
            const on = elemFilter === eid;
            return (
              <TouchableOpacity key={eid} activeOpacity={0.8} style={[p.eChip, on && p.eChipOn]}
                onPress={() => setElemFilter(on ? null : eid)}
                accessibilityRole="button" accessibilityLabel={`${concept.elements[eid].name} 속성`}>
                <Text style={p.eChipIc}>{elementMeta(concept, eid)?.emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </>)}
      </View>

      {/* 하단 액션 — 일괄 진형 배치 · 전투 */}
      <View style={p.actions}>
        <TouchableOpacity style={p.sub} activeOpacity={0.85} onPress={doArrange}
          accessibilityRole="button" accessibilityLabel="일괄 진형 배치 — 빈 자리를 채우고 전열·후열로 배치">
          <Text style={p.subTx}>일괄 진형 배치</Text>
        </TouchableOpacity>
        <TouchableOpacity style={p.main} activeOpacity={0.85}
          onPress={() => { fx('tap'); onBattle?.(); }}
          accessibilityRole="button" accessibilityLabel="편성 닫고 전투 보기">
          <Text style={p.mainTx}>전투</Text>
        </TouchableOpacity>
      </View>
      {/* 자리를 항상 차지한다 — 조건부로 띄우면 문구가 뜰 때 버튼이 밀려 올라간다(Gim 지시 2026-07-27) */}
      <Text style={p.msg} numberOfLines={1}>{msg || ' '}</Text>
    </View>
  );
}

const p = StyleSheet.create({
  wrap: { backgroundColor: '#2b2013', borderTopWidth: 2, borderTopColor: '#6b543a', paddingBottom: 4 },

  deck: { gap: 5, paddingHorizontal: 8, paddingTop: 7 },
  empty: { color: T.muted, fontSize: 11, paddingVertical: 14 },
  card: { width: 56, borderRadius: 7, borderWidth: 2, borderColor: '#6b543a', backgroundColor: '#5a4326', alignItems: 'center', paddingTop: 7, paddingBottom: 3 },
  cardOn: { borderColor: T.accent, backgroundColor: '#8a5a2b' },
  medal: { position: 'absolute', left: 2, top: 2, minWidth: 17, height: 15, borderRadius: 8, borderWidth: 1, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  medalTx: { color: '#fff', fontSize: 8, fontWeight: '900' },
  check: { position: 'absolute', right: 1, top: 1, fontSize: 12, zIndex: 3 },
  lv: { color: '#f5e6c8', fontSize: 9, fontWeight: '900', marginTop: 2 },

  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingTop: 6 },
  count: { color: T.accent, fontSize: 11, fontWeight: '900', minWidth: 30 },
  fold: { color: '#b09a76', fontSize: 14, fontWeight: '900', width: 14, textAlign: 'center' },
  all: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  allOn: { borderColor: T.accent, backgroundColor: 'rgba(255,201,60,0.15)' },
  allTx: { color: '#b09a76', fontSize: 9, fontWeight: '900' },
  allTxOn: { color: T.accent },
  eChip: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#3b2d1d', borderWidth: 1, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  eChipOn: { borderColor: T.accent, borderWidth: 2 },
  eChipIc: { fontSize: 13 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingTop: 7 },
  sub: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#5a4326', borderWidth: 2, borderColor: '#8a6a3c', alignItems: 'center' },
  subTx: { color: '#f0dcb4', fontSize: 12, fontWeight: '900' },
  main: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f', alignItems: 'center' },
  mainTx: { color: '#3d2a00', fontSize: 13, fontWeight: '900' },
  msg: { color: T.danger, fontSize: 10, fontWeight: '900', textAlign: 'center', paddingTop: 4 },
});
