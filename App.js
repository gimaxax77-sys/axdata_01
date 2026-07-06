import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { T } from './app/theme';
import { ResourceBar } from './app/components';
import { useGame } from './app/useGame';
import IdleScreen from './app/screens/IdleScreen';
import RosterScreen from './app/screens/RosterScreen';
import GachaScreen from './app/screens/GachaScreen';

const TABS = [
  { key: 'idle', label: '방치', icon: '🏰', Screen: IdleScreen },
  { key: 'roster', label: '캐릭터', icon: '🐹', Screen: RosterScreen },
  { key: 'gacha', label: '소환', icon: '🔮', Screen: GachaScreen },
];

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState('idle');
  const Active = TABS.find((t) => t.key === tab).Screen;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>{game.concept.title}</Text>
        <Text style={s.subtitle}>방치형 수집 RPG</Text>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  title: { color: T.accent, fontWeight: '900', fontSize: 22 },
  subtitle: { color: T.muted, fontSize: 12, marginTop: 1 },
  resWrap: { paddingHorizontal: 14, paddingVertical: 8 },
  body: { flex: 1 },
  tabbar: { flexDirection: 'row', backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.line, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconOn: { opacity: 1 },
  tabLabel: { color: T.muted, fontSize: 11, marginTop: 2, fontWeight: '700' },
  tabLabelOn: { color: T.accent },
});
