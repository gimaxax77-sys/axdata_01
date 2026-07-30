// 영웅 상세 · 장비 탭 — 호드워 `장비` 패널. 기준: Gim 실기 캡처(2026-07-27).
//   골격 = 룬 슬롯 5칸(윗줄) · 장비 슬롯 4칸(등급색 + 속성 뱃지) · [일괄 해제][일괄 장착].
//   엘드리아 대응 / 의도적 차이
//     · gear·runes 모듈이 파킹이라 **슬롯은 전부 잠금**이다(docs/PARKED.md).
//       캡처의 배치·색·버튼만 먼저 맞춰 두고, 모듈을 켜면 아이템만 꽂으면 된다.
//     · 캡처의 룬 칸은 2개 개방 + 3개 잠금이지만, 여기선 근거가 없어 전부 잠금으로 둔다.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';
import { elementMeta, identity } from '../../system/concepts/index.mjs';

// 장비 4부위 — 호드워 캡처 순서(무기 · 방어구 · 투구 · 신발)
const SLOTS = [
  { k: 'weapon', ic: '⚔️', label: '무기' },
  { k: 'armor', ic: '🥋', label: '방어구' },
  { k: 'helm', ic: '🪖', label: '투구' },
  { k: 'boots', ic: '👢', label: '신발' },
];
const RUNE_SLOTS = 5;

export default function HeroGearPanel({ concept, unit, onMsg }) {
  const em = identity(concept, unit).element && elementMeta(concept, identity(concept, unit).element);
  const locked = () => { fx('error'); onMsg?.('🔒 장비 모듈이 아직 붙어 있지 않습니다'); };

  return (
    <View style={g.wrap}>
      {/* 룬 슬롯 5칸 */}
      <View style={g.runeRow}>
        {Array.from({ length: RUNE_SLOTS }).map((_, i) => (
          <TouchableOpacity key={i} style={g.rune} activeOpacity={0.85} onPress={locked}
            accessibilityRole="button" accessibilityLabel={`룬 슬롯 ${i + 1} (잠김)`}>
            <Text style={g.runeIc}>🔒</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 장비 슬롯 4칸 — 좌상단 속성 뱃지, 등급색 프레임 */}
      <View style={g.gearRow}>
        {SLOTS.map((s) => (
          <TouchableOpacity key={s.k} style={g.gear} activeOpacity={0.85} onPress={locked}
            accessibilityRole="button" accessibilityLabel={`${s.label} 슬롯 (잠김)`}>
            {em ? <View style={g.elem}><Text style={g.elemTx}>{em.emoji}</Text></View> : null}
            <Text style={g.gearIc}>{s.ic}</Text>
            <Text style={g.gearLock}>🔒</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 하단 2버튼 — 좌 어두움 · 우 금색 */}
      <View style={g.btns}>
        <TouchableOpacity style={g.off} activeOpacity={0.85} onPress={locked}
          accessibilityRole="button" accessibilityLabel="일괄 해제">
          <Text style={g.offTx}>일괄 해제</Text>
        </TouchableOpacity>
        <TouchableOpacity style={g.on} activeOpacity={0.85} onPress={locked}
          accessibilityRole="button" accessibilityLabel="일괄 장착">
          <Text style={g.onTx}>일괄 장착</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  wrap: { padding: 10 },

  runeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rune: { width: 52, height: 40, borderRadius: 6, backgroundColor: '#9b9b9b', borderWidth: 2, borderColor: '#7d7d7d', alignItems: 'center', justifyContent: 'center' },
  runeIc: { fontSize: 15, opacity: 0.75 },

  gearRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  gear: { width: 62, height: 62, borderRadius: 8, backgroundColor: '#a8632c', borderWidth: 2, borderColor: '#e0a050', alignItems: 'center', justifyContent: 'center' },
  gearIc: { fontSize: 24, opacity: 0.55 },
  gearLock: { position: 'absolute', right: 3, bottom: 2, fontSize: 11 },
  elem: { position: 'absolute', left: -3, top: -3, width: 17, height: 17, borderRadius: 9, backgroundColor: 'rgba(20,30,45,0.85)', borderWidth: 1, borderColor: '#cfe3f2', alignItems: 'center', justifyContent: 'center' },
  elemTx: { fontSize: 9 },

  btns: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10 },
  off: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 8, backgroundColor: '#8a6d47', borderWidth: 2, borderColor: '#6b543a' },
  offTx: { color: '#e8d5ae', fontSize: 12, fontWeight: '900' },
  on: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f' },
  onTx: { color: '#3d2a00', fontSize: 12, fontWeight: '900' },
});
