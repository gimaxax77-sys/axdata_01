// 준비 중 패널 — 아직 내용이 없는 자리로 **실제로 들어가지게** 해주는 공용 화면 조각.
//   Gim 지시(2026-07-26): "자물쇠 잠겨있는 탭들도 일단은 모두 개방할 것(표시는 해놓고).
//   테스트 및 내부 레이아웃 진행해야 하므로 출시전 정식으로 잠그면 됨."
//   → 누르면 토스트로 막던 것을 전부 이 패널로 바꿨다. 🔒 표시는 남겨 둔다.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';

// icon/title 은 필수, note 는 "여기에 무엇이 들어올지" 한 줄, plan 은 목록.
// onBack 이 있으면 **하단 좌측**에 뒤로가기를 그린다(전체화면으로 쓸 때).
//   Gim 지시(2026-07-29): "모든 컨텐츠 뒤로가기는 하단으로 전부 통일 배치."
//   소환·영웅 상세·전투 화면이 이미 하단 좌측 붉은 ◀ 였고, 이 패널만 좌상단이었다.
// onStep(±1) 이 있으면 좌우 이동 화살표를 그린다(Gim 지시 2026-07-29: "영웅탭처럼").
//   stepInfo 는 `3/9` 같은 위치 표시. 영웅 상세(HeroDetail)와 같은 모양·같은 자리다.
export default function ComingSoon({ icon = '🚧', title, note, plan = [], onBack, onStep, stepInfo }) {
  return (
    <View style={p.wrap}>
      <View style={p.body}>
        <Text style={p.icon}>{icon}</Text>
        <Text style={p.title}>🔒 {title}</Text>
        <Text style={p.note}>{note || '준비 중입니다. 지금은 자리만 잡아 둔 상태예요.'}</Text>
        {plan.length > 0 && (
          <View style={p.card}>
            <Text style={p.cardHead}>들어올 내용</Text>
            {plan.map((line) => <Text key={line} style={p.line}>· {line}</Text>)}
          </View>
        )}
      </View>
      {/* 좌우 이동 — 뒤로 나갔다 다시 들어오지 않고 같은 탭의 옆 콘텐츠로 넘긴다. 순환식. */}
      {onStep && (<>
        <TouchableOpacity style={[p.nav, p.navL]} activeOpacity={0.7}
          onPress={() => { fx('tap'); onStep(-1); }}
          accessibilityRole="button" accessibilityLabel="이전 콘텐츠">
          <Text style={p.navTx}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[p.nav, p.navR]} activeOpacity={0.7}
          onPress={() => { fx('tap'); onStep(1); }}
          accessibilityRole="button" accessibilityLabel="다음 콘텐츠">
          <Text style={p.navTx}>›</Text>
        </TouchableOpacity>
        {stepInfo ? <Text style={p.navInfo}>{stepInfo}</Text> : null}
      </>)}

      {onBack && (
        <View style={p.footer}>
          <TouchableOpacity style={p.back} activeOpacity={0.85} onPress={() => { fx('tap'); onBack(); }}
            accessibilityRole="button" accessibilityLabel="뒤로">
            <Text style={p.backTx}>◀</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const p = StyleSheet.create({
  wrap: { flex: 1 },
  // 하단 좌측 붉은 ◀ — SummonScreen·BattleScreen 과 같은 모양으로 맞췄다(호드워 최하단 좌측).
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  back: { width: 38, height: 30, borderRadius: 8, backgroundColor: '#7a2f22', borderWidth: 2, borderColor: '#b8543c', alignItems: 'center', justifyContent: 'center' },
  backTx: { color: '#ffd9c8', fontSize: 13, fontWeight: '900' },
  // 좌우 이동 화살표 — HeroDetail 과 같은 모양·같은 높이로 맞췄다.
  nav: { position: 'absolute', top: '46%', width: 38, height: 46, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  navL: { left: 4 },
  navR: { right: 4 },
  navTx: { color: T.accent, fontSize: 40, fontWeight: '900', lineHeight: 44, textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 4 },
  navInfo: { position: 'absolute', top: '58%', alignSelf: 'center', color: '#e6d3ae', fontSize: 9, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden', zIndex: 6 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  icon: { fontSize: 42, opacity: 0.6 },
  title: { color: T.text, fontSize: 15, fontWeight: '900', marginTop: 10 },
  note: { color: T.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  card: { marginTop: 16, alignSelf: 'stretch', backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, borderRadius: 11, padding: 12 },
  cardHead: { color: T.accent, fontSize: 11, fontWeight: '900', marginBottom: 6 },
  line: { color: T.muted, fontSize: 11, lineHeight: 18 },
});
