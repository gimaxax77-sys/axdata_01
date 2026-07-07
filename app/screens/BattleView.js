import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../theme';
import { reducedMotion } from '../motion';

// reduce: 설정에서 전달(즉시 반영). 미전달 시 모듈 플래그 폴백.

// ─────────────────────────────────────────────────────────────
// 자동 전투 시각화 — 순수 연출(게임 로직 불변).
// resolve()의 win/margin으로 "얼마나 우세한가"만 받아 페이스를 정한다.
// HP 바 감소 + 공격 러지 + 데미지 숫자로 "돌아가는 전투"를 보여준다.
// setInterval + ref 로 가볍게 구동(웹 export에서도 안정).
// ─────────────────────────────────────────────────────────────

function BattleView({ heroEmoji = '⚔️', enemyEmoji = '👹', win = true, margin = 1, reduce }) {
  const noMotion = reduce !== undefined ? reduce : reducedMotion();
  const enemyHp = useRef(1);
  const heroHp = useRef(1);
  const [, force] = useState(0);
  const [lunge, setLunge] = useState(false);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const floats = useRef([]);
  const fid = useRef(0);

  useEffect(() => {
    enemyHp.current = 1; heroHp.current = 1;
    if (noMotion) { enemyHp.current = win ? 0.45 : 0.85; heroHp.current = win ? 0.9 : 0.5; force((v) => v + 1); return; }
    // 우세할수록 적 HP가 빨리 깎임. 열세(패배)면 파티 HP가 위태.
    const enemyDmg = win ? (margin > 2.2 ? 0.30 : margin > 1.4 ? 0.20 : 0.14) : 0.10;
    const heroDmg = win ? 0.05 : 0.16;
    let t = 0;
    const iv = setInterval(() => {
      t += 1;
      // 히어로 공격 (~0.48s)
      if (t % 4 === 0) {
        setLunge(true); setTimeout(() => setLunge(false), 120);
        setEnemyFlash(true); setTimeout(() => setEnemyFlash(false), 120);
        const crit = Math.random() < 0.28;
        const mul = crit ? 1.9 : 1;
        enemyHp.current -= enemyDmg * mul * (0.85 + Math.random() * 0.3);
        pushFloat(Math.round(enemyDmg * mul * 4200 * (0.85 + Math.random() * 0.3)), 'enemy', crit);
        if (enemyHp.current <= 0) {
          pushFloat('처치!', 'enemy', true, true);
          enemyHp.current = 1; // 다음 웨이브
        }
      }
      // 적 반격 (~0.72s)
      if (t % 6 === 0) {
        pushFloat(Math.round(heroDmg * 3000 * (0.85 + Math.random() * 0.3)), 'hero', false);
        heroHp.current = Math.max(win ? 0.35 : 0.12, heroHp.current - heroDmg);
      }
      // 히어로 자연 회복
      heroHp.current = Math.min(1, heroHp.current + 0.012);
      // 데미지 숫자 수명
      floats.current = floats.current.map((f) => ({ ...f, life: f.life - 1 })).filter((f) => f.life > 0);
      force((v) => (v + 1) % 1e6);
    }, 120);
    return () => clearInterval(iv);
  }, [win, margin, noMotion]);

  function pushFloat(val, side, crit, big) {
    fid.current += 1;
    floats.current = [...floats.current.slice(-7), { id: fid.current, val, side, crit, big, life: 9, dx: Math.random() * 26 - 13 }];
  }

  const bar = (ratio, color) => (
    <View style={s.barBg}><View style={[s.barFill, { width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, backgroundColor: color }]} /></View>
  );
  const renderFloats = (side) => floats.current.filter((f) => f.side === side).map((f) => (
    <Text key={f.id} style={[
      s.float,
      f.crit && s.floatCrit, f.big && s.floatBig,
      { opacity: f.life / 9, bottom: 60 + (9 - f.life) * 7, left: `${45 + f.dx}%` },
    ]}>{typeof f.val === 'number' ? f.val.toLocaleString() : f.val}</Text>
  ));

  return (
    <View style={s.arena}>
      <View style={s.side}>
        <View style={s.floatLayer}>{renderFloats('hero')}</View>
        <Text style={[s.emoji, lunge && s.emojiLunge]}>{heroEmoji}</Text>
        {bar(heroHp.current, T.good)}
        <Text style={s.label}>내 파티</Text>
      </View>
      <Text style={s.clash}>⚔️</Text>
      <View style={s.side}>
        <View style={s.floatLayer}>{renderFloats('enemy')}</View>
        <Text style={[s.emoji, enemyFlash && s.emojiHit]}>{enemyEmoji}</Text>
        {bar(enemyHp.current, T.danger)}
        <Text style={s.label}>적</Text>
      </View>
    </View>
  );
}

// 방치 틱마다 부모가 리렌더돼도 props(이모지·win·margin)가 같으면 건너뛴다.
export default React.memo(BattleView);

const s = StyleSheet.create({
  arena: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 132, marginVertical: 4 },
  side: { alignItems: 'center', width: 120 },
  floatLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  emoji: { fontSize: 56 },
  emojiLunge: { transform: [{ translateX: 16 }, { scale: 1.08 }] },
  emojiHit: { transform: [{ translateX: 6 }], opacity: 0.55 },
  clash: { fontSize: 20, opacity: 0.6 },
  barBg: { width: 96, height: 8, backgroundColor: T.surface, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  label: { color: T.muted, fontSize: 12, marginTop: 4, fontWeight: '700' },
  float: { position: 'absolute', fontSize: 14, fontWeight: '800', color: T.text },
  floatCrit: { fontSize: 18, color: T.accent },
  floatBig: { fontSize: 16, color: T.good },
});
