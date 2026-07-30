// [파킹] 영웅 바텀시트 — App.js에서 떼어낸 미배선 컴포넌트. docs/PARKED.md 참고.
//   되살리는 법: App.js로 되돌려 붙이고 RosterSheet로 파킹 화면을 감싼다.
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { T } from '../theme';

// 영웅 바텀시트 — 상단 자동전투는 그대로 두고(방치 화면 베이스) 하단에서 시트가 올라온다.
// 강화하는 동안 위 전투가 실시간으로 강해지는 걸 눈으로 확인(레이어 구조).
const IS_WEB = Platform.OS === 'web';
function RosterSheet({ children, onClose, reduce }) {
  // 웹: CSS transition 으로 슬라이드를 컴포지터(GPU) 스레드에 넘긴다.
  //   → JS 스레드가 아무리 바빠도(내용 마운트·틱 리렌더) 슬라이드는 매끄럽다.
  //   내용을 즉시 마운트해도 CSS 전환이 별도 스레드에서 돌아 버벅이지 않는다.
  // 네이티브: useNativeDriver Animated + 슬라이드 후 지연 마운트(완료 콜백).
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const [open, setOpen] = useState(!!reduce);      // 웹 CSS 전환 트리거
  const [ready, setReady] = useState(IS_WEB || !!reduce); // 웹은 즉시 마운트
  useEffect(() => {
    if (reduce) { a.setValue(1); setOpen(true); setReady(true); return; }
    if (IS_WEB) {
      const r = requestAnimationFrame(() => setOpen(true)); // off→on 프레임 분리로 전환 발동
      return () => cancelAnimationFrame(r);
    }
    a.setValue(0);
    let alive = true;
    Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true })
      .start(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const webStyle = {
    opacity: open ? 1 : 0,
    transform: [{ translateY: open ? 0 : 520 }],
    transitionProperty: 'transform, opacity',
    transitionDuration: '320ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  };
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const nativeStyle = { opacity: a, transform: [{ translateY }] };
  const Sheet = IS_WEB ? View : Animated.View;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 위 전투가 비치도록 옅은 스크림 — 탭하면 닫힘(방치로 복귀). */}
      <TouchableOpacity style={sh.scrim} activeOpacity={1} onPress={onClose}
        accessibilityRole="button" accessibilityLabel="강화 시트 닫기" />
      <Sheet style={[sh.sheet, IS_WEB ? webStyle : nativeStyle]}>
        <View style={sh.grip} />
        <TouchableOpacity style={sh.x} onPress={onClose} activeOpacity={0.7}
          accessibilityRole="button" accessibilityLabel="닫기">
          <Text style={sh.xTxt}>✕</Text>
        </TouchableOpacity>
        <View style={sh.body}>{ready ? children : <View style={sh.loading}><Text style={sh.loadingTxt}>불러오는 중…</Text></View>}</View>
      </Sheet>
    </View>
  );
}
const sh = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,8,26,0.28)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%',
    backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0, borderColor: T.line, overflow: 'hidden' },
  grip: { width: 40, height: 4, borderRadius: 3, backgroundColor: T.line, alignSelf: 'center', marginTop: 8, marginBottom: 2 },
  x: { position: 'absolute', top: 8, right: 12, width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  xTxt: { color: T.muted, fontSize: 14, fontWeight: '900' },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: T.muted, fontSize: 13, fontWeight: '700' },
});
export default RosterSheet;
