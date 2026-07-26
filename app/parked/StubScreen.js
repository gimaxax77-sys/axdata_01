// [파킹] 빈 골격 화면 — 필드·길드·혜택이 임시로 쓰던 자리. docs/PARKED.md 참고.
//   2026-07-26 Gim이 호드워 실기 캡처 3장을 제공해 FieldScreen·GuildScreen·PerkScreen으로 대체됨.
//   호드워 실기 캡처에서도 이 세 탭은 잠겨 있어 베낄 화면이 없다(docs/HORDWAR_SPEC.md).
//   구축 단계에는 6탭을 전부 열어두고, 자물쇠는 출시 직전에 다시 채운다(Gim 지시).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../theme';

// stub: { icon, title, desc, plan:[문자열] }
export default function StubScreen({ stub = {} }) {
  return (
    <View style={p.wrap}>
      <Text style={p.icon}>{stub.icon || '🚧'}</Text>
      <Text style={p.title}>{stub.title || '준비 중'}</Text>
      <Text style={p.desc}>{stub.desc || '이 탭의 내용은 아직 정해지지 않았습니다.'}</Text>
      {(stub.plan || []).length > 0 && (
        <View style={p.card}>
          <Text style={p.cardHead}>들어올 예정</Text>
          {stub.plan.map((line) => <Text key={line} style={p.line}>· {line}</Text>)}
        </View>
      )}
    </View>
  );
}

const p = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  icon: { fontSize: 46, opacity: 0.65 },
  title: { color: T.text, fontSize: 18, fontWeight: '900', marginTop: 10 },
  desc: { color: T.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  card: { marginTop: 18, alignSelf: 'stretch', backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, borderRadius: 12, padding: 12 },
  cardHead: { color: T.accent, fontSize: 11, fontWeight: '900', marginBottom: 6 },
  line: { color: T.muted, fontSize: 11, lineHeight: 18 },
});
