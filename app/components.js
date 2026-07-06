import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from './theme';

// 상단 자원 바
export function ResourceBar({ concept, wallet }) {
  const keys = ['currency', 'growth', 'summon', 'gem'];
  return (
    <View style={s.resbar}>
      {keys.map((k) => {
        const r = concept.resources[k];
        return (
          <View key={k} style={s.rescell}>
            <Text style={s.resEmoji}>{r.emoji}</Text>
            <Text style={s.resVal}>{fmt(wallet[k] || 0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// 버튼
export function Btn({ label, onPress, disabled, kind = 'primary', small }) {
  const bg = disabled ? T.line : kind === 'gold' ? T.accent : kind === 'ghost' ? 'transparent' : T.primary;
  const fg = kind === 'gold' ? '#3a2a05' : disabled ? T.muted : '#fff';
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg }, kind === 'ghost' && s.btnGhost, small && s.btnSmall]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[s.btnText, { color: kind === 'ghost' ? T.text : fg }, small && { fontSize: 13 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function fmt(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

const s = StyleSheet.create({
  resbar: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 14, padding: 6, gap: 6 },
  rescell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  resEmoji: { fontSize: 16 },
  resVal: { color: T.text, fontWeight: '800', fontSize: 15 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnGhost: { borderWidth: 1, borderColor: T.line },
  btnText: { fontWeight: '800', fontSize: 15 },
  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.line },
});
