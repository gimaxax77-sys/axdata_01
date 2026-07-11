import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { fmt } from '../components';
import { effectivePower, powerMultOf } from '../useGame';
import { idleGenre } from '../../system/genres/idle.mjs';
import { playStage, difficultyDef } from '../../system/core/difficulty.mjs';
import { stageZone } from '../../system/core/progression.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { villageTier } from '../../system/core/village.mjs';
import { reducedMotion } from '../motion';
import SpriteAnim from '../SpriteAnim';
import { hasUnitSprite, unitSprite } from '../unitSprites';

// ─────────────────────────────────────────────────────────────
// 픽셀 방치 화면 (미리보기) — 풀아트 방향의 실장 시범.
//   · 배경/스프라이트는 assets/pixel/*.png (실제 팩 오면 같은 파일명 교체)
//   · 텍스트는 갈무리(Galmuri11) 픽셀폰트
//   · 게임 데이터/액션은 기존 엔진 그대로 사용
// ─────────────────────────────────────────────────────────────

const BG = require('../../assets/pixel/bg-sanctum.png');
const HERO = require('../../assets/pixel/hero-fire.png');
const ENEMY = require('../../assets/pixel/enemy-guardian.png');
const F = 'Galmuri11';
const FB = 'Galmuri11-Bold';

const C = {
  gold: '#f5c542', goldL: '#ffe9a0', ink: '#160b24',
  panel: 'rgba(30,24,64,0.86)', bd: '#4a3f88', bdHi: '#6a5fb0',
  text: '#e6ecf6', dim: '#b7aee0', good: '#5fe08a', danger: '#ff5a7a', pink: '#ff9ec4',
};

