import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, rarityMeta } from './theme';
import { fx } from './feedback';
import { reducedMotion } from './motion';

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

// ── 성급(Star Grade) 배지 — 별 2개를 36° 어긋나게 겹쳐 태양광 형태를 만든다.
//   tier(1~STAR_MAX)가 오를수록: 겹친 별이 더 또렷해지고 · 광선이 돋아나고
//   · 글로우가 커지고 · 최고 등급(5)에서만 은은하게 회전+맥동한다.
//   reducedMotion 존중(움직임 대신 정적 최종 상태로 표시).
export const StarBadge = React.memo(function StarBadge({ tier = 1, size = 40 }) {
  const clamped = Math.max(1, Math.min(5, tier));
  const t = (clamped - 1) / 4; // 0~1 정규화(단계별 강도 보간용)
  const reduce = reducedMotion();
  const rayCount = clamped >= 5 ? 12 : clamped >= 4 ? 8 : 0;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(reduce ? 1 : 0.5)).current;
  const prevTier = useRef(clamped);

  useEffect(() => {
    // 등급 상승 시 팝(bounce) 연출 — 최초 마운트에도 살짝 등장.
    if (reduce) { pop.setValue(1); return; }
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }).start();
    prevTier.current = clamped;
  }, [clamped]);

  useEffect(() => {
    if (reduce || rayCount === 0) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000 - clamped * 600, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, rayCount, clamped]);

  useEffect(() => {
    if (reduce || clamped < 5) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, clamped]);

  const haloOpacity = 0.10 + t * 0.30; // 0.10 → 0.40
  const haloScale = 1 + t * 0.35;
  const backStarOpacity = 0.25 + t * 0.65; // 겹친 별이 등급 오를수록 또렷해짐
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* 글로우 후광 — 등급이 오를수록 커지고 진해짐 */}
      <Animated.View style={{
        position: 'absolute', width: size * haloScale, height: size * haloScale,
        borderRadius: size, backgroundColor: T.accent, opacity: haloOpacity,
        transform: clamped >= 5 ? [{ scale: pulseScale }] : undefined,
      }} />
      {/* 태양광 — 4단계부터 광선이 돋고, 5단계는 천천히 회전 */}
      {rayCount > 0 && (
        <Animated.View style={{
          position: 'absolute', width: size, height: size,
          transform: [{ rotate: spinDeg }],
        }}>
          {Array.from({ length: rayCount }).map((_, i) => (
            <View key={i} style={{
              position: 'absolute', left: size / 2 - size * 0.028, top: size / 2 - size * 0.5,
              width: size * 0.056, height: size * 0.42, borderRadius: size * 0.03,
              backgroundColor: T.accent, opacity: 0.55,
              transform: [
                { translateY: -size * 0.08 },
                { rotate: `${(360 / rayCount) * i}deg` },
              ],
            }} />
          ))}
        </Animated.View>
      )}
      {/* 뒤 별 — 36° 어긋나게 겹쳐 이중 별(태양) 형태를 만든다 */}
      <Animated.Text style={{
        position: 'absolute', fontSize: size * 0.56, color: T.accentGrad[0],
        opacity: backStarOpacity, transform: [{ rotate: '36deg' }, { scale: pop }],
      }}>★</Animated.Text>
      {/* 앞 별 */}
      <Animated.Text style={{
        fontSize: size * 0.6, color: T.accent, fontWeight: '900',
        transform: [{ scale: pop }],
        textShadowColor: T.accent, textShadowRadius: 3 + t * 5, textShadowOffset: { width: 0, height: 0 },
      }}>★</Animated.Text>
    </View>
  );
});

// 자원 셀 — 값이 늘면 살짝 튀며 금색으로 번쩍(획득 강조).
//   방치 골드는 초당 흐르므로 강조 제외. 유의미한 재화(소환권·다이아)만 pulse.
function ResCell({ emoji, value, pulse }) {
  const prev = useRef(value);
  const scale = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (pulse && value > prev.current) {
      scale.setValue(1); flash.setValue(1);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 40, bounciness: 14 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
        ]),
        Animated.timing(flash, { toValue: 0, duration: 650, useNativeDriver: false }),
      ]).start();
    }
    prev.current = value;
  }, [value]);
  const color = pulse
    ? flash.interpolate({ inputRange: [0, 1], outputRange: [T.text, T.accent] })
    : T.text;
  return (
    <Animated.View style={[s.rescell, { transform: [{ scale }] }]}>
      <Text style={s.resEmoji}>{emoji}</Text>
      <Animated.Text style={[s.resVal, { color }]}>{fmt(value)}</Animated.Text>
    </Animated.View>
  );
}

