// 모집(소환) 화면 — 호드워 「영웅 제단」. 기준: Gim 실기 캡처(2026-07-26 확인), docs/HORDWAR_SPEC.md.
//   골격 = 좌측 ❓확률 · 우상단 천장 게이지 · 대형 배너 · 배너 캐러셀 3 · 비용 · [1회 모집][10회 모집]
//          · 하단 좌 뒤로 · 하단 우 애니메이션 토글.
//   엘드리아 대응 / 의도적 차이
//     · 재화 — 호드워는 📜모집권(1회)/💎다이아(10회) 2종. 엘드리아는 소환석(summon) 단일이라 한 줄로 표시.
//     · 천장 — 호드워 100회. 엘드리아는 gacha.mjs PITY_HARD(90)를 그대로 읽는다.
//     · 종족·우정 모집 — 대응 모듈이 없어 🔒 표시만 하고 막지는 않는다(docs/PARKED.md 자물쇠 정책).
//     · '추천'·🔍등장영웅 아이콘, '오늘 소환 상한' — 대응 기능·개념이 없어 넣지 않았다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, GRADE } from '../theme';
import { fmt } from '../components';
import { fx } from '../feedback';
import { charImage } from '../charImages';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { summonOne, summonMulti, PULL_COST, PITY_HARD, MULTI_FLOOR, RARITY } from '../../system/core/gacha.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import SummonResult from './SummonResult';

// 배너 캐러셀 — 호드워는 종족/일반/우정 3종. 엘드리아는 '일반'만 실제 동작한다.
const BANNERS = [
  { key: 'race', label: '종족 모집', grad: ['#4a3570', '#2a1c46'], open: false },
  { key: 'normal', label: '일반 모집', grad: ['#2f6b45', '#173a26'], open: true },
  { key: 'friend', label: '우정 모집', grad: ['#8a4a24', '#4a2612'], open: false },
];

// 확률표 — gacha.mjs RARITY의 weight를 그대로 백분율로 환산(하드코딩하지 않는다).
function oddsRows() {
  const list = Object.values(RARITY);
  const total = list.reduce((s, x) => s + x.weight, 0);
  return list
    .slice()
    .reverse()
    .map((x) => ({ grade: GRADE[x.id] || x.id, label: x.label, pct: ((x.weight / total) * 100).toFixed(1) }));
}

