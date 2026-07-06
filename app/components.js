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

// 잠긴 콘텐츠 안내 패널
export function LockedPanel({ title, stage, desc }) {
  return (
    <View style={s.locked}>
      <Text style={s.lockedIcon}>🔒</Text>
      <Text style={s.lockedTitle}>{title} 잠김</Text>
      <Text style={s.lockedStage}>스테이지 {stage} 도달 시 해금</Text>
      {desc ? <Text style={s.lockedDesc}>{desc}</Text> : null}
    </View>
  );
}

// 배수 선택 토글 (×1 / ×10 / ×100). value/onChange 로 제어.
export function MultiToggle({ value, onChange, options = [1, 10, 100] }) {
  return (
    <View style={s.multi}>
      {options.map((n) => {
        const on = n === value;
        return (
          <TouchableOpacity key={n} style={[s.multiCell, on && s.multiOn]} activeOpacity={0.8}
            onPress={() => onChange(n)}>
            <Text style={[s.multiText, on && s.multiTextOn]}>×{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 액션 fn 을 최대 n회 반복 실행. { ok:false } 를 받으면 중단.
// 반환: 실제 성공 횟수. (자원 부족 시 가능한 만큼만 실행)
export function repeat(fn, n) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    const r = fn();
    if (r && r.ok === false) break;
    done += 1;
  }
  return done;
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
  multi: { flexDirection: 'row', backgroundColor: T.surface2, borderRadius: 10, padding: 3, gap: 3 },
  multiCell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  multiOn: { backgroundColor: T.primary },
  multiText: { color: T.muted, fontWeight: '800', fontSize: 13 },
  multiTextOn: { color: '#fff' },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  lockedIcon: { fontSize: 56, marginBottom: 12, opacity: 0.8 },
  lockedTitle: { color: T.text, fontWeight: '900', fontSize: 22 },
  lockedStage: { color: T.accent, fontWeight: '700', fontSize: 15, marginTop: 8 },
  lockedDesc: { color: T.muted, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 19 },
});
