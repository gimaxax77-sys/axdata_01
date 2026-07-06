import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { T } from './app/theme';
import { ResourceBar, Btn, fmt } from './app/components';
import { useGame } from './app/useGame';
import IdleScreen from './app/screens/IdleScreen';
import RosterScreen from './app/screens/RosterScreen';
import GachaScreen from './app/screens/GachaScreen';
import ContentScreen from './app/screens/ContentScreen';
import ArenaGuildScreen from './app/screens/ArenaGuildScreen';
import MetaScreen from './app/screens/MetaScreen';
import ShopScreen from './app/screens/ShopScreen';

const TABS = [
  { key: 'idle', label: '방치', icon: '🏰', Screen: IdleScreen },
  { key: 'roster', label: '캐릭터', icon: '🐹', Screen: RosterScreen },
  { key: 'gacha', label: '소환', icon: '🔮', Screen: GachaScreen },
  { key: 'content', label: '콘텐츠', icon: '📅', Screen: ContentScreen },
  { key: 'arena', label: '경쟁', icon: '⚔️', Screen: ArenaGuildScreen },
  { key: 'meta', label: '기록', icon: '📖', Screen: MetaScreen },
  { key: 'shop', label: '상점', icon: '🛒', Screen: ShopScreen },
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
  const game = useGame();
  const [tab, setTab] = useState('idle');
  const Active = TABS.find((t) => t.key === tab).Screen;

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
      {/* 헤더 */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{game.concept.title}</Text>
          <Text style={s.subtitle}>방치형 수집 RPG · 자동 저장</Text>
        </View>
        <TouchableOpacity onPress={doReset} style={s.reset} activeOpacity={0.7}>
          <Text style={s.resetText}>초기화</Text>
        </TouchableOpacity>
      </View>
      <View style={s.resWrap}>
        <ResourceBar concept={game.concept} wallet={game.state.wallet} />
      </View>

      {/* 화면 */}
      <View style={s.body}>
        <Active state={game.state} bump={game.bump} lastGain={game.lastGain} concept={game.concept} />
      </View>

      {/* 하단 탭 */}
      <View style={s.tabbar}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)} activeOpacity={0.8}>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  title: { color: T.accent, fontWeight: '900', fontSize: 22 },
  subtitle: { color: T.muted, fontSize: 12, marginTop: 1 },
  reset: { borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  resetText: { color: T.muted, fontSize: 12, fontWeight: '700' },
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