export default function SummonScreen({ state, bump, concept, onClose }) {
  const [banner, setBanner] = useState('normal');
  const [odds, setOdds] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState(null);

  const pool = concept.roster;
  const sumE = concept.resources.summon.emoji;
  const bal = state.wallet.summon || 0;
  const cost1 = PULL_COST.summon;
  const cost10 = PULL_COST.summon * 10;
  const skipAnim = !!(state.settings && state.settings.skipGachaAnim);
  const cur = BANNERS.find((b) => b.key === banner) || BANNERS[1];

  // 소환 결과 → 결과 오버레이가 그릴 카드 데이터로 변환.
  const toCell = (res) => {
    const id = identity(concept, res.unit);
    const arch = concept.archetypes[res.unit.archetype];
    return {
      uid: res.uid,
      rarity: res.rarity,
      name: id.name,
      emoji: id.emoji,
      image: charImage(concept.id, res.unit.characterId),
      elem: elementMeta(concept, id.element)?.emoji || null,
      role: arch ? arch.emoji : '❔',
      level: res.unit.level,
    };
  };

  const pull = (n) => {
    setMsg(null);
    if (!cur.open) { fx('error'); setMsg(`${cur.label}은 아직 준비 중입니다`); return; }
    let cells = [];
    if (n === 1) {
      const res = summonOne(state, Math.random, pool);
      if (res.ok) cells = [toCell(res)];
    } else {
      const res = summonMulti(state, n, Math.random, pool);
      if (res.ok) cells = res.results.map(toCell);
    }
    if (!cells.length) {
      fx('error');
      setMsg(`${concept.resources.summon.name}이 부족합니다 (${n === 1 ? cost1 : cost10} 필요)`);
      bump();
      return;
    }
    recordMission(state, 'summon', cells.length);
    fx('summon');
    setResult({ cells, cost: n === 1 ? cost1 : cost10 });
    bump();
  };

  const pityPct = Math.min(100, (state.gacha.pity / PITY_HARD) * 100);
  const topGrade = GRADE.UR;      // 천장 보장 표기용 최고 등급
  const floorGrade = GRADE[MULTI_FLOOR];

  return (
    <View style={s.wrap}>
      {/* 배너 배경 — 아트가 생기면 이 그라디언트를 이미지로 교체한다. */}
      <LinearGradient colors={cur.grad} style={s.bg} pointerEvents="none" />

      {/* 좌측 세로 아이콘 — ❓확률 */}
      <View style={s.leftCol}>
        <TouchableOpacity style={[s.round, odds && s.roundOn]} activeOpacity={0.85}
          onPress={() => { fx('tap'); setOdds((v) => !v); }}
          accessibilityRole="button" accessibilityLabel={odds ? '확률 닫기' : '등급 확률 보기'}>
          <Text style={s.roundTx}>❓</Text>
        </TouchableOpacity>
      </View>

      {/* 우상단 천장 게이지 — 확정 획득까지 남은 횟수 */}
      <View style={s.pity}>
        <Text style={s.pityTx}>🎁 확정 획득 {topGrade}영웅</Text>
        <View style={s.pityBar}>
          <View style={[s.pityFill, { width: `${pityPct}%` }]} />
        </View>
        <Text style={s.pityNum}>
          <Text style={s.pityNumCur}>{state.gacha.pity}</Text>/{PITY_HARD}
        </Text>
      </View>

      {/* 확률표 — ❓ 토글 */}
      {odds && (
        <View style={s.odds}>
          {oddsRows().map((o) => (
            <View key={o.grade} style={s.oddsRow}>
              <Text style={s.oddsGrade}>{o.grade}</Text>
              <Text style={s.oddsLabel}>{o.label}</Text>
              <Text style={s.oddsPct}>{o.pct}%</Text>
            </View>
          ))}
          <Text style={s.oddsNote}>{PITY_HARD}회 안에 {topGrade}급 확정 · 10회 모집은 {floorGrade}급 이상 1장 이상 보장</Text>
        </View>
      )}

      {/* 중앙 제단 일러스트 자리 */}
      <View style={s.stage}>
        <Text style={s.altar}>🗿</Text>
        <Text style={s.copy}>10회 모집 시 {floorGrade}급 이상 확정</Text>
      </View>

      {/* 배너 캐러셀 — 선택된 것만 금색 테두리 */}
      <View style={s.carousel}>
        {BANNERS.map((b) => {
          const on = b.key === banner;
          return (
            <TouchableOpacity key={b.key} style={[s.bcard, on && s.bcardOn]} activeOpacity={0.85}
              onPress={() => { fx('tap'); setBanner(b.key); setMsg(null); }}
              accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={b.open ? b.label : `${b.label} (준비 중)`}>
              <LinearGradient colors={b.grad} style={s.bcardBg} pointerEvents="none" />
              <Text style={s.bcardTx} numberOfLines={1}>{b.label}</Text>
              {!b.open && <Text style={s.bcardLock}>🔒</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.dots}>
        {BANNERS.map((b) => <View key={b.key} style={[s.dot, b.key === banner && s.dotOn]} />)}
      </View>

      {/* 비용 + 모집 버튼 2개 */}
      <View style={s.costRow}>
        <Text style={s.costTx}>{sumE} {cost1}</Text>
        <Text style={s.costTx}>{sumE} {cost10}</Text>
      </View>
      <View style={s.btnRow}>
        <TouchableOpacity style={[s.btn, bal < cost1 && s.btnOff]} activeOpacity={0.85}
          disabled={bal < cost1} onPress={() => pull(1)}
          accessibilityRole="button" accessibilityState={{ disabled: bal < cost1 }}
          accessibilityLabel={`1회 모집 · ${concept.resources.summon.name} ${cost1} 소모`}>
          <Text style={s.btnTx}>1회 모집</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnGold, bal < cost10 && s.btnOff]} activeOpacity={0.85}
          disabled={bal < cost10} onPress={() => pull(10)}
          accessibilityRole="button" accessibilityState={{ disabled: bal < cost10 }}
          accessibilityLabel={`10회 모집 · ${concept.resources.summon.name} ${cost10} 소모`}>
          <Text style={[s.btnTx, s.btnTxGold]}>10회 모집</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.bal}>보유 {sumE} {fmt(bal)}</Text>
      {/* 자리를 항상 차지한다 — 뜰 때 모집 버튼이 밀리지 않게(Gim 지시 2026-07-27) */}
      <Text style={s.msg} numberOfLines={1}>{msg || ' '}</Text>

      {/* 하단 — 좌 뒤로 · 우 애니메이션 토글 */}
      <View style={s.footer}>
        <TouchableOpacity style={s.back} activeOpacity={0.85}
          onPress={() => { fx('tap'); onClose(); }}
          accessibilityRole="button" accessibilityLabel="요새로 돌아가기">
          <Text style={s.backTx}>◀</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.anim} activeOpacity={0.85}
          onPress={() => {
            state.settings = state.settings || {};
            state.settings.skipGachaAnim = !state.settings.skipGachaAnim;
            fx('tap');
            bump();
          }}
          accessibilityRole="switch" accessibilityState={{ checked: !skipAnim }}
          accessibilityLabel="소환 애니메이션">
          <View style={[s.switch, !skipAnim && s.switchOn]}>
            <View style={[s.knob, !skipAnim && s.knobOn]} />
          </View>
          <Text style={s.animTx}>애니메이션</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <SummonResult
          cells={result.cells}
          cost={result.cost}
          canRepeat={bal >= cost10}
          instant={skipAnim}
          onClose={() => setResult(null)}
          onRepeat={() => { setResult(null); pull(10); }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  leftCol: { position: 'absolute', left: 8, top: 10, gap: 7, zIndex: 5 },
  round: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, borderColor: '#8a6a3c', alignItems: 'center', justifyContent: 'center' },
  roundOn: { borderColor: T.accent },
  roundTx: { fontSize: 14 },

  // 천장 게이지 — 우상단
  pity: { position: 'absolute', right: 8, top: 10, alignItems: 'flex-end', zIndex: 5 },
  pityTx: { color: '#f0dcb4', fontSize: 9, fontWeight: '900' },
  pityBar: { width: 92, height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: '#8a6a3c', marginTop: 2, overflow: 'hidden' },
  pityFill: { height: 7, backgroundColor: T.accent },
  pityNum: { color: '#e6d3ae', fontSize: 10, fontWeight: '900', marginTop: 1 },
  pityNumCur: { color: T.danger },

  // 확률표 패널
  odds: { position: 'absolute', left: 46, top: 10, zIndex: 6, backgroundColor: 'rgba(12,9,6,0.94)', borderWidth: 2, borderColor: '#8a6a3c', borderRadius: 8, padding: 8, gap: 3, maxWidth: 200 },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  oddsGrade: { color: T.accent, fontSize: 10, fontWeight: '900', width: 20 },
  oddsLabel: { color: '#e6d3ae', fontSize: 10, fontWeight: '800', flex: 1 },
  oddsPct: { color: '#fff', fontSize: 10, fontWeight: '900' },
  oddsNote: { color: '#b09a76', fontSize: 8, fontWeight: '700', marginTop: 3 },

  // 중앙 제단
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  altar: { fontSize: 108 },
  copy: { color: T.accent, fontSize: 14, fontWeight: '900', marginTop: 8, textShadowColor: '#000', textShadowRadius: 3 },

  // 배너 캐러셀 — 가로 3칸, 가운데가 크게 보이도록 선택칸만 테두리 강조.
  carousel: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, alignItems: 'center' },
  bcard: { flex: 1, height: 52, borderRadius: 8, borderWidth: 2, borderColor: '#6b543a', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bcardOn: { borderColor: T.accent, borderWidth: 3, height: 60 },
  bcardBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  bcardTx: { color: '#f5e6c8', fontSize: 11, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 2 },
  bcardLock: { position: 'absolute', top: 3, right: 5, fontSize: 10 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: T.accent },

  costRow: { flexDirection: 'row', justifyContent: 'center', gap: 60, paddingTop: 8 },
  costTx: { color: '#f0dcb4', fontSize: 12, fontWeight: '900' },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingTop: 4 },
  btn: { minWidth: 118, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: '#5a4326', borderWidth: 2, borderColor: '#8a6a3c' },
  btnGold: { backgroundColor: T.accent, borderColor: '#fff0c0' },
  btnOff: { opacity: 0.45 },
  btnTx: { color: '#f0dcb4', fontSize: 13, fontWeight: '900' },
  btnTxGold: { color: '#3d2a00' },
  bal: { color: '#b09a76', fontSize: 10, fontWeight: '800', textAlign: 'center', paddingTop: 5 },
  msg: { color: T.danger, fontSize: 10, fontWeight: '900', textAlign: 'center', paddingTop: 3 },

  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  back: { width: 38, height: 30, borderRadius: 8, backgroundColor: '#7a2f22', borderWidth: 2, borderColor: '#b8543c', alignItems: 'center', justifyContent: 'center' },
  backTx: { color: '#ffd9c8', fontSize: 13, fontWeight: '900' },
  anim: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  switch: { width: 30, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: '#8a6a3c', justifyContent: 'center' },
  switchOn: { backgroundColor: T.accent, borderColor: '#fff0c0' },
  knob: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#b09a76', marginLeft: 2 },
  knobOn: { backgroundColor: '#3d2a00', marginLeft: 15 },
  animTx: { color: '#e6d3ae', fontSize: 9, fontWeight: '800' },
});
