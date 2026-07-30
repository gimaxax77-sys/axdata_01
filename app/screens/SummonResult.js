// 모집(소환) 결과 오버레이 — 호드워 10연 결과 화면. 기준: Gim 실기 캡처, docs/HORDWAR_SPEC.md.
//   골격 = 어두운 배경 · 카드 3·4·3 배치 · 등급별 카드색 · 하단 [확인] [10회 모집].
//   카드 = 상단 등급 메달 · 좌측 세로 원형뱃지(속성·역할) · 일러스트 · Lv 리본 · 이름.
//   엘드리아 대응 / 의도적 차이
//     · 호드워는 배경을 블러 처리한다. RN web에서 blur는 비용이 커 반투명 암막으로 대신했다.
//     · 순차 등장은 설정의 '애니메이션'(skipGachaAnim) · 접근성 감소모션을 둘 다 따른다.
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { T, GRADE, GRADE_BG } from '../theme';
import { Portrait } from '../components';
import { fx } from '../feedback';
import { reducedMotion } from '../motion';

// 등급별 카드 바탕 — 호드워는 B파랑 / A보라 / S주황(+금색 글로우).
const CARD_BG = { UR: '#a03a2c', SSR: '#b8722a', SR: '#5c4a86', R: '#3a5c8a', N: '#4a4a52' };
const CARD_LINE = { UR: '#ffd77a', SSR: '#ffd77a', SR: '#a08fd0', R: '#7aa8d8', N: '#8a8a95' };

// 호드워는 10장을 3·4·3으로 앉힌다. 그 외 개수는 한 줄로.
function rowsOf(cells) {
  if (cells.length !== 10) return [cells];
  return [cells.slice(0, 3), cells.slice(3, 7), cells.slice(7, 10)];
}

// 결과 카드 한 장 — 등장 시 페이드+스케일(뒤 칸일수록 늦게).
const Cell = React.memo(function Cell({ index, cell, instant }) {
  const g = GRADE[cell.rarity] || 'C';
  const a = useRef(new Animated.Value(instant ? 1 : 0)).current;
  useEffect(() => {
    if (instant) { a.setValue(1); return; }
    a.setValue(0);
    Animated.timing(a, {
      toValue: 1, duration: 320, delay: Math.min(index, 12) * 70, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }] }}>
      <View style={[r.card, { backgroundColor: CARD_BG[cell.rarity] || CARD_BG.N, borderColor: CARD_LINE[cell.rarity] || CARD_LINE.N }]}>
        {/* 좌측 세로 원형 뱃지 — 속성 · 역할 */}
        <View style={r.badges}>
          {cell.elem ? <View style={r.badge}><Text style={r.badgeTx}>{cell.elem}</Text></View> : null}
          <View style={r.badge}><Text style={r.badgeTx}>{cell.role}</Text></View>
        </View>
        {/* 상단 중앙 등급 메달 */}
        <View style={[r.medal, { backgroundColor: GRADE_BG[cell.rarity] || GRADE_BG.N }]}>
          <Text style={r.medalTx}>{g}</Text>
        </View>
        <View style={r.art}>
          <Portrait emoji={cell.emoji} image={cell.image} rarity={cell.rarity} size={46} />
        </View>
        <View style={r.ribbon}><Text style={r.ribbonTx}>Lv{cell.level}</Text></View>
        <Text style={r.name} numberOfLines={2}>{cell.name}</Text>
      </View>
    </Animated.View>
  );
});

// cells = [{ rarity, name, emoji, image, elem, role, level }]
export default function SummonResult({ cells, cost, canRepeat, onClose, onRepeat, instant }) {
  const skip = instant || reducedMotion();
  const rows = rowsOf(cells);
  let n = -1; // 등장 순서 — 행을 넘어가도 계속 이어진다.

  return (
    <View style={r.wrap}>
      <View style={r.scrim} pointerEvents="none" />
      <View style={r.body}>
        {rows.map((row, ri) => (
          <View key={ri} style={r.row}>
            {row.map((cell) => { n += 1; return <Cell key={cell.uid} index={n} cell={cell} instant={skip} />; })}
          </View>
        ))}
      </View>

      <View style={r.foot}>
        <Text style={r.cost}>🔮 {cost}</Text>
        <View style={r.btnRow}>
          <TouchableOpacity style={r.btn} activeOpacity={0.85}
            onPress={() => { fx('tap'); onClose(); }}
            accessibilityRole="button" accessibilityLabel="결과 확인">
            <Text style={r.btnTx}>확인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[r.btn, r.btnGold, !canRepeat && r.btnOff]} activeOpacity={0.85}
            disabled={!canRepeat}
            onPress={() => { fx('tap'); onRepeat(); }}
            accessibilityRole="button" accessibilityState={{ disabled: !canRepeat }}
            accessibilityLabel={canRepeat ? '10회 다시 모집' : '소환석 부족'}>
            <Text style={[r.btnTx, r.btnTxGold]}>10회 모집</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 20, justifyContent: 'center' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,6,4,0.88)' },

  body: { gap: 8, paddingHorizontal: 10 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 7 },

  card: { width: 76, borderRadius: 8, borderWidth: 2, paddingTop: 9, paddingBottom: 4, alignItems: 'center' },
  badges: { position: 'absolute', left: 3, top: 5, gap: 3, zIndex: 3 },
  badge: { width: 15, height: 15, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: '#e0c08a', alignItems: 'center', justifyContent: 'center' },
  badgeTx: { fontSize: 8 },
  medal: { position: 'absolute', top: -1, alignSelf: 'center', minWidth: 22, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  medalTx: { color: '#fff', fontSize: 10, fontWeight: '900' },
  art: { marginTop: 8 },
  ribbon: { alignSelf: 'stretch', marginTop: 4, marginHorizontal: 3, backgroundColor: '#f0e0bd', borderRadius: 4, alignItems: 'center', paddingVertical: 1 },
  ribbonTx: { color: '#2c62a8', fontSize: 11, fontWeight: '900' },
  name: { color: '#f5e6c8', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2, paddingHorizontal: 2 },

  foot: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center', gap: 6 },
  cost: { color: '#e6d3ae', fontSize: 12, fontWeight: '900' },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { minWidth: 118, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: '#5a4326', borderWidth: 2, borderColor: '#8a6a3c' },
  btnGold: { backgroundColor: T.accent, borderColor: '#fff0c0' },
  btnOff: { opacity: 0.45 },
  btnTx: { color: '#f0dcb4', fontSize: 13, fontWeight: '900' },
  btnTxGold: { color: '#3d2a00' },
});
