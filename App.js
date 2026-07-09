import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, Modal, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './app/theme';
import { ResourceBar, Btn, fmt } from './app/components';
import { useGame } from './app/useGame';
import { setMuted, setHaptics, fx } from './app/feedback';
import { setReduceMotion, setEco } from './app/motion';
import { t, setLang } from './app/i18n';
import { SettingsModal } from './app/screens/Settings';
import { AdminModal } from './app/screens/Admin';
import { useFonts } from 'expo-font';
import IdleScreen from './app/screens/IdleScreen';
import PixelIdleScreen from './app/screens/PixelIdleScreen';
import RosterScreen from './app/screens/RosterScreen';
import GachaScreen from './app/screens/GachaScreen';
import ContentScreen from './app/screens/ContentScreen';
import ShopScreen from './app/screens/ShopScreen';
import { IntroModal, ObjectiveBanner } from './app/screens/Onboarding';
import ErrorBoundary from './app/ErrorBoundary';

// 탭 화면을 React.memo로 감싼다 — 방치 틱(초당)에는 rev/props가 안 바뀌어
// 비활성 화면이 리렌더되지 않는다(탭 전환·조작 렉 제거).
// 세나키우기식 타이트한 5탭. 경쟁→콘텐츠, 기록→영웅 서브탭으로 흡수(소환은 과금 노출 위해 유지).
const TABS = [
  { key: 'idle', label: '방치', icon: '🏰', Screen: React.memo(IdleScreen) },
  { key: 'roster', label: '영웅', icon: '🦸', Screen: React.memo(RosterScreen) },
  { key: 'gacha', label: '소환', icon: '🔮', Screen: React.memo(GachaScreen) },
  { key: 'content', label: '콘텐츠', icon: '📅', Screen: React.memo(ContentScreen) },
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
  // 갈무리 픽셀폰트 로드(비차단) — 로딩 전엔 시스템 폰트로 폴백.
  useFonts({
    Galmuri11: require('./assets/fonts/Galmuri11.ttf'),
    'Galmuri11-Bold': require('./assets/fonts/Galmuri11-Bold.ttf'),
  });
  const [tab, setTab] = useState('idle');
  const [pixelMode, setPixelMode] = useState(false); // 픽셀 방치 화면 미리보기
  const Active = TABS.find((t) => t.key === tab).Screen;
  const showPixel = pixelMode && tab === 'idle';

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [noticeHidden, setNoticeHidden] = useState(false);
  // 설정을 세이브에서 엔진들에 반영
  const st = game.state.settings;
  setLang(st.lang); // 렌더 중 동기 반영 — 언어 전환이 같은 렌더에 즉시 적용(지연 없음)
  useEffect(() => { setMuted(st.muted); setHaptics(st.haptics); setReduceMotion(st.reduceMotion); setEco(st.ecoMode); }, [st.muted, st.haptics, st.reduceMotion, st.ecoMode]);
  // 가로 wide(PC/태블릿) — 넓은 화면에서 콘텐츠를 폰 폭으로 가운데 정렬(늘어짐 방지).
  const { width: winW } = useWindowDimensions();
  const wide = winW >= 720;
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
      {/* 가로 wide: 넓은 화면에선 폰 폭으로 가운데 정렬한 프레임 안에 배치 */}
      <View style={[s.frame, wide && s.frameWide]}>
      {/* 헤더 (픽셀 모드에선 몰입 위해 숨김) */}
      {!showPixel && (
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{game.concept.title}</Text>
            <Text style={s.subtitle}>{t('app_subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => { fx('tap'); setPixelMode((v) => !v); }} style={s.iconBtn} activeOpacity={0.7}
            accessibilityRole="button" accessibilityLabel="픽셀 모드">
            <Text style={s.iconBtnText}>🎨</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { fx('tap'); setSettingsOpen(true); }} style={s.iconBtn} activeOpacity={0.7}
            accessibilityRole="button" accessibilityLabel="설정">
            <Text style={s.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      )}
      {!showPixel && (
        <View style={s.resWrap}>
          <ResourceBar concept={game.concept} wallet={game.state.wallet} />
        </View>
      )}

      {/* 원격 공지/이벤트 배너 (Remote Config) — 탭 1회 닫기 */}
      {!showPixel && (game.remote?.notice || game.remote?.event) && !noticeHidden && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => setNoticeHidden(true)} style={s.notice}>
          <Text style={s.noticeText} numberOfLines={2}>
            {game.remote.event?.text ? `🎉 ${game.remote.event.text}` : `📢 ${game.remote.notice.text}`}
          </Text>
          <Text style={s.noticeX}>✕</Text>
        </TouchableOpacity>
      )}

      {/* 온보딩 목표 배너 (소개를 본 뒤, 목표가 남아있을 때만) */}
      {!showPixel && game.state.tutorial.introSeen && (
        <ObjectiveBanner state={game.state} concept={game.concept} onGo={setTab} />
      )}

      {/* 화면 — rev(액션 신호)로만 리렌더. lastGain은 방치 탭에만 전달해
          다른 탭이 초당 리렌더되지 않게 한다. */}
      <View style={s.body}>
        {showPixel ? (
          <View style={{ flex: 1 }}>
            <PixelIdleScreen state={game.state} rev={game.rev} bump={game.bump} concept={game.concept} lastGain={game.lastGain} />
            <TouchableOpacity onPress={() => { fx('tap'); setPixelMode(false); }} style={s.pixelExit} activeOpacity={0.8}>
              <Text style={s.pixelExitTxt}>✕ 일반</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Active state={game.state} rev={game.rev} bump={game.bump} concept={game.concept}
            lastGain={tab === 'idle' ? game.lastGain : undefined} />
        )}
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
      </View>{/* /frame */}

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
            {game.offline?.doubled ? (
              <Text style={s.offBonus}>✨ 2배 적용됨{game.state.profile?.premium ? ' (광고제거 패스)' : ''}</Text>
            ) : null}
            <View style={{ height: 14 }} />
            {!game.offline?.doubled && (
              <>
                <Btn label="📺 광고 보고 2배" kind="gold" onPress={game.claimOfflineBonus} />
                <View style={{ height: 8 }} />
              </>
            )}
            <Btn label="받기" kind={game.offline?.doubled ? 'gold' : 'ghost'} onPress={game.dismissOffline} />
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
        onOpenAdmin={() => { setSettingsOpen(false); setAdminOpen(true); }}
        cloud={game.cloud}
        onSync={game.syncNow}
        onSignOut={game.signOutCloud}
      />

      {/* 운영자 조작 패널 */}
      <AdminModal
        visible={adminOpen}
        state={game.state}
        onChange={() => { game.save(); game.bump(); }}
        onClose={() => setAdminOpen(false)}
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
  frame: { flex: 1 },
  // 넓은 화면(PC/태블릿 가로): 폰 폭으로 가운데 정렬 + 좌우 경계선으로 프레임감.
  frameWide: { width: '100%', maxWidth: 720, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.line },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.accent },
  noticeText: { color: T.text, fontSize: 12, fontWeight: '700', flex: 1 },
  noticeX: { color: T.muted, fontSize: 14, fontWeight: '900' },
  title: { color: T.accent, fontWeight: '900', fontSize: 22 },
  subtitle: { color: T.muted, fontSize: 12, marginTop: 1 },
  iconBtn: { borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  iconBtnText: { fontSize: 15 },
  pixelExit: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(20,15,40,0.85)', borderWidth: 1, borderColor: '#4a3f88', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  pixelExitTxt: { color: '#e6ecf6', fontSize: 12, fontWeight: '800' },
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
  offBonus: { color: T.accent, fontWeight: '800', fontSize: 13, marginTop: 12 },
});
