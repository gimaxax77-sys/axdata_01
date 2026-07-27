// 자동 전투 시각화 — 호드워식 **좌우 대치 진형**. 순수 연출(게임 로직 불변).
//   기준: docs/HORDWAR_SPEC.md "전투 구조" — 아군 좌 / 적 우로 마주 본다.
//   아군은 진형 2단(후열·전열), 적은 3열. 2026-07-26 편성 5인 전환으로 중열이 없어졌다.
//   resolve()의 win/margin으로 "얼마나 우세한가"만 받아 페이스를 정한다.
//   유닛 표시 = 속성 아이콘 + 레벨 뱃지 + 발밑 **분홍 타원 그림자**(호드워 고유).
//   (구 세븐식 세로 자유 산개 Wander 난전은 이 파일에서 걷어냈다 — 4번째 기준 변경.)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { T } from '../theme';
import { reducedMotion } from '../motion';
import { unitSprite, hasUnitSprite } from '../unitSprites';
import SpriteAnim from '../SpriteAnim';
import { emptySlots, nextSlot, writeSlot, expireSlots, FLOAT_MS } from '../../system/core/battleFloats.mjs';

const EMPTY_FORMATION = { front: [], back: [] };
// 좌우 대치 — 아군은 왼쪽 2열(후열이 왼쪽·전열이 오른쪽), 적은 오른쪽 3열.
const ALLY_SIZE = 62;
const FOE_SIZE = 58;
const MONSTER_EMOJIS = ['👹', '👺', '👻', '💀', '🧟', '🦇', '🐺', '🕷️', '🦂', '🐉', '👿', '🧛'];

// 적 진형 — **항상 5마리 고정**(Gim 지시 2026-07-27). 전에는 열마다 1~3마리를 굴려
// 3~7마리가 나왔다. 아군(전열2·후열3)과 마주보도록 적도 **전열2·후열3**으로 맞춘다.
//
// ⚠️ 순서 주의 — 적 컨테이너(s.sideFoe)는 `row-reverse`다.
//    그래서 이 배열의 **[0]이 오른쪽 = 후열**, **[1]이 왼쪽 = 전열(아군과 맞닿는 쪽)**이다.
//    처음에 [2,3]으로 넣었다가 전열3·후열2로 나와 Gim이 지적했다(2026-07-27).
//    => [후열3, 전열2] 순서로 적는다.
const FOE_COLS = [3, 2];
const rollFoes = () =>
  FOE_COLS.map((n) => Array.from({ length: n }, () => MONSTER_EMOJIS[Math.floor(Math.random() * MONSTER_EMOJIS.length)]));

// 발밑 분홍 타원 그림자(호드워) — 유닛이 바닥에 서 있다는 접지감을 준다.
const Shadow = ({ w = 30 }) => <View style={[s.shadow, { width: w }]} />;

// 피격 이펙트 💥 — 맞는 쪽 **모든 유닛** 위에 뜬다(Gim 지시 2026-07-27).
//   전에는 적 한 마리(ci===0 && i===0)에만 붙어 있었고 아군에는 아예 없었다.
//   anim 은 부모가 들고 있는 Animated.Value(적=slashA · 아군=counterA)라
//   레퍼런스가 고정이다 → React.memo 가 그대로 먹는다.
// 유닛별 데미지 숫자 — 맞은 유닛 머리 위에서 떠오르며 사라진다(Gim 지시 2026-07-27).
//   전에는 화면 전체에 5칸짜리 공용 슬롯 하나로 숫자를 돌려썼다(누가 맞았는지 알 수 없었다).
//   dmg = { tok, val, crit } — tok 이 바뀔 때만 다시 재생한다.
//   idx 로 값을 조금씩 흔들어 유닛마다 다른 숫자가 뜨게 한다(같은 숫자 5개는 부자연스럽다).
//   위치를 top 이 아닌 translateY 로 옮겨 네이티브 드라이버를 쓴다.
const DmgFloat = React.memo(function DmgFloat({ dmg, idx }) {
  const a = useRef(new Animated.Value(1)).current; // 1 = 연출 끝(안 보임)
  const tok = dmg ? dmg.tok : 0;
  useEffect(() => {
    if (!tok) return;
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: FLOAT_MS, useNativeDriver: true }).start();
  }, [tok]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!dmg || typeof dmg.val !== 'number') return null;
  const val = Math.round(dmg.val * (0.85 + ((idx * 37) % 31) / 100));
  return (
    <Animated.Text pointerEvents="none" style={[s.uFloat, dmg.crit && s.floatCrit, {
      opacity: a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }],
    }]}>{val.toLocaleString()}</Animated.Text>
  );
});

