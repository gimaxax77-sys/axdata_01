// 준비 중 패널 — 아직 내용이 없는 자리로 **실제로 들어가지게** 해주는 공용 화면 조각.
//   Gim 지시(2026-07-26): "자물쇠 잠겨있는 탭들도 일단은 모두 개방할 것(표시는 해놓고).
//   테스트 및 내부 레이아웃 진행해야 하므로 출시전 정식으로 잠그면 됨."
//   → 누르면 토스트로 막던 것을 전부 이 패널로 바꿨다. 🔒 표시는 남겨 둔다.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';

// icon/title 은 필수, note 는 "여기에 무엇이 들어올지" 한 줄, plan 은 목록.
// onBack 이 있으면 좌상단 뒤로가기를 그린다(전체화면으로 쓸 때).
export default function ComingSoon({ icon = '🚧', title, note, plan = [], onBack }) {
  return (
    <View style={p.wrap}>
      {onBack && (
        <TouchableOpacity style={p.back} activeOpacity={0.85} onPress={() => { fx('tap'); onBack(); }}
          accessibilityRole="button" accessibilityLabel="뒤로">
          <Text style={p.backTx}>◀</Text>
        </TouchableOpacity>
      )}
      <View style={p.body}>
        <Text style={p.icon}>{icon}</Text>
        <Text style={p.title}>🔒 {title}</Text>
        <Text style={p.note}>{note || '준비 중입니다. 지금은 자리만 잡아 둔 상태예요.'}</Text>
        {plan.length > 0 && (
          <View style={p.card}>
            <Text style={p.cardHead}>들어올 내용</Text>
            {plan.map((line) => <Text key={line} style={p.line}>· {line}</Text>)}
          </View>
        )}
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  wrap: { flex: 1 },
  back: { position: 'absolute', left: 8, top: 8, width: 32, height: 32, borderRadius: 8, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  backTx: { color: T.text, fontSize: 14, fontWeight: '900' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  icon: { fontSize: 42, opacity: 0.6 },
  title: { color: T.text, fontSize: 15, fontWeight: '900', marginTop: 10 },
  note: { color: T.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  card: { marginTop: 16, alignSelf: 'stretch', backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, borderRadius: 11, padding: 12 },
  cardHead: { color: T.accent, fontSize: 11, fontWeight: '900', marginBottom: 6 },
  line: { color: T.muted, fontSize: 11, lineHeight: 18 },
});