// 픽셀 베벨 패널
function Px({ children, style, gold }) {
  return (
    <View style={[ps.panel, gold && { borderColor: C.gold }, style]}>
      <View style={[ps.panelHi, gold && { backgroundColor: '#7a6a1a' }]} />
      {children}
    </View>
  );
}
function HpBar({ pct, color }) {
  return (
    <View style={ps.hpTrack}>
      <View style={[ps.hpFill, { width: `${Math.max(0, Math.min(100, pct * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

// 시트 실제 폭 → 프레임 수(가로 스트립). require된 애셋 크기에서 계산.
function framesOf(source, frameW) {
  const a = Image.resolveAssetSource(source);
  return a && a.width ? Math.max(1, Math.round(a.width / frameW)) : 1;
}

// 아군 리더 표시 — 스프라이트 시트가 등록돼 있으면 SpriteAnim, 없으면 기존 픽셀 이미지 폴백.
function HeroSprite({ concept, lead, bob }) {
  const key = lead && lead.characterId;
  const rec = key && hasUnitSprite(concept.id, key) ? unitSprite(concept.id, key, 'idle') : null;
  if (rec) {
    const frames = framesOf(rec.source, rec.frameW);
    return (
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <SpriteAnim source={rec.source} frameW={rec.frameW} frameH={rec.frameH}
          frames={frames} state="idle" scale={128 / rec.frameH} />
      </Animated.View>
    );
  }
  return <Animated.Image source={HERO} style={[ps.heroImg, { transform: [{ translateY: bob }] }]} resizeMode="contain" />;
}

// 대기 흔들림(bob) 애니메이션 훅. 절전/연출끔이면 애니메이션 정지(정적 렌더).
function useBob(range, dur, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion()) { v.setValue(0); return; } // 절전 모드: 루프 미시작(발열↓)
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0, range] });
}

export default function PixelIdleScreen({ state, bump, lastGain, concept }) {
  const [boxMsg, setBoxMsg] = useState(null);
  const heroBob = useBob(-6, 900);
  const enemyBob = useBob(-9, 1300, 200);
  const power = effectivePower(state);
  const mult = powerMultOf(state);
  const stageDef = playStage(state);
  const zone = stageZone(state.stage);
  const curDiff = difficultyDef(state.difficulty);
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const lead = party.slice().sort((a, b) => computePower(b) - computePower(a))[0];
  const leadMeta = lead ? identity(concept, lead) : null;
  const enemyEl = elementMeta(concept, stageDef.challenge.element);
  const canPrestige = state.maxStage >= 15;
  const nextGain = Math.floor(Math.sqrt(state.maxStage));
  const g = lastGain || { currency: 0, growth: 0 };

  const wallet = state.wallet;
  const res = [
    [concept.resources.currency.emoji, fmt(wallet.currency || 0), C.gold],
    [concept.resources.growth.emoji, fmt(wallet.growth || 0), '#7ad0ff'],
    [concept.resources.summon.emoji, fmt(wallet.summon || 0), C.pink],
    [concept.resources.gem.emoji, fmt(wallet.gem || 0), '#8affd0'],
  ];

  return (
    <View style={ps.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={ps.dim} pointerEvents="none" />

      {/* 상단: 자원 + 스테이지 배너 */}
      <View style={ps.top}>
        <Px style={ps.resBar}>
          {res.map((r, i) => (
            <Text key={i} style={[ps.resTxt, { color: r[2] }]}>{r[0]}{r[1]}</Text>
          ))}
        </Px>
        <Px gold style={ps.banner}>
          <Text style={ps.bannerZone}>✦ {elementMeta(concept, zone.element)?.name} 성역 · {zone.start}-{zone.end}F ✦</Text>
          <Text style={ps.bannerStage}>{concept.terms.stage} {state.stage}
            {curDiff.id !== 'normal' ? <Text style={ps.diff}>  {curDiff.emoji}×{curDiff.rewardMult}</Text> : null}
          </Text>
          {/* 본진 발전 단계 — 진행할수록 거점이 성장(소유의 만족감) */}
          {(() => {
            const vt = villageTier(state.peakStage || state.maxStage || 1);
            return (
              <Text style={ps.village}>{vt.emoji} 본진: {vt.label}
                {vt.next ? <Text style={ps.villageDim}>  → {vt.next.label} {Math.round(vt.progress * 100)}%</Text> : <Text style={ps.villageDim}>  · 최종</Text>}
              </Text>
            );
          })()}
        </Px>
      </View>

      {/* 전투 무대 — 바닥(마법진)에 서게 절대배치 */}
      <View style={ps.arena} pointerEvents="none">
        <View style={ps.fighter}>
          <Text style={ps.crit}>크리티컬!</Text>
          <HeroSprite concept={concept} lead={lead} bob={heroBob} />
          <View style={ps.shadow} />
          <Text style={[ps.name, { color: C.goldL }]}>{leadMeta ? leadMeta.name : '용사'} {lead ? `Lv.${lead.level}` : ''}</Text>
          <HpBar pct={0.78} color={C.good} />
        </View>
        <Text style={ps.vs}>⚔</Text>
        <View style={ps.fighter}>
          <Text style={ps.dmg}>-{fmt(Math.round(power * 3))}</Text>
          <Animated.Image source={ENEMY} style={[ps.enemyImg, { transform: [{ translateY: enemyBob }] }]} resizeMode="contain" />
          <View style={ps.shadow} />
          <Text style={[ps.name, { color: C.pink }]}>{enemyEl?.name} 수호자</Text>
          <HpBar pct={0.34} color={C.danger} />
        </View>
      </View>

      {/* 하단: 스탯 + 수입 + 환생 */}
      <View style={ps.bottom}>
        <View style={ps.statRow}>
          <Px style={ps.stat}>
            <Text style={ps.statK}>전투력</Text>
            <Text style={ps.statV}>{fmt(power)}</Text>
          </Px>
          <Px style={ps.stat}>
            <Text style={ps.statK}>초당 수입</Text>
            <Text style={[ps.statV, { color: C.good, fontSize: 15 }]}>+{fmt(g.currency)}</Text>
          </Px>
          <Px style={ps.stat}>
            <Text style={ps.statK}>파워배수</Text>
            <Text style={[ps.statV, { color: C.gold }]}>×{mult.toFixed(2)}</Text>
          </Px>
        </View>
        <TouchableOpacity activeOpacity={0.85} disabled={!canPrestige}
          onPress={() => {
            const r = idleGenre.prestige(state);
            if (r.box) {
              const parts = [];
              if (r.box.gear) parts.push(`⚔️${r.box.gear}`);
              if (r.box.rune) parts.push(`🔷${r.box.rune}`);
              if (r.box.gem) parts.push(`💎${r.box.gem}`);
              if (r.box.summon) parts.push(`🔮${r.box.summon}`);
              setBoxMsg(parts.length ? `🎁 ${parts.join(' · ')}` : null);
            }
            bump();
          }}>
          <View style={[ps.cta, !canPrestige && { opacity: 0.5 }]}>
            <View style={ps.ctaHi} />
            <Text style={ps.ctaTxt}>{canPrestige ? `✦  환생하기 (+${nextGain})  ✦` : '15F 도달 필요'}</Text>
          </View>
        </TouchableOpacity>
        {boxMsg ? <Text style={ps.box}>{boxMsg}</Text> : null}
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,16,0.15)' },
  panel: { backgroundColor: C.panel, borderWidth: 2, borderColor: C.bd, borderRadius: 4, overflow: 'hidden' },
  panelHi: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.bdHi },

  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 8, paddingTop: 8, gap: 8 },
  resBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 7, paddingHorizontal: 6 },
  resTxt: { fontFamily: FB, fontSize: 12 },
  banner: { alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 6, alignItems: 'center', minWidth: 200 },
  bannerZone: { fontFamily: F, fontSize: 10, color: C.dim },
  bannerStage: { fontFamily: FB, fontSize: 20, color: C.gold, marginTop: 2 },
  diff: { fontFamily: FB, fontSize: 12, color: C.danger },
  village: { fontFamily: F, fontSize: 10, color: C.goldL, marginTop: 3 },
  villageDim: { fontFamily: F, fontSize: 10, color: C.dim },

  // 무대: 화면 중앙~하단(배경 바닥/마법진 위)에 발이 닿게 절대배치
  arena: { position: 'absolute', left: 0, right: 0, top: '40%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 6 },
  fighter: { alignItems: 'center', width: 140 },
  heroImg: { width: 128, height: 128 },
  enemyImg: { width: 118, height: 118, marginBottom: 14 },
  shadow: { width: 62, height: 10, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.45)', marginTop: -6 },
  name: { fontFamily: FB, fontSize: 12, marginTop: 4, textShadowColor: '#000', textShadowRadius: 3 },
  crit: { fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: -4, textShadowColor: '#000', textShadowRadius: 3 },
  dmg: { fontFamily: FB, fontSize: 16, color: C.goldL, marginBottom: -4, textShadowColor: '#000', textShadowRadius: 3 },
  vs: { fontFamily: FB, fontSize: 22, color: C.goldL, marginBottom: 60, textShadowColor: '#000', textShadowRadius: 4 },

  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingBottom: 8, gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statK: { fontFamily: F, fontSize: 9, color: C.dim },
  statV: { fontFamily: FB, fontSize: 17, color: C.text, marginTop: 3 },
  cta: { backgroundColor: C.gold, borderRadius: 4, borderWidth: 2, borderColor: '#a9781a', paddingVertical: 12, alignItems: 'center', overflow: 'hidden' },
  ctaHi: { position: 'absolute', top: 2, left: 2, right: 2, height: 4, backgroundColor: C.goldL },
  ctaTxt: { fontFamily: FB, fontSize: 14, color: '#3a2405' },
  box: { fontFamily: FB, fontSize: 12, color: C.gold, textAlign: 'center' },
});