const HitFx = React.memo(function HitFx({ anim }) {
  return (
    <Animated.Text pointerEvents="none" style={[s.slash, {
      opacity: anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.7] }) }],
    }]}>💥</Animated.Text>
  );
});

// 유닛 발밑 HP바.
const HpBar = ({ pct, foe }) => (
  <View style={s.hpBg}>
    <View style={[s.hpFill, { width: `${Math.max(0, Math.min(100, pct * 100))}%`, backgroundColor: foe ? '#e0574a' : '#5cd65c' }]} />
  </View>
);

// 스프라이트 파이터 — idle 순환. 토큰 변경 시 해당 1회 모션 재생 후 idle.
//   좌우 대치라 러지는 가로(적 방향)로 튄다. 렌더 중 상태 파생(재렌더 1회로 축소).
const SpriteFighter = React.memo(function SpriteFighter({ cid, ckey, size, lungeDir, attackToken, hitToken, walkToken, staggerMs = 0 }) {
  const [anim, setAnim] = useState({ st: 'idle', tok: 0, a: attackToken, h: hitToken, w: walkToken });
  if (attackToken !== anim.a || hitToken !== anim.h || walkToken !== anim.w) {
    let st = anim.st;
    if (attackToken !== anim.a) st = 'attack';
    if (hitToken !== anim.h) st = 'hit';
    if (walkToken !== anim.w) st = 'walk';
    setAnim({ st, tok: anim.tok + 1, a: attackToken, h: hitToken, w: walkToken });
  }
  const lunge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!lungeDir || anim.st !== 'attack') return;
    Animated.sequence([
      Animated.delay(staggerMs),
      Animated.timing(lunge, { toValue: 10 * lungeDir, duration: 90, useNativeDriver: true }),
      Animated.timing(lunge, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [anim.tok]); // eslint-disable-line react-hooks/exhaustive-deps
  const spr = unitSprite(cid, ckey, anim.st) || unitSprite(cid, ckey, 'idle');
  return (
    <Animated.View style={{ transform: [{ translateX: lunge }] }}>
      <SpriteAnim
        source={spr.source} frameW={spr.frameW} frameH={spr.frameH} frames={spr.frames}
        state={anim.st} playToken={anim.tok} scale={size / spr.frameH} staggerMs={staggerMs}
        onEnd={() => setAnim((a) => ({ ...a, st: 'idle' }))}
      />
    </Animated.View>
  );
});

// 아군 한 칸 — 호드워: 속성 아이콘 + 레벨 뱃지 + 분홍 타원 그림자 + HP바.
const Ally = React.memo(function Ally({ slot, lungeDir, attackToken, hitToken, walkToken, staggerMs, hp, hitFx, dmg, idx = 0 }) {
  const o = slot && typeof slot === 'object' ? slot : { emoji: slot };
  const art = o.cid && o.key && hasUnitSprite(o.cid, o.key)
    ? <SpriteFighter cid={o.cid} ckey={o.key} size={ALLY_SIZE} lungeDir={lungeDir}
        attackToken={attackToken} hitToken={hitToken} walkToken={walkToken} staggerMs={staggerMs} />
    : <Text style={s.allyEmoji}>{o.emoji}</Text>;
  return (
    <View style={s.unit}>
      <View style={s.badges}>
        {o.elem ? <Text style={s.elemIc}>{o.elem}</Text> : null}
        {o.level ? <Text style={s.lvBadge}>{o.level}</Text> : null}
      </View>
      {art}
      <Shadow w={30} />
      <HpBar pct={hp} />
      {hitFx ? <HitFx anim={hitFx} /> : null}
      <DmgFloat dmg={dmg} idx={idx} />
    </View>
  );
});


// 슬롯별 고정 오프셋 — 같은 자리에 포개지지 않도록 칸마다 가로·세로를 벌려 둔다.
//   (좌우 대치로 바꾸면서 가로 분산을 빠뜨려 한 줄로 겹쳐 보였다 — 실기 제보로 수정.)
const SLOT_OFFSET = [
  { x: 6, y: 0 }, { x: 20, y: -7 }, { x: 12, y: 8 }, { x: 27, y: 4 }, { x: 2, y: -12 },
];

// 데미지 숫자 한 칸 — 슬롯이 덮어써질 때(tok 변경) 애니메이션을 처음부터 다시 재생한다.
//   컴포넌트는 마운트된 채 내용만 바뀌므로 DOM 노드가 늘지 않는다.
const FloatText = React.memo(function FloatText({ slot, tok, val, crit, big, side }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: FLOAT_MS, useNativeDriver: false }).start();
  }, [tok]); // eslint-disable-line react-hooks/exhaustive-deps
  const isFoe = side === 'enemy';
  const off = SLOT_OFFSET[slot % SLOT_OFFSET.length];
  return (
    <Animated.Text style={[
      s.float, crit && s.floatCrit, big && s.floatBig,
      {
        opacity: a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
        [isFoe ? 'right' : 'left']: `${8 + off.x}%`,
        top: a.interpolate({ inputRange: [0, 1], outputRange: [`${42 + off.y}%`, `${30 + off.y}%`] }),
      },
    ]}>{typeof val === 'number' ? val.toLocaleString() : val}</Animated.Text>
  );
});

