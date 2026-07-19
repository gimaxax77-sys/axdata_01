import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { T } from '../theme';
import { reducedMotion } from '../motion';
import { unitSprite, hasUnitSprite } from '../unitSprites';
import SpriteAnim from '../SpriteAnim';

// reduce: 설정에서 전달(즉시 반영). 미전달 시 모듈 플래그 폴백.

// ─────────────────────────────────────────────────────────────
// 자동 전투 시각화 — 순수 연출(게임 로직 불변).
// resolve()의 win/margin으로 "얼마나 우세한가"만 받아 페이스를 정한다.
// HP 바 감소 + 공격 러지 + 데미지 숫자로 "돌아가는 전투"를 보여준다.
// 캐릭터: 스프라이트(SpriteAnim, idle 순환 → attack/hit/walk 1회) > 이모지 폴백.
// setInterval + ref 로 가볍게 구동(웹 export에서도 안정).
// ─────────────────────────────────────────────────────────────

const EMPTY_FORMATION = { front: [], mid: [], back: [] };
const FRONT_SIZE = 180;
const BACK_SIZE = 144;

// 스프라이트 파이터 — idle 순환. 토큰 변경 시 해당 1회 모션(attack/hit/walk) 재생 후 idle.
// 동시 발생 시 소스순(attack→hit→walk) 마지막이 우선(피격이 공격을 끊음 = 자연스러움).
// 원본 스프라이트가 오른쪽(적 방향)을 향하므로 반전 없이 그대로 렌더한다.
// 토큰 prop 변경을 useEffect로 받으면 "prop 변경 커밋 → effect → 재렌더"로
//   모션 전환 1회당 재렌더가 2번 발생(파티 전체가 동시 전환되는 처치 순간 특히 체감).
//   렌더 중 상태 파생(React 공식 지원 패턴)으로 1회로 줄인다.
//   동시 발생 시 우선순위는 기존과 동일: 나중에 비교하는 쪽이 이긴다.
const SpriteFighter = React.memo(function SpriteFighter({ cid, ckey, front, attackToken, hitToken, walkToken, staggerMs = 0 }) {
  const [anim, setAnim] = useState({ st: 'idle', tok: 0, a: attackToken, h: hitToken, w: walkToken });
  if (attackToken !== anim.a || hitToken !== anim.h || walkToken !== anim.w) {
    let st = anim.st;
    if (attackToken !== anim.a) st = 'attack';
    if (hitToken !== anim.h) st = 'hit';
    if (walkToken !== anim.w) st = 'walk';
    setAnim({ st, tok: anim.tok + 1, a: attackToken, h: hitToken, w: walkToken });
  }
  // 전열 진격 러지 — 컬럼 전체가 아니라 이 유닛 혼자, 자기 staggerMs만큼 늦게 튀어나간다.
  //   (예전엔 전열 전체를 한 Animated.Value로 묶어 한 덩어리로 움직였던 게 "군무"의 주범이었음.)
  const lunge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!front || anim.st !== 'attack') return;
    Animated.sequence([
      Animated.delay(staggerMs),
      Animated.timing(lunge, { toValue: 8, duration: 90, useNativeDriver: true }),
      Animated.timing(lunge, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [anim.tok]); // eslint-disable-line react-hooks/exhaustive-deps
  const spr = unitSprite(cid, ckey, anim.st) || unitSprite(cid, ckey, 'idle');
  const size = front ? FRONT_SIZE : BACK_SIZE;
  const scale = size / spr.frameH;
  return (
    <Animated.View style={front ? { transform: [{ translateX: lunge }] } : undefined}>
      <SpriteAnim
        source={spr.source} frameW={spr.frameW} frameH={spr.frameH} frames={spr.frames}
        state={anim.st} playToken={anim.tok} scale={scale} staggerMs={staggerMs}
        onEnd={() => setAnim((a) => ({ ...a, st: 'idle' }))}
      />
    </Animated.View>
  );
});

// 적 파이터 — 왼쪽(파티) 향하는 몬스터 스프라이트. idle 순환, 히어로 공격 시 hit 재생.
// 원본이 이미 왼쪽 방향으로 렌더돼 반전 불필요.
const ENEMY_SIZE = 198;
const EnemyFighter = React.memo(function EnemyFighter({ ekey, hitToken, atkToken }) {
  const [anim, setAnim] = useState({ st: 'idle', tok: 0, h: hitToken, a: atkToken });
  if (hitToken !== anim.h || atkToken !== anim.a) {
    let st = anim.st;
    if (hitToken !== anim.h) st = 'hit';
    if (atkToken !== anim.a) st = 'attack';
    setAnim({ st, tok: anim.tok + 1, h: hitToken, a: atkToken });
  }
  const spr = unitSprite('enemy', ekey, anim.st) || unitSprite('enemy', ekey, 'idle');
  const scale = ENEMY_SIZE / spr.frameH;
  return (
    <SpriteAnim source={spr.source} frameW={spr.frameW} frameH={spr.frameH} frames={spr.frames}
      state={anim.st} playToken={anim.tok} scale={scale} onEnd={() => setAnim((a) => ({ ...a, st: 'idle' }))} />
  );
});

// 편성 한 칸 — 스프라이트, 없으면 이모지. slot이 문자열이면 이모지(하위호환).
const Fighter = React.memo(function Fighter({ slot, front, attackToken, hitToken, walkToken, staggerMs = 0 }) {
  const o = slot && typeof slot === 'object' ? slot : { emoji: slot };
  if (o.cid && o.key && hasUnitSprite(o.cid, o.key)) {
    return <SpriteFighter cid={o.cid} ckey={o.key} front={front} attackToken={attackToken} hitToken={hitToken} walkToken={walkToken} staggerMs={staggerMs} />;
  }
  return <Text style={front ? s.miniEmojiFront : s.miniEmoji}>{o.emoji}</Text>;
});

// 데미지 숫자 한 개 — 마운트 시 스스로 떠오르며 사라진 뒤 onDone으로 제거.
//   매 틱 부모 리렌더(force) 없이 자기 애니만 돌려 JS 스레드 부하↓.
const FloatText = React.memo(function FloatText({ val, crit, big, dx, onDone }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 1100, useNativeDriver: false }).start(() => onDone());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.Text style={[
      s.float, crit && s.floatCrit, big && s.floatBig,
      {
        left: `${45 + dx}%`,
        opacity: a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
        bottom: a.interpolate({ inputRange: [0, 1], outputRange: [90, 146] }),
      },
    ]}>{typeof val === 'number' ? val.toLocaleString() : val}</Animated.Text>
  );
});

