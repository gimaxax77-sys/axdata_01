import './app/backend/supabaseImpl'; // Supabase 클라우드 공급자 등록(계정·역할·세이브)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './app/theme';
import { Btn, fmt } from './app/components';
import { useGame } from './app/useGame';
import { setMuted, setHaptics, fx } from './app/feedback';
import { setReduceMotion, setEco } from './app/motion';
import { setUiCodes } from './app/uicode';
import { t, setLang } from './app/i18n';
import { SettingsModal } from './app/screens/Settings';
import { AdminModal } from './app/screens/Admin';
import { ConsoleModal } from './app/screens/Console';
import { NoticePopup } from './app/screens/NoticePopup';
import { MailboxModal } from './app/screens/MailboxModal';
import { unreadMailCount } from './system/core/mailbox.mjs';
import { useFonts } from 'expo-font';
import FortressScreen from './app/screens/FortressScreen';
import HeroScreen from './app/screens/HeroScreen';
import AdventureScreen from './app/screens/AdventureScreen';
import FieldScreen from './app/screens/FieldScreen';
import GuildScreen from './app/screens/GuildScreen';
import PerkScreen from './app/screens/PerkScreen';
import { IntroModal } from './app/screens/Onboarding';
import ErrorBoundary from './app/ErrorBoundary';
import FixedStage from './app/FixedStage';
import { MAX_PARTY } from './system/core/gameState.mjs';
import { CAMPAIGN_CHAPTER_COUNT } from './system/core/campaign.mjs';
import { playerLevel, playerTitle } from './system/core/player.mjs';
import { can } from './system/core/roles.mjs';

