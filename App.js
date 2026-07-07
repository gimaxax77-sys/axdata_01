import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './app/theme';
import { ResourceBar, Btn, fmt } from './app/components';
import { useGame } from './app/useGame';
import { setMuted, setHaptics, fx } from './app/feedback';
import { setReduceMotion } from './app/motion';
import { t, setLang } from './app/i18n';
import { SettingsModal } from './app/screens/Settings';
import IdleScreen from './app/screens/IdleScreen';
import RosterScreen from './app/screens/RosterScreen';
import GachaScreen from './app/screens/GachaScreen';
import ContentScreen from './app/screens/ContentScreen';
import ArenaGuildScreen from './app/screens/ArenaGuildScreen';
import MetaScreen from './app/screens/MetaScreen';
import ShopScreen from './app/screens/ShopScreen';
import { IntroModal, ObjectiveBanner } from './app/screens/Onboarding';
import ErrorBoundary from './app/ErrorBoundary';

// 탭 화면을 React.memo로 감싼다 — 방치 틱(초당)에는 rev/props가 안 바뀌어
// 비활성 화면이 리렌더되지 않는다(탭 전환·조작 렉 제거).
const TABS = [
  { key: 'idle', label: '방치', icon: '🏰', Screen: React.memo(IdleScreen) },
  { key: 'roster', label: '캐릭터', icon: '🐹', Screen: React.memo(RosterScreen) },
  { key: 'gacha', label: '소환', icon: '🔮', Screen: React.memo(GachaScreen) },
  { key: 'content', label: '콘텐츠', icon: '📅', Screen: React.memo(ContentScreen) },
  { key: 'arena', label: '경쟁', icon: '⚔️', Screen: React.memo(ArenaGuildScreen) },
  { key: 'meta', label: '기록', icon: '📖', Screen: React.memo(MetaScreen) },
  { key: 'shop', label: '상점', icon: '🛒', Screen: React.memo(ShopScreen) },
];

function fmtDuration(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분`;
  return `${sec}초`;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const game = useGame();
  const [tab, setTab] = useState('idle');
  const Active = TABS.find((t) => t.key === tab).Screen;

  const [settingsOpen, setSettingsOpen] = useState(false);
  // 설정을 세이브에서 엔진들에 반영
  const st = game.state.settings;
  setLang(st.lang); // 렌더 중 동기 반영 — 언어 전환이 같은 렌더에 즉시 적용(지연 없음)
  useEffect(() => { setMuted(st.muted); setHaptics(st.haptics); setReduceMotion(st.reduceMotion); }, [st.muted, st.haptics, st.reduceMotion]);
  const changeSetting = (key, val) => {
    game.state.settings[key] = val;
    // 엔진 반영은 위 useEffect가 담당(settings 값 변화 감지). 여기선 상태만 갱신.
    if (!game.state.settings.muted) fx('tap');
    game.save(); game.bump();
  };

  const doReset = () => {
    if (Platform.OS === 'web') {
      if (typeof globalThis !== 'undefined' && globalThis.confirm && !globalThis.confirm('정말 처음부터 다시 시작할까요? 저장이 삭제됩니다.')) return;
      game.reset();
    } else {
      Alert.alert('초기화', '정말 처음부터 다시 시작할까요? 저장이 삭제됩니다.', [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: game.reset },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <LinearGradient colors={T.bgGrad} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {/* 헤더 */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{game.concept.title}</Text>
          <Text style={s.subtitle}>{t('app_subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={() => { fx('tap'); setSettingsOpen(true); }} style={s.iconBtn} activeOpacity={0.7}
          accessibilityRole="button" accessibilityLabel="설정">
          <Text style={s.iconBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <View style={s.resWrap}>
        <ResourceBar concept={game.concept} wallet={game.state.wallet} />
      </View>

      {/* 온보딩 목표 배너 (소개를 본 뒤, 목표가 남아있을 때만) */}
      {game.state.tutorial.introSeen && (
        <ObjectiveBanner state={game.state} concept={game.concept} onGo={setTab} />
      )}

      {/* 화면 — rev(액션 신호)로만 리렌더. lastGain은 방치 탭에만 전달해
          다른 탭이 초당 리렌더되지 않게 한다. */}
      <View style={s.body}>
        <Active state={game.state} rev={game.rev} bump={game.bump} concept={game.concept}
          lastGain={tab === 'idle' ? game.lastGain : undefined} />
      </View>

      {/* 하단 탭 */}
      <View style={s.tabbar}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)} activeOpacity={0.8}
              accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: on }}>
              <Text style={[s.tabIcon, on && s.tabIconOn]}>{t.icon}</Text>
              <Text style={[s.tabLabel, on && s.tabLabelOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 오프라인 보상 팝업 */}
      <Modal transparent animationType="fade" visible={!!game.offline} onRequestClose={game.dismissOffline}>
        <View style={s.backdrop}>
          <View style={s.offCard}>
            <Text style={s.offEmoji}>🎁</Text>
            <Text style={s.offTitle}>다시 오셨네요!</Text>
            <Text style={s.offSub}>자리를 비운 {fmtDuration(game.offline?.seconds || 0)} 동안{'\n'}자동으로 전투해 보상을 모았어요.</Text>
            <View style={s.offGains}>
              <Text style={s.offGain}>{game.concept.resources.currency.emoji} +{fmt(game.offline?.gained?.currency || 0)}</Text>
              <Text style={s.offGain}>{game.concept.resources.growth.emoji} +{fmt(game.offline?.gained?.growth || 0)}</Text>
            </View>
            <View style={{ height: 14 }} />
            <Btn label="받기" kind="gold" onPress={game.dismissOffline} />
          </View>
        </View>
      </Modal>

      {/* 설정 */}
      <SettingsModal
        visible={settingsOpen}
        settings={game.state.settings}
        onChange={changeSetting}
        onReset={() => { setSettingsOpen(false); doReset(); }}
        onClose={() => setSettingsOpen(false)}
        onExport={game.exportSave}
        onImport={game.importSave}
      />

      {/* 첫 실행 소개 — 오프라인 팝업이 없을 때만 노출 */}
      <IntroModal
        concept={game.concept}
        visible={!game.state.tutorial.introSeen && !game.offline}
        onDone={() => { game.state.tutorial.introSeen = true; game.save(); game.bump(); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  title: { color: T.accent, fontWeight: '900', fontSize: 22 },
  subtitle: { color: T.muted, fontSize: 12, marginTop: 1 },
  iconBtn: { borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  iconBtnText: { fontSize: 15 },
  resWrap: { paddingHorizontal: 14, paddingVertical: 8 },
  body: { flex: 1 },
  tabbar: { flexDirection: 'row', backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.line, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconOn: { opacity: 1 },
  tabLabel: { color: T.muted, fontSize: 11, marginTop: 2, fontWeight: '700' },
  tabLabelOn: { color: T.accent },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  offCard: { backgroundColor: T.surface, borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: T.accent, width: '100%', maxWidth: 340 },
  offEmoji: { fontSize: 52 },
  offTitle: { color: T.text, fontWeight: '900', fontSize: 22, marginTop: 6 },
  offSub: { color: T.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  offGains: { flexDirection: 'row', gap: 20, marginTop: 16 },
  offGain: { color: T.good, fontWeight: '800', fontSize: 20 },
});
