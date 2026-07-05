import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const GRID = 9; // 3 x 3 구멍
const GAME_SECONDS = 30;

// 난이도: 점수가 오를수록 두더지가 더 빨리 나타났다 사라짐
function spawnInterval(score) {
  return Math.max(450, 1000 - score * 25);
}
function visibleTime(score) {
  return Math.max(500, 900 - score * 20);
}

// 개별 구멍(두더지) 컴포넌트
function Hole({ active, isBomb, onWhack }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1 : 0,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [active]);

  return (
    <View style={styles.hole}>
      <View style={styles.holeDirt} />
      <Pressable
        style={styles.holeTouch}
        onPress={() => active && onWhack(isBomb)}
      >
        <Animated.View
          style={[
            styles.mole,
            isBomb ? styles.bomb : styles.moleBody,
            { transform: [{ scale }] },
          ]}
        >
          <Text style={styles.moleFace}>{isBomb ? '💣' : '🐹'}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home'); // home | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [holes, setHoles] = useState(
    Array(GRID).fill({ active: false, isBomb: false })
  );

  const scoreRef = useRef(0);
  const spawnTimer = useRef(null);
  const hideTimer = useRef(null);
  const clockTimer = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(spawnTimer.current);
    clearTimeout(hideTimer.current);
    clearInterval(clockTimer.current);
  }, []);

  // 두더지 하나를 랜덤 위치에 등장시키는 루프
  const scheduleSpawn = useCallback(() => {
    const delay = spawnInterval(scoreRef.current);
    spawnTimer.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * GRID);
      const isBomb = Math.random() < 0.2; // 20% 확률로 폭탄
      setHoles((prev) => {
        const next = prev.map(() => ({ active: false, isBomb: false }));
        next[idx] = { active: true, isBomb };
        return next;
      });
      hideTimer.current = setTimeout(() => {
        setHoles((prev) => prev.map(() => ({ active: false, isBomb: false })));
      }, visibleTime(scoreRef.current));
      scheduleSpawn();
    }, delay);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setHoles(Array(GRID).fill({ active: false, isBomb: false }));
    setScreen('playing');

    clockTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    scheduleSpawn();
  }, [scheduleSpawn, clearTimers]);

  const endGame = useCallback(() => {
    clearTimers();
    setHoles(Array(GRID).fill({ active: false, isBomb: false }));
    setBest((b) => Math.max(b, scoreRef.current));
    setScreen('over');
  }, [clearTimers]);

  const onWhack = useCallback(
    (isBomb) => {
      if (isBomb) {
        // 폭탄을 치면 즉시 게임 종료
        endGame();
        return;
      }
      scoreRef.current += 1;
      setScore(scoreRef.current);
      // 잡은 두더지는 바로 숨김
      setHoles((prev) => prev.map(() => ({ active: false, isBomb: false })));
    },
    [endGame]
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ---- 화면 렌더링 ----
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.emojiBig}>🐹</Text>
        <Text style={styles.title}>두더지 잡기</Text>
        <Text style={styles.subtitle}>
          {GAME_SECONDS}초 안에 두더지를 최대한 많이 잡으세요!{'\n'}
          단, 💣 폭탄을 치면 즉시 게임 오버!
        </Text>
        {best > 0 && <Text style={styles.best}>🏆 최고 점수: {best}</Text>}
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>게임 시작</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'over') {
    const isNewBest = score >= best && score > 0;
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.emojiBig}>{isNewBest ? '🎉' : '⏰'}</Text>
        <Text style={styles.title}>게임 종료!</Text>
        <Text style={styles.finalScore}>{score}점</Text>
        {isNewBest && <Text style={styles.newBest}>새로운 최고 기록!</Text>}
        <Text style={styles.best}>🏆 최고 점수: {best}</Text>
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>다시 하기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.linkText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // playing
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hud}>
        <View style={styles.hudBox}>
          <Text style={styles.hudLabel}>점수</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudBox}>
          <Text style={styles.hudLabel}>남은 시간</Text>
          <Text style={[styles.hudValue, timeLeft <= 5 && styles.hudDanger]}>
            {timeLeft}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {holes.map((h, i) => (
          <Hole
            key={i}
            active={h.active}
            isBomb={h.isBomb}
            onWhack={onWhack}
          />
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const HOLE_SIZE = Math.min((width - 80) / 3, 110);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7bc043',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emojiBig: { fontSize: 80, marginBottom: 12 },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#f2ffe0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  best: { fontSize: 18, color: '#fff', fontWeight: '600', marginBottom: 20 },
  finalScore: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    marginVertical: 8,
  },
  newBest: { fontSize: 20, color: '#fff59d', fontWeight: '700', marginBottom: 8 },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: { fontSize: 22, fontWeight: '800', color: '#5a9e2f' },
  linkText: { color: '#f2ffe0', fontSize: 16, marginTop: 18 },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  hudBox: { alignItems: 'center' },
  hudLabel: { color: '#f2ffe0', fontSize: 14, marginBottom: 4 },
  hudValue: { color: '#fff', fontSize: 40, fontWeight: '900' },
  hudDanger: { color: '#ffd54f' },
  grid: {
    width: HOLE_SIZE * 3 + 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hole: {
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  holeDirt: {
    position: 'absolute',
    bottom: 0,
    width: HOLE_SIZE,
    height: HOLE_SIZE * 0.55,
    borderRadius: HOLE_SIZE / 2,
    backgroundColor: '#5d3a1a',
  },
  holeTouch: {
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mole: {
    width: HOLE_SIZE * 0.7,
    height: HOLE_SIZE * 0.7,
    borderRadius: HOLE_SIZE * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moleBody: { backgroundColor: '#c8843d' },
  bomb: { backgroundColor: '#37474f' },
  moleFace: { fontSize: HOLE_SIZE * 0.4 },
});