// 탭 화면을 React.memo로 감싼다 — 방치 틱(초당)에는 rev/props가 안 바뀌어
// 비활성 화면이 리렌더되지 않는다(탭 전환·조작 렉 제거).
//
// 하단 메뉴바 = 호드워 6탭(요새·필드·길드·영웅·혜택·모험). 기준 docs/HORDWAR_SPEC.md.
//   '모험'만 혼자 넓고 다른 모양 = 주 진행 버튼. 선택 탭은 칸 배경 전체가 금색.
//
// ⚠️ 구축 단계에는 **6탭 전부 열어둔다**(Gim 지시). 호드워는 잠긴 탭을 자물쇠째 노출하지만,
//    그건 출시 시점의 표현이지 지금 상태가 아니다. 자물쇠는 **출시 직전 최종 단계**에 채운다.
//    필드·길드·혜택은 Gim이 2026-07-26 실기 캡처 3장을 추가로 제공해 골격을 확보했다
//    (docs/HORDWAR_SPEC.md "필드 · 길드 · 혜택 탭"). 화면은 만들되 안의 노드·목록은
//    해당 모듈이 파킹 상태라 잠금 표시로 둔다.
const TABS = [
  { key: 'idle', label: '요새', icon: '🏰', Screen: React.memo(FortressScreen) },
  { key: 'field', label: '필드', icon: '🌄', Screen: React.memo(FieldScreen) },
  { key: 'guild', label: '길드', icon: '🏛️', Screen: React.memo(GuildScreen) },
  { key: 'hero', label: '영웅', icon: '🦸', Screen: React.memo(HeroScreen) },
  { key: 'perk', label: '혜택', icon: '🎁', Screen: React.memo(PerkScreen) },
  { key: 'adventure', label: '모험', icon: '⚔️', Screen: React.memo(AdventureScreen), wide: true },
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // ☰ 메뉴(설정 진입)
  const [lockMsg, setLockMsg] = useState(null); // 잠긴 탭·＋ 버튼 안내(호드워식 자물쇠 노출)
  const [noticeHidden, setNoticeHidden] = useState(false);
  const mailUnread = unreadMailCount(game.state);
  const [noticePopupClosed, setNoticePopupClosed] = useState(false);
  // 공지/이벤트 팝업 — 새 공지가 있으면 접속 시 가운데 모달로 1회 표시.
  //   서명(공지+이벤트 텍스트)이 이전에 확인한 것과 다르면 다시 뜬다.
  const noticeText = game.remote?.notice?.text || null;
  const eventText = game.remote?.event?.text || null;
  const noticeSig = (noticeText || eventText) ? `${noticeText || ''}|${eventText || ''}` : null;
  const showNoticePopup = !!noticeSig && !noticePopupClosed
    && noticeSig !== game.state.settings.dismissedNotice;
  const dismissNoticePopup = useCallback(() => {
    game.state.settings.dismissedNotice = noticeSig;
    game.save();
    setNoticePopupClosed(true);
  }, [game, noticeSig]);
  // 운영자 조작 접근 게이트: 백엔드 연결 시 admin 역할만, 순수 오프라인이면 기존대로 허용.
  const adminUnlocked = !game.cloud.available || can(game.cloud.role, 'tuneBalance');
  // 운영자 콘솔(공지·이벤트) 접근: 매니저 이상만 — 백엔드 연결 시에만 노출.
  const consoleUnlocked = game.cloud.available && can(game.cloud.role, 'sendNotice');
  // 상점으로 옮긴 환경 버튼(픽셀 화면·설정) 핸들러 — memo 유지 위해 안정 참조(useCallback).
  const openSettings = useCallback(() => { fx('tap'); setSettingsOpen(true); }, []);
  // 알 수 없는 키면 메인('요새')으로.
  const route = TABS.find((r) => r.key === tab) || TABS[0];
  const BaseScreen = route.Screen;
  // 설정을 세이브에서 엔진들에 반영
  const st = game.state.settings;
  setLang(st.lang); // 렌더 중 동기 반영 — 언어 전환이 같은 렌더에 즉시 적용(지연 없음)
  useEffect(() => { setMuted(st.muted); setHaptics(st.haptics); setReduceMotion(st.reduceMotion); setEco(st.ecoMode); setUiCodes(st.uiCodes); }, [st.muted, st.haptics, st.reduceMotion, st.ecoMode, st.uiCodes]);
  // 탭 ❗뱃지(호드워: 영웅·모험에 붙어 있다) — "지금 할 일이 있다"는 신호만 준다.
  const gs = game.state;
  const tabDots = {
    hero: gs.party.length < MAX_PARTY, // 편성 자리가 비었다
    adventure: ((gs.campaign && gs.campaign.cleared) || 0) < CAMPAIGN_CHAPTER_COUNT, // 남은 챕터가 있다
  };
  // 상단 아바타 — 레벨은 진행도 파생(저장 필드 없음). 경험치바는 레벨 사이 소수부.
  const plvl = playerLevel(gs);
  const expPct = Math.round(((Math.sqrt(Math.max(1, gs.peakStage || 1)) * 2) % 1) * 100);
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
      {/* 기준 해상도 고정 — 기기와 무관하게 같은 화면을 통째로 확대/축소(세븐식). 남는 여백은 레터박스. */}
      <FixedStage>
      <View style={s.frame}>
      <LinearGradient colors={T.bgGrad} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {/* 게임명/장르 헤더 제거 — 자원바가 최상단. 픽셀 화면·설정은 상점 탭으로 이동. */}
      {/* 호드워식 상단바 — 좌: 초상(녹색 테두리)+닉+★Lv+경험치바 / 우: 재화 세로 2줄 + [＋] */}
      <View style={s.resWrap}>
          <View style={s.topRow}>
            <View style={s.avaFrame}><Text style={s.avaFace}>🧝</Text></View>
            <View style={s.avaCol}>
              <View style={s.avaNmRow}>
                {/* 닉네임 데이터가 없어 칭호를 닉네임 자리에 쓴다. */}
                <Text style={s.avaNm} numberOfLines={1}>{playerTitle(plvl)}</Text>
                <View style={s.avaLvBox}><Text style={s.avaLv}>★{plvl}</Text></View>
              </View>
              <View style={s.expBar}><View style={[s.expFill, { width: `${expPct}%` }]} /></View>
            </View>
            <View style={s.curCol}>
              {['gem', 'currency'].map((k) => (
                <View key={k} style={s.curRow}>
                  <Text style={s.curIc}>{game.concept.resources[k].emoji}</Text>
                  <Text style={s.curVal} numberOfLines={1}>{fmt(game.state.wallet[k] || 0)}</Text>
                  <TouchableOpacity style={s.curPlus} activeOpacity={0.8}
                    onPress={() => { fx('error'); setLockMsg('🔒 상점은 준비 중입니다'); }}
                    accessibilityRole="button" accessibilityLabel={`${game.concept.resources[k].name} 충전`}>
                    <Text style={s.curPlusTx}>＋</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.mailBtn} activeOpacity={0.8}
              onPress={() => { fx('tap'); setMailboxOpen(true); }}
              accessibilityRole="button" accessibilityLabel="우편함">
              <Text style={s.mailIcon}>📬</Text>
              {mailUnread > 0 && (
                <View style={s.mailBadge}>
                  <Text style={s.mailBadgeTxt}>{mailUnread > 99 ? '99+' : mailUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.menuBtn} activeOpacity={0.8}
              onPress={() => { fx('tap'); setMenuOpen(true); }}
              accessibilityRole="button" accessibilityLabel="메뉴">
              <Text style={s.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* 원격 공지/이벤트 배너 (Remote Config) — 탭 1회 닫기 */}
      {(game.remote?.notice || game.remote?.event) && !noticeHidden && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => setNoticeHidden(true)} style={s.notice}>
          <Text style={s.noticeText} numberOfLines={2}>
            {game.remote.event?.text ? `🎉 ${game.remote.event.text}` : `📢 ${game.remote.notice.text}`}
          </Text>
          <Text style={s.noticeX}>✕</Text>
        </TouchableOpacity>
      )}

      {/* 화면 — rev(액션 신호)로만 리렌더. lastGain은 방치 탭에만 전달해
          다른 탭이 초당 리렌더되지 않게 한다. */}
      <View style={s.body}>
        <BaseScreen state={game.state} rev={game.rev} bump={game.bump} concept={game.concept}
          lastGain={tab === 'idle' ? game.lastGain : undefined}
          onLocked={setLockMsg}
          onGo={setTab}
          onOpenSettings={openSettings} />
      </View>

      {/* 잠금 안내 토스트 — 잠긴 탭·재화 ＋ 를 눌렀을 때. 탭하면 닫힘. */}
      {lockMsg && (
        <TouchableOpacity style={s.lockToast} activeOpacity={0.9} onPress={() => setLockMsg(null)}
          accessibilityRole="button" accessibilityLabel={`${lockMsg} — 닫기`}>
          <Text style={s.lockToastTx}>{lockMsg}</Text>
        </TouchableOpacity>
      )}

      {/* 하단 메뉴바 — 호드워 6탭. 선택 시 칸 배경 전체가 금색, 잠긴 탭은 자물쇠째 노출. */}
      <View style={s.tabbar}>
        {TABS.map((t) => {
          const on = t.key === tab;
          const dot = !!tabDots[t.key];
          return (
            <TouchableOpacity key={t.key} style={[s.tab, t.wide && s.tabWide, on && s.tabOn]} activeOpacity={0.8}
              onPress={() => { fx('tap'); setLockMsg(null); setTab(t.key); }}
              accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={dot ? `${t.label} (할 일 있음)` : t.label}>
              <View>
                <Text style={[s.tabIcon, on && s.tabIconOn]}>{t.icon}</Text>
                {dot && <View style={s.tabDot} />}
              </View>
              <Text style={[s.tabLabel, on && s.tabLabelOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </View>{/* /frame */}
      </FixedStage>

      {/* ☰ 메뉴 — 설정 진입. 메뉴바에서 뺀 화면들은 파킹됐다(docs/PARKED.md). */}
      <Modal transparent animationType="fade" visible={menuOpen} onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}
          accessibilityRole="button" accessibilityLabel="메뉴 닫기">
          <View style={s.menuCard}>
            <Text style={s.menuTitle}>메뉴</Text>
            <TouchableOpacity style={s.menuRow} activeOpacity={0.8}
              onPress={() => { setMenuOpen(false); openSettings(); }}
              accessibilityRole="button" accessibilityLabel="설정">
              <Text style={s.menuRowIc}>⚙️</Text>
              <Text style={s.menuRowTx}>설정</Text>
              <Text style={s.menuRowGo}>›</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
        onOpenAdmin={adminUnlocked ? () => { setSettingsOpen(false); setAdminOpen(true); } : undefined}
        onOpenConsole={consoleUnlocked ? () => { setSettingsOpen(false); setConsoleOpen(true); } : undefined}
        cloud={game.cloud}
        onSync={game.syncNow}
        onSignOut={game.signOutCloud}
        onSignUp={game.signUpEmail}
        onSignInEmail={game.signInEmail}
      />

      {/* 운영자 조작 패널 */}
      <AdminModal
        visible={adminOpen}
        state={game.state}
        onChange={() => { game.save(); game.bump(); }}
        onClose={() => setAdminOpen(false)}
      />

      {/* 운영자 콘솔 (공지·이벤트) */}
      <ConsoleModal
        visible={consoleOpen}
        role={game.cloud.role}
        remote={game.remote}
        onSet={game.setRemoteConfig}
        onClear={game.clearRemoteConfig}
        onSendMail={game.sendMailCloud}
        onClose={() => setConsoleOpen(false)}
      />

      {/* 우편함 — 상단 아이콘으로 어디서든 열기 */}
      <MailboxModal
        visible={mailboxOpen}
        state={game.state}
        concept={game.concept}
        bump={game.bump}
        onClose={() => setMailboxOpen(false)}
      />

      {/* 공지/이벤트 팝업 — 접속 시 새 공지가 있으면 표시 */}
      <NoticePopup
        visible={showNoticePopup}
        notice={noticeText}
        event={eventText}
        onClose={dismissNoticePopup}
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
  frame: { flex: 1, overflow: 'hidden' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.accent },
  noticeText: { color: T.text, fontSize: 12, fontWeight: '700', flex: 1 },
  noticeX: { color: T.muted, fontSize: 14, fontWeight: '900' },
  // 호드워식 상단바 — 좌 초상+닉+★Lv+경험치바 / 우 재화 세로2줄+[＋].
  resWrap: { paddingHorizontal: 8, paddingVertical: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // 초상화 프레임 — 호드워는 녹색 테두리.
  avaFrame: { width: 34, height: 34, borderRadius: 9, borderWidth: 2, borderColor: T.good, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  avaFace: { fontSize: 18 },
  avaCol: { flex: 1, justifyContent: 'center' },
  avaNmRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avaNm: { color: T.text, fontSize: 10, fontWeight: '800', flexShrink: 1 },
  avaLvBox: { borderRadius: 8, backgroundColor: T.accent, paddingHorizontal: 5, paddingVertical: 1 },
  avaLv: { color: '#241a00', fontSize: 8, fontWeight: '900' },
  expBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.55)', overflow: 'hidden', marginTop: 3 },
  expFill: { height: 5, borderRadius: 3, backgroundColor: T.primary },
  // 재화 세로 2줄 — 줄마다 [아이콘 + 값 + ＋]. ＋가 곧 과금 동선(호드워 고유).
  curCol: { gap: 3 },
  curRow: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingLeft: 5, paddingRight: 2, paddingVertical: 1 },
  curIc: { fontSize: 11 },
  curVal: { color: T.text, fontSize: 10, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  curPlus: { width: 15, height: 15, borderRadius: 8, backgroundColor: T.good, alignItems: 'center', justifyContent: 'center' },
  curPlusTx: { color: '#08210f', fontSize: 10, fontWeight: '900' },
  mailBtn: { width: 28, height: 30, alignItems: 'center', justifyContent: 'center' },
  menuBtn: { width: 24, height: 30, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: T.text, fontSize: 16, fontWeight: '900' },
  // 잠금 안내 토스트 — 메뉴바 바로 위.
  lockToast: { position: 'absolute', left: 20, right: 20, bottom: 62, backgroundColor: 'rgba(10,14,24,0.94)', borderWidth: 1, borderColor: T.accent, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, zIndex: 20 },
  lockToastTx: { color: T.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  menuCard: { backgroundColor: T.surface, borderRadius: 18, paddingVertical: 8, borderWidth: 1, borderColor: T.line, width: '100%', maxWidth: 300 },
  menuTitle: { color: T.accent, fontSize: 13, fontWeight: '900', paddingHorizontal: 16, paddingVertical: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.line },
  menuRowIc: { fontSize: 18 },
  menuRowTx: { color: T.text, fontSize: 14, fontWeight: '800', flex: 1 },
  menuRowGo: { color: T.muted, fontSize: 18, fontWeight: '900' },
  mailIcon: { fontSize: 20 },
  mailBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: T.surface },
  mailBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  body: { flex: 1 },
  // 호드워식 하단 메뉴바 — 6탭. 선택 시 **칸 배경 전체가 금색**(세븐의 얇은 인디케이터와 대조).
  //   '모험'은 혼자 넓다(주 진행 버튼). 구축 단계라 전부 열려 있다(자물쇠는 출시 직전에).
  tabbar: { flexDirection: 'row', alignItems: 'stretch', gap: 2, backgroundColor: '#0a1018', borderTopWidth: 1, borderTopColor: T.line, paddingHorizontal: 3, paddingTop: 3, paddingBottom: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 9 },
  tabWide: { flex: 1.7, backgroundColor: 'rgba(255,201,60,0.14)', borderWidth: 1, borderColor: 'rgba(255,201,60,0.5)' },
  tabOn: { backgroundColor: T.accent, borderColor: T.accent },
  tabIcon: { fontSize: 18, opacity: 0.55 },
  tabIconOn: { opacity: 1 },
  tabDot: { position: 'absolute', top: -1, right: -6, width: 7, height: 7, borderRadius: 4, backgroundColor: T.danger, borderWidth: 1.5, borderColor: '#0a1018' },
  tabLabel: { color: T.muted, fontSize: 8, marginTop: 1, fontWeight: '700' },
  tabLabelOn: { color: '#241a00', fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  offCard: { backgroundColor: T.surface, borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: T.accent, width: '100%', maxWidth: 340 },
  offEmoji: { fontSize: 52 },
  offTitle: { color: T.text, fontWeight: '900', fontSize: 22, marginTop: 6 },
  offSub: { color: T.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  offGains: { flexDirection: 'row', gap: 20, marginTop: 16 },
  offGain: { color: T.good, fontWeight: '800', fontSize: 20 },
  offBonus: { color: T.accent, fontWeight: '800', fontSize: 13, marginTop: 12 },
});