function BattleView({ party = EMPTY_FORMATION, enemyEmoji = '👹', enemyKey = null, win = true, margin = 1, reduce }) {
  const noMotion = reduce !== undefined ? reduce : reducedMotion();
  const enemyHp = useRef(1);
  const heroHp = useRef(1);
  const [atk, setAtk] = useState(0);           // 공격 재생 트리거(스프라이트)
  const [hitTok, setHitTok] = useState(0);     // 파티 피격 재생 트리거
  const [walkTok, setWalkTok] = useState(0);   // 웨이브 전진(걷기) 트리거
  const [enemyAtk, setEnemyAtk] = useState(0); // 적 공격(반격) 재생 트리거
  const [floats, setFloats] = useState([]);    // 데미지 숫자 — 생성/제거 시에만 렌더(이벤트 기반)
  const fid = useRef(0);

  // 타격 연출 — 전부 Animated 노드 직접 구동(리렌더 없음).
  const shakeX = useRef(new Animated.Value(0)).current; // 크리티컬 무대 셰이크
  const slashA = useRef(new Animated.Value(0)).current; // 타격 섬광(적 위 💥)
  const flashA = useRef(new Animated.Value(1)).current; // 적 피격 플래시(투명도)
  const popA = useRef(new Animated.Value(1)).current;   // 처치 팝(스케일)
  const fxAttack = (crit) => {
    // 전열 러지는 이제 SpriteFighter가 유닛별로 각자 담당(여기선 적 쪽 연출만).
    slashA.setValue(0);
    Animated.timing(slashA, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    flashA.setValue(0.35);
    Animated.timing(flashA, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (crit) {
      shakeX.setValue(0);
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 3, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -2, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 1, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]).start();
    }
  };
  const waveX = useRef(new Animated.Value(0)).current;      // 다음 웨이브 적 슬라이드인
  const heroFlashA = useRef(new Animated.Value(1)).current; // 파티 피격 플래시
  const heroShakeX = useRef(new Animated.Value(0)).current; // 파티 피격 흔들림
  const dangerA = useRef(new Animated.Value(0)).current;    // 열세 위기 비네팅(붉은 펄스)
  const fxKill = () => {
    popA.setValue(1);
    Animated.sequence([
      Animated.timing(popA, { toValue: 1.28, duration: 90, useNativeDriver: true }),
      Animated.spring(popA, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    // 처치 팝 직후 — 다음 웨이브 적이 오른쪽에서 등장.
    waveX.setValue(70);
    Animated.sequence([
      Animated.delay(140),
      Animated.spring(waveX, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  };
  const fxCounter = () => { // 적 반격 — 파티 쪽 플래시 + 흔들림
    heroFlashA.setValue(0.5);
    Animated.timing(heroFlashA, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    heroShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(heroShakeX, { toValue: -2, duration: 30, useNativeDriver: true }),
      Animated.timing(heroShakeX, { toValue: 2, duration: 30, useNativeDriver: true }),
      Animated.timing(heroShakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    enemyHp.current = 1; heroHp.current = 1;
    if (noMotion) {
      enemyHp.current = win ? 0.45 : 0.85; heroHp.current = win ? 0.9 : 0.5;
      return;
    }
    // 우세할수록 적 HP가 빨리 깎임. 열세(패배)면 파티 HP가 위태.
    const enemyDmg = win ? (margin > 2.2 ? 0.30 : margin > 1.4 ? 0.20 : 0.14) : 0.10;
    const heroDmg = win ? 0.05 : 0.16;
    let t = 0;
    const iv = setInterval(() => {
      t += 1;
      // 히어로 공격 (~0.48s)
      if (t % 4 === 0) {
        setAtk((a) => a + 1); // 스프라이트 attack 재생
        const crit = Math.random() < 0.28;
        fxAttack(crit); // 타격 섬광 + 피격 플래시 + 크리 셰이크
        const mul = crit ? 1.9 : 1;
        enemyHp.current -= enemyDmg * mul * (0.85 + Math.random() * 0.3);
        pushFloat(Math.round(enemyDmg * mul * 4200 * (0.85 + Math.random() * 0.3)), 'enemy', crit);
        if (enemyHp.current <= 0) {
          pushFloat('처치!', 'enemy', true, true);
          fxKill(); // 처치 팝
          enemyHp.current = 1; // 다음 웨이브
          setWalkTok((w) => w + 1); // 처치 → 다음 웨이브로 전진(걷기 1회)
        }
      }
      // 적 반격 (~0.72s) — 적 공격 모션 + 파티 피격 모션
      if (t % 6 === 0) {
        pushFloat(Math.round(heroDmg * 3000 * (0.85 + Math.random() * 0.3)), 'hero', false);
        heroHp.current = Math.max(win ? 0.35 : 0.12, heroHp.current - heroDmg);
        setHitTok((h) => h + 1);
        setEnemyAtk((a) => a + 1);
        fxCounter(); // 파티 피격 플래시 + 흔들림
      }
      // 히어로 자연 회복
      heroHp.current = Math.min(1, heroHp.current + 0.012);
    }, 150); // 틱 간격 — 공격/반격 빈도(체감 속도)를 여기서 조절. 스프라이트 fps는 부드러움 전담.
    // 열세(패배 예상) — 붉은 위기 비네팅 펄스.
    let dangerLoop = null;
    if (!win) {
      dangerLoop = Animated.loop(Animated.sequence([
        Animated.timing(dangerA, { toValue: 0.14, duration: 700, useNativeDriver: true }),
        Animated.timing(dangerA, { toValue: 0.03, duration: 700, useNativeDriver: true }),
      ]));
      dangerLoop.start();
    } else dangerA.setValue(0);
    return () => { clearInterval(iv); if (dangerLoop) { dangerLoop.stop(); dangerA.setValue(0); } };
  }, [win, margin, noMotion]);

  function pushFloat(val, side, crit, big) {
    fid.current += 1;
    setFloats((fs) => [...fs.slice(-7), { id: fid.current, val, side, crit, big, dx: Math.random() * 26 - 13 }]);
  }
  const dropFloat = (id) => setFloats((fs) => fs.filter((f) => f.id !== id));

  const renderFloats = (side) => floats.filter((f) => f.side === side).map((f) => (
    <FloatText key={f.id} val={f.val} crit={f.crit} big={f.big} dx={f.dx} onDone={() => dropFloat(f.id)} />
  ));

  return (
    <Animated.View style={[s.arena, { transform: [{ translateX: shakeX }] }]}>
      {/* 열세 위기 비네팅 — 패배 예상 시 붉은 펄스 */}
      <Animated.View pointerEvents="none" style={[s.dangerOverlay, { opacity: dangerA }]} />
      {/* 파티 */}
      <View style={s.heroSide}>
        <View style={s.floatLayer}>{renderFloats('hero')}</View>
        {/* 전투 화면은 1·2열(중열→전열)만 표시 — 후열은 숨겨 화면을 정리(전투 로직엔 영향 없음). */}
        <View style={s.formRow}>
          <View style={s.formCol}>
            {party.mid.map((e, i) => <Fighter key={'m' + i} slot={e} front={false} attackToken={atk} hitToken={hitTok} walkToken={walkTok} staggerMs={(i * 47 + 65) % 130} />)}
          </View>
          {/* 반격 피격 연출(플래시·흔들림)은 전열만 받는다 — 탱커가 맞는다는 설계가 더 자연스럽고,
              파티 전체가 한꺼번에 번쩍이던 것보다 유닛별 타이밍 차이가 잘 드러난다. */}
          <Animated.View style={[s.formCol, { opacity: heroFlashA, transform: [{ translateX: heroShakeX }] }]}>
            {party.front.map((e, i) => <Fighter key={'f' + i} slot={e} front={true} attackToken={atk} hitToken={hitTok} walkToken={walkTok} staggerMs={(i * 47) % 130} />)}
          </Animated.View>
        </View>
      </View>
      <Text style={s.clash}>⚔️</Text>
      <View style={s.side}>
        <View style={s.floatLayer}>{renderFloats('enemy')}</View>
        {/* 적 — 피격 플래시(투명도)·처치 팝(스케일) + 타격 섬광 오버레이 */}
        <Animated.View style={{ alignItems: 'center', opacity: flashA, transform: [{ scale: popA }, { translateX: waveX }] }}>
          {enemyKey && hasUnitSprite('enemy', enemyKey)
            ? <EnemyFighter ekey={enemyKey} hitToken={atk} atkToken={enemyAtk} />
            : <Text style={s.emoji}>{enemyEmoji}</Text>}
          <Animated.Text pointerEvents="none" style={[s.slash, {
            opacity: slashA.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
            transform: [{ scale: slashA.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.7] }) }],
          }]}>💥</Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// 방치 틱마다 부모가 리렌더돼도 props(파티·win·margin)가 같으면 건너뛴다.
export default React.memo(BattleView);

const s = StyleSheet.create({
  // 무대를 꽉 채우고 파티·적을 바닥선(flex-end)에 세운다(배경 위에 서 있게).
  arena: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 4, paddingBottom: 6 },
  side: { alignItems: 'center', width: 170, justifyContent: 'flex-end' },
  // 히어로 쪽 — 3열(후열·중열·전열) 편성. 큰 스프라이트에 맞춰 넓게.
  heroSide: { alignItems: 'center', width: 300, justifyContent: 'flex-end' },
  floatLayer: { position: 'absolute', left: 0, right: 0, bottom: 40, height: 180, zIndex: 5 },
  formRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  formCol: { flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: -8 },
  dangerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: T.danger, zIndex: 1 },
  miniEmoji: { fontSize: 34, opacity: 0.85 },
  miniEmojiFront: { fontSize: 46 },
  emoji: { fontSize: 104 },
  slash: { position: 'absolute', top: '28%', fontSize: 42, zIndex: 6 },
  clash: { fontSize: 22, opacity: 0.5, marginBottom: 40 },
  float: { position: 'absolute', fontSize: 14, fontWeight: '800', color: T.text },
  floatCrit: { fontSize: 18, color: T.accent },
  floatBig: { fontSize: 16, color: T.good },
});