// 상단 자원 바 — 유리질 pill
export function ResourceBar({ concept, wallet }) {
  const keys = ['currency', 'growth', 'summon', 'gem'];
  return (
    <LinearGradient colors={T.surfaceGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.resbar}>
      {keys.map((k) => (
        <ResCell key={k} emoji={concept.resources[k].emoji} value={wallet[k] || 0}
          pulse={k === 'summon' || k === 'gem'} />
      ))}
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
  const a11y = typeof label === 'string' ? label : undefined;
  if (kind === 'ghost' || disabled) {
    return (
      <TouchableOpacity style={[s.btn, small && s.btnSmall, kind === 'ghost' ? s.btnGhost : s.btnDisabled]}
        onPress={press} disabled={disabled} activeOpacity={0.75}
        accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ disabled: !!disabled }}>
        <Text style={[s.btnText, { color: disabled ? T.muted : T.text }, small && { fontSize: 13 }]} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={press} disabled={disabled} activeOpacity={0.82}
      accessibilityRole="button" accessibilityLabel={a11y}
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

// 배수 선택 토글 (×1 / ×10 / ×100 / Max). value/onChange 로 제어.
export function MultiToggle({ value, onChange, options = [1, 10, 100, 'Max'] }) {
  return (
    <View style={s.multi}>
      {options.map((n) => {
        const on = n === value;
        return (
          <TouchableOpacity key={n} style={[s.multiCell, on && s.multiOn]} activeOpacity={0.8}
            onPress={() => onChange(n)}>
            <Text style={[s.multiText, on && s.multiTextOn]}>{multLabel(n)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 배수 라벨 — 'Max'는 그대로, 숫자는 ×N.
export function multLabel(n) {
  return n === 'Max' ? 'Max' : `×${n}`;
}

// 액션 fn 을 최대 n회 반복 실행. { ok:false } 를 받으면 중단.
// n='Max'(또는 Infinity)이면 재화·상한이 다할 때까지 반복(안전 상한 9999).
export function repeat(fn, n) {
  const cap = n === 'Max' || n === Infinity ? 9999 : n;
  let done = 0;
  for (let i = 0; i < cap; i++) {
    const r = fn();
    if (r && r.ok === false) break;
    done += 1;
  }
  return done;
}

// 큰 수 접미사 — K/M/B/T/Q 이후 AA·AB···ZZ 로 확장(×1000 단위).
//   1000^5=Q 다음부터 두 글자(AA=1000^6 …). ZZ까지 → 사실상 상한 없음(1e2000+).
const FMT_SUFFIX = (() => {
  const s = ['', 'K', 'M', 'B', 'T', 'Q'];
  for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) s.push(String.fromCharCode(65 + a) + String.fromCharCode(65 + b));
  return s;
})();
export function fmt(n) {
  n = Math.round(n);
  const neg = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1e4) return neg + n.toLocaleString();
  // ×1000 단위로 나눠 접미사 선택(부동소수 안전: 반복 나눗셈).
  let tier = 0, v = n;
  while (v >= 1000 && tier < FMT_SUFFIX.length - 1) { v /= 1000; tier++; }
  return neg + v.toFixed(1) + FMT_SUFFIX[tier];
}

const bs = StyleSheet.create({
  badge: { position: 'absolute', bottom: -4, alignSelf: 'center', left: 0, right: 0, marginHorizontal: 'auto', width: 26, paddingVertical: 1, borderRadius: 6, alignItems: 'center' },
  badgeText: { color: '#1a1225', fontSize: 10, fontWeight: '900' },
});

// ── 등급 배지(RarityTag) — 다크 배경 위 색텍스트는 대비가 약해, 등급색을
//   '채운 알약'으로 표기해 시인성을 확보한다. 로스터/장비/룬/펫 등 공용.
//   label=true면 한글 라벨(레어/에픽…), 아니면 약칭(R/SR…).
export function RarityTag({ rarity = 'N', label = false, style }) {
  const rm = rarityMeta(rarity);
  return (
    <View style={[bs.rtag, { backgroundColor: rm.color }, style]}>
      <Text style={bs.rtagText}>{label ? rm.label : rarity}</Text>
    </View>
  );
}
Object.assign(bs, StyleSheet.create({
  rtag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, alignSelf: 'center' },
  rtagText: { color: '#160f28', fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
}));

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
  // 내용 크기로 컴팩트하게 — 셀에 flex:1이면 네이티브에서 부모 폭 전체로 늘어남(웹과 차이).
  multi: { flexDirection: 'row', backgroundColor: T.surface2, borderRadius: 10, padding: 3, gap: 3 },
  multiCell: { minWidth: 40, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  multiOn: { backgroundColor: T.primary },
  multiText: { color: T.muted, fontWeight: '800', fontSize: 13 },
  multiTextOn: { color: '#fff' },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  lockedIcon: { fontSize: 56, marginBottom: 12, opacity: 0.8 },
  lockedTitle: { color: T.text, fontWeight: '900', fontSize: 22 },
  lockedStage: { color: T.accent, fontWeight: '700', fontSize: 15, marginTop: 8 },
  lockedDesc: { color: T.muted, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 19 },
});
