import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, rarityMeta } from './theme';
import { fx } from './feedback';

// ── 캐릭터 초상 — 등급 프레임 + 글로우. 로스터/파티/소환/도감 공용 ──
//   image(있으면): 캐릭터 일러스트를 프레임 안에 렌더. 없으면 emoji 폴백.
//   React.memo — 방치 틱(초당 리렌더)에서 그라데이션 재계산을 건너뛴다.
export const Portrait = React.memo(function Portrait({ emoji, image = null, rarity = 'N', size = 56, badge = false, glow = true, dim = false, style }) {
  const rm = rarityMeta(rarity);
  const radius = size * 0.26;
  const ring = Math.max(2, size * 0.045);
  const innerR = radius - ring;
  return (
    <View style={[glow && { shadowColor: rm.color, shadowOpacity: rarity === 'N' ? 0 : 0.9, shadowRadius: size * 0.16, shadowOffset: { width: 0, height: 0 } }, style]}>
      <LinearGradient colors={rm.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: radius, padding: ring, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={[T.surface2, T.surface]} style={{ width: '100%', height: '100%', borderRadius: innerR, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {image
            ? <Image source={image} style={{ width: '100%', height: '100%', opacity: dim ? 0.4 : 1 }} resizeMode="cover" />
            : <Text style={{ fontSize: size * 0.5, opacity: dim ? 0.4 : 1 }}>{emoji}</Text>}
        </LinearGradient>
      </LinearGradient>
      {badge && (
        <View style={[bs.badge, { backgroundColor: rm.color }]}>
          <Text style={bs.badgeText}>{rarity}</Text>
        </View>
      )}
    </View>
  );
});

// 상단 자원 바 — 유리질 pill
export function ResourceBar({ concept, wallet }) {
  const keys = ['currency', 'growth', 'summon', 'gem'];
  return (
    <LinearGradient colors={T.surfaceGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.resbar}>
      {keys.map((k) => {
        const r = concept.resources[k];
        return (
          <View key={k} style={s.rescell}>
            <Text style={s.resEmoji}>{r.emoji}</Text>
            <Text style={s.resVal}>{fmt(wallet[k] || 0)}</Text>
          </View>
        );
      })}
    </LinearGradient>
  );
}

// 버튼 — gold/primary는 그라데이션, ghost는 외곽선.
// sfx: 누를 때 재생할 피드백 이름(기본 'tap', false면 무음 — 화면에서 직접 재생할 때).
export function Btn({ label, onPress, disabled, kind = 'primary', small, sfx = 'tap' }) {
  const press = onPress ? (e) => { if (sfx) fx(sfx); onPress(e); } : onPress;
  const grad = kind === 'gold' ? T.accentGrad : T.primaryGrad;
  const fg = kind === 'gold' ? '#3a2a05' : '#fff';
  const content = (
    <Text style={[s.btnText, { color: kind === 'ghost' ? T.text : fg }, small && { fontSize: 13 }]} numberOfLines={1}>{label}</Text>
  );
  if (kind === 'ghost' || disabled) {
    return (
      <TouchableOpacity style={[s.btn, small && s.btnSmall, kind === 'ghost' ? s.btnGhost : s.btnDisabled]}
        onPress={press} disabled={disabled} activeOpacity={0.75}>
        <Text style={[s.btnText, { color: disabled ? T.muted : T.text }, small && { fontSize: 13 }]} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={press} disabled={disabled} activeOpacity={0.82}
      style={[{ borderRadius: small ? 10 : 12 }, kind === 'gold' ? s.glowGold : s.glowPrimary]}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[s.btn, small && s.btnSmall]}>
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return (
    <View style={[s.card, style]}>
      <LinearGradient colors={T.surfaceGrad} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: (style && flattenRadius(style)) || 16 }]} pointerEvents="none" />
      {children}
    </View>
  );
}
function flattenRadius(style) {
  const arr = Array.isArray(style) ? style : [style];
  for (const x of arr) { if (x && x.borderRadius != null) return x.borderRadius; }
  return null;
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

const bs = StyleSheet.create({
  badge: { position: 'absolute', bottom: -4, alignSelf: 'center', left: 0, right: 0, marginHorizontal: 'auto', width: 26, paddingVertical: 1, borderRadius: 6, alignItems: 'center' },
  badgeText: { color: '#1a1225', fontSize: 10, fontWeight: '900' },
});

const s = StyleSheet.create({
  resbar: { flexDirection: 'row', borderRadius: 14, padding: 6, gap: 6, borderWidth: 1, borderColor: T.line },
  rescell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  resEmoji: { fontSize: 16 },
  resVal: { color: T.text, fontWeight: '800', fontSize: 15 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnGhost: { borderWidth: 1, borderColor: T.line, backgroundColor: 'rgba(255,255,255,0.03)' },
  btnDisabled: { backgroundColor: T.line, opacity: 0.6 },
  btnText: { fontWeight: '800', fontSize: 15 },
  glowGold: { shadowColor: T.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  glowPrimary: { shadowColor: T.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.line, overflow: 'hidden', backgroundColor: T.surface, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
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