// speed: 1 | 2 (호드워 배속 ×2) · paused: ⏸ 일시정지
function BattleView({ party = EMPTY_FORMATION, win = true, margin = 1, reduce, speed = 1, paused = false }) {
  const noMotion = reduce !== undefined ? reduce : reducedMotion();
  const enemyHp = useRef(1);
  const heroHp = useRef(1);
  const [atk, setAtk] = useState(0);
  const [hitTok, setHitTok] = useState(0);
  const [walkTok, setWalkTok] = useState(0);
  // 공용 슬롯은 이제 **`처치!` 같은 전체 이벤트 전용**이다.
  // 데미지 숫자는 유닛별(DmgFloat)로 내려갔다(Gim 지시 2026-07-27).
  const [floats, setFloats] = useState(emptySlots); // 길이 고정 슬롯(늘어날 수 없음)
  const [foeDmg, setFoeDmg] = useState(null);   // 적 전원에게 뜨는 피해 { tok, val, crit }
  const [heroDmg, setHeroDmg] = useState(null); // 아군 전원에게 뜨는 피해
  const dmgTok = useRef(0);
  const slotRef = useRef(0);
  const tokRef = useRef(0);
  const [foes, setFoes] = useState(rollFoes);

  const shakeX = useRef(new Animated.Value(0)).current;   // 크리티컬 무대 셰이크
  // 💥 값은 **1(연출 끝 = 안 보임)로 시작**한다. 0으로 두면 opacity 보간이 0→1이라
  // 첫 공격 전부터 💥가 떠 있다(유닛 1개일 땐 안 보였지만 10개로 늘리면 드러난다).
  const slashA = useRef(new Animated.Value(1)).current;   // 아군 공격 → 적 전원 피격 💥
  const counterA = useRef(new Animated.Value(1)).current; // 적 반격 → 아군 전원 피격 💥
  const flashA = useRef(new Animated.Value(1)).current;   // 적 피격 플래시
  const foeX = useRef(new Animated.Value(0)).current;     // 다음 웨이브 적 슬라이드인(우→좌)
  const heroFlashA = useRef(new Animated.Value(1)).current;
  const heroShakeX = useRef(new Animated.Value(0)).current;
  const dangerA = useRef(new Animated.Value(0)).current;

  const fxAttack = (crit) => {
    slashA.setValue(0);
    Animated.timing(slashA, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    flashA.setValue(0.35);
    Animated.timing(flashA, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (crit) {
      shakeX.setValue(0);
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 3, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -2, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]).start();
    }
  };
  const fxKill = () => {
    // 좌우 대치 — 다음 웨이브는 오른쪽 밖에서 밀려 들어온다.
    foeX.setValue(90);
    Animated.sequence([
      Animated.delay(120),
      Animated.spring(foeX, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  };
  const fxCounter = () => {
    // 적 공격을 아군이 맞는다 — 아군 전원에게 💥 (적 피격과 같은 규약).
    counterA.setValue(0);
    Animated.timing(counterA, { toValue: 1, duration: 180, useNativeDriver: true }).start();
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
    if (noMotion || paused) {
      // ⏸ 정지 중에는 숫자가 얼어붙은 채 남으므로 화면을 비워 둔다.
      // 💥도 애니 도중에 멈추면 그대로 박혀 있으므로 "끝난 상태"로 되돌린다.
      slashA.setValue(1); counterA.setValue(1);
      if (paused) { setFloats(emptySlots()); setFoeDmg(null); setHeroDmg(null); }
      enemyHp.current = win ? 0.45 : 0.85; heroHp.current = win ? 0.9 : 0.5;
      return;
    }
    const enemyDmg = win ? (margin > 2.2 ? 0.30 : margin > 1.4 ? 0.20 : 0.14) : 0.10;
    const heroDmg = win ? 0.05 : 0.16;
    let t = 0;
    const iv = setInterval(() => {
      t += 1;
      if (t % 4 === 0) { // 히어로 공격 (~0.6s)
        setAtk((a) => a + 1);
        const crit = Math.random() < 0.28;
        fxAttack(crit);
        const mul = crit ? 1.9 : 1;
        enemyHp.current -= enemyDmg * mul * (0.85 + Math.random() * 0.3);
        dmgTok.current += 1;
        setFoeDmg({ tok: dmgTok.current, val: Math.round(enemyDmg * mul * 4200), crit });
        if (enemyHp.current <= 0) {
          pushFloat('처치!', 'enemy', true, true);
          fxKill();
          enemyHp.current = 1;
          setFoes(rollFoes());
          setWalkTok((w) => w + 1);
        }
      }
      if (t % 6 === 0) { // 적 반격
        dmgTok.current += 1;
        setHeroDmg({ tok: dmgTok.current, val: Math.round(heroDmg * 3000), crit: false });
        heroHp.current = Math.max(win ? 0.35 : 0.12, heroHp.current - heroDmg);
        setHitTok((h) => h + 1);
        fxCounter();
      }
      heroHp.current = Math.min(1, heroHp.current + 0.012);
      // 만료 정리 — 푸시와 무관하게 매 틱 돌린다(rAF·커밋 타이밍에 의존하지 않게).
      //   비어 있으면 같은 배열을 돌려줘 불필요한 리렌더를 만들지 않는다.
      const now = Date.now();
      setFloats((fs) => expireSlots(fs, now));
    }, Math.round(150 / speed)); // 배속 ×2 = 틱 간격 절반
    let dangerLoop = null;
    if (!win) {
      dangerLoop = Animated.loop(Animated.sequence([
        Animated.timing(dangerA, { toValue: 0.14, duration: 700, useNativeDriver: true }),
        Animated.timing(dangerA, { toValue: 0.03, duration: 700, useNativeDriver: true }),
      ]));
      dangerLoop.start();
    } else dangerA.setValue(0);
    return () => { clearInterval(iv); if (dangerLoop) { dangerLoop.stop(); dangerA.setValue(0); } };
  }, [win, margin, noMotion, speed, paused]);

  // 데미지 숫자 정리는 "나이"로 한다 — 애니 완료 콜백이 한 번이라도 안 오면(백그라운드·모션끔)
  //   숫자가 영원히 쌓이기 때문(실제 발생했던 버그). 생성과 같은 시계로 만료분을 걷어낸다.
  function pushFloat(val, side, crit, big) {
    const idx = slotRef.current;
    slotRef.current = nextSlot(idx);
    tokRef.current += 1;
    const born = Date.now();
    setFloats((fs) => writeSlot(fs, idx, { tok: tokRef.current, born, val, side, crit, big }));
  }

  // 아군 2열 — 후열이 뒤(왼쪽), 전열이 적과 맞닿는다(오른쪽). 2026-07-26 중열 폐지.
  const allyCols = [
    { key: 'back', list: party.back, lunge: 0 },
    { key: 'front', list: party.front, lunge: 1 },
  ];

  return (
    <Animated.View style={[s.arena, { transform: [{ translateX: shakeX }] }]}>
      <Animated.View pointerEvents="none" style={[s.dangerOverlay, { opacity: dangerA }]} />
      {/* 데미지 숫자 — 슬롯 5칸 고정. key가 칸 번호라 마운트/언마운트가 없다. */}
      <View style={s.floatLayer} pointerEvents="none">
        {floats.map((f, i) => (f
          ? <FloatText key={i} slot={i} tok={f.tok} val={f.val} crit={f.crit} big={f.big} side={f.side} />
          : null))}
      </View>

      {/* 좌: 아군 3열 */}
      <Animated.View style={[s.side, { opacity: heroFlashA, transform: [{ translateX: heroShakeX }] }]}>
        {allyCols.map((c, ci) => (
          <View key={c.key} style={s.col}>
            {(c.list || []).map((slot, i) => (
              <Ally key={c.key + i} slot={slot} lungeDir={c.lunge}
                attackToken={atk} hitToken={hitTok} walkToken={walkTok}
                staggerMs={(ci * 60 + i * 40) % 160} hp={heroHp.current} hitFx={counterA}
                dmg={heroDmg} idx={ci * 3 + i} />
            ))}
          </View>
        ))}
      </Animated.View>

      {/* 우: 적 3열 */}
      <Animated.View style={[s.side, s.sideFoe, { opacity: flashA, transform: [{ translateX: foeX }] }]}>
        {foes.map((col, ci) => (
          <View key={'fc' + ci} style={s.col}>
            {col.map((em, i) => (
              <View key={'f' + ci + i} style={s.unit}>
                <Text style={s.foeEmoji}>{em}</Text>
                <Shadow w={26} />
                <HpBar pct={enemyHp.current} foe />
                <HitFx anim={slashA} />
                <DmgFloat dmg={foeDmg} idx={ci * 3 + i} />
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// 방치 틱마다 부모가 리렌더돼도 props(파티·win·margin)가 같으면 건너뛴다.
export default React.memo(BattleView);

const s = StyleSheet.create({
  // 좌우 대치 무대 — 왼쪽 절반 아군, 오른쪽 절반 적. 세로 가운데 정렬.
  arena: { flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  sideFoe: { flexDirection: 'row-reverse' }, // 적은 오른쪽 끝이 후열 — 서로 마주 본다
  col: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 1 },
  unit: { alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 1 },
  elemIc: { fontSize: 9 },
  // 레벨 뱃지(호드워) — 유닛 머리 위 작은 숫자칩.
  lvBadge: { fontSize: 7, fontWeight: '900', color: '#f2f7ff', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 5, paddingHorizontal: 3, overflow: 'hidden' },
  allyEmoji: { fontSize: 30 },
  foeEmoji: { fontSize: 28 },
  // 발밑 분홍 타원 그림자 — 호드워 고유의 접지 표현.
  shadow: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,120,170,0.35)', marginTop: -2 },
  hpBg: { width: 26, height: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 2, marginTop: 2, overflow: 'hidden' },
  hpFill: { height: 3, borderRadius: 2 },
  dangerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: T.danger, zIndex: 1 },
  floatLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 5 },
  slash: { position: 'absolute', top: '10%', fontSize: 24, zIndex: 6 },
  float: { position: 'absolute', fontSize: 12, fontWeight: '800', color: T.text },
  // 유닛 머리 위 데미지 숫자 — 유닛 칸 기준 절대배치.
  uFloat: { position: 'absolute', top: -4, fontSize: 12, fontWeight: '900', color: '#fff0a8', textShadowColor: '#000', textShadowRadius: 3, zIndex: 7 },
  floatCrit: { fontSize: 15, color: T.accent },
  floatBig: { fontSize: 14, color: T.good },
});
