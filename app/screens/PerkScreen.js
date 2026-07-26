// 혜택 탭 — 호드워식 보상 수령 허브. 기준 docs/HORDWAR_SPEC.md "혜택".
//   골격 = 대형 타이틀 · 출석 그리드 · [수령] 금색 대형 버튼 · 하단 서브탭 가로 스크롤.
//   ⚠️ 서브탭 중 **일일 출석만 실제로 동작한다** — daily.mjs가 코어라 파킹 대상이 아니었다.
//      만 뽑기 혜택(gacha)·레벨 패키지(shop)·친구 연동은 모듈이 파킹돼 잠금(docs/PARKED.md).
//   호드워는 10일차 그리드지만 엘드리아 출석은 **7일 순환**(daily.mjs ATTENDANCE)이라 7칸으로 맞춘다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';
import { ATTENDANCE, canClaimAttendance, claimAttendance } from '../../system/core/daily.mjs';

const SUBS = [
  { key: 'attend', label: '일일 출석', icon: '📅' },
  { key: 'summon', label: '만 뽑기 혜택', icon: '🎴', lock: '소환이 준비 중입니다' },
  { key: 'pack', label: '레벨 패키지', icon: '🎁', lock: '상점이 준비 중입니다' },
  { key: 'friend', label: '친구 연동', icon: '🤝', lock: '친구 연동은 준비 중입니다' },
];

// 보상 한 줄 요약 — { currency, growth, summon } 중 있는 것만.
function rewardText(r, concept) {
  const R = concept.resources;
  return Object.entries(r).map(([k, v]) => `${R[k] ? R[k].emoji : ''}${v}`).join(' ');
}

export default function PerkScreen({ state, bump, concept }) {
  const [sub, setSub] = useState('attend');
  const [msg, setMsg] = useState(null);

  const canClaim = canClaimAttendance(state);
  const streak = (state.daily && state.daily.streak) || 0;
  const todayIdx = streak % ATTENDANCE.length; // 오늘 받을 칸
  const doClaim = () => {
    const r = claimAttendance(state);
    setMsg(r.ok ? `🎁 ${r.day}일차 수령 — ${rewardText(r.reward, concept)}` : `⚠ ${r.reason}`);
    fx(r.ok ? 'success' : 'error');
    bump();
  };

  const cur = SUBS.find((s) => s.key === sub) || SUBS[0];

  return (
    <View style={p.wrap}>
      <ScrollView style={p.flex} contentContainerStyle={p.scroll}>
        {sub === 'attend' ? (<>
          <Text style={p.kicker}>영구 혜택 무료</Text>
          <Text style={p.title}>매일 접속 보상</Text>
          <Text style={p.sub}>{ATTENDANCE.length}일 순환 · 연속 {streak}일째</Text>

          {/* 출석 그리드 — 수령분 ✅(어둡게) · 오늘 금색 테두리 · 마지막 칸은 특별 보상(붉은 카드) */}
          <View style={p.grid}>
            {ATTENDANCE.map((r, i) => {
              const done = i < todayIdx;
              const today = i === todayIdx;
              const special = i === ATTENDANCE.length - 1;
              return (
                <View key={i} style={[p.cell, done && p.cellDone, today && p.cellToday, special && !done && p.cellSpecial]}>
                  {done && <Text style={p.check}>✅</Text>}
                  <Text style={[p.cellRw, done && p.dim]}>{rewardText(r, concept)}</Text>
                  <Text style={[p.cellDay, today && p.cellDayOn]}>{i + 1}일차</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={[p.claim, !canClaim && p.claimOff]} activeOpacity={0.85}
            disabled={!canClaim} onPress={doClaim}
            accessibilityRole="button" accessibilityLabel={canClaim ? '출석 보상 수령' : '오늘은 이미 수령했습니다'}>
            <Text style={[p.claimTx, !canClaim && p.claimTxOff]}>{canClaim ? '수령' : '오늘 수령 완료'}</Text>
          </TouchableOpacity>
          {msg ? <Text style={p.msg}>{msg}</Text> : null}
        </>) : (
          <View style={p.lockPane}>
            <Text style={p.lockIc}>{cur.icon}</Text>
            <Text style={p.lockTitle}>{cur.label}</Text>
            <Text style={p.lockTx}>🔒 {cur.lock}</Text>
          </View>
        )}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* 하단 서브탭 가로 스크롤(호드워: 화면 하단에 붙는다) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={p.subbar} contentContainerStyle={p.subbarIn}>
        {SUBS.map((s) => {
          const on = s.key === sub;
          return (
            <TouchableOpacity key={s.key} style={[p.sub_, on && p.subOn]} activeOpacity={0.85}
              onPress={() => { fx('tap'); setMsg(null); setSub(s.key); }}
              accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={s.lock ? `${s.label} (준비 중)` : s.label}>
              <Text style={p.subIc}>{s.icon}</Text>
              <Text style={[p.subTx, on && p.subTxOn]} numberOfLines={1}>{s.label}</Text>
              {s.lock && <Text style={p.subLock}>🔒</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 14, paddingTop: 14 },

  kicker: { color: T.danger, fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  title: { color: T.accent, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  sub: { color: T.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 },
  cell: { width: '18%', minHeight: 58, borderRadius: 9, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  cellDone: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.08)' },
  cellToday: { borderColor: T.accent, borderWidth: 2, backgroundColor: T.surface2 },
  cellSpecial: { borderColor: T.danger, backgroundColor: 'rgba(255,93,108,0.12)' },
  check: { position: 'absolute', top: 3, right: 4, fontSize: 10 },
  cellRw: { color: T.text, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  dim: { opacity: 0.4 },
  cellDay: { color: T.muted, fontSize: 8, fontWeight: '800', marginTop: 4 },
  cellDayOn: { color: T.accent },

  claim: { marginTop: 16, paddingVertical: 13, borderRadius: 11, backgroundColor: T.accent, alignItems: 'center' },
  claimOff: { backgroundColor: T.surface2 },
  claimTx: { color: '#1a1400', fontSize: 16, fontWeight: '900' },
  claimTxOff: { color: T.muted, fontSize: 13 },
  msg: { color: T.good, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 10 },

  lockPane: { alignItems: 'center', paddingTop: 60 },
  lockIc: { fontSize: 44, opacity: 0.55 },
  lockTitle: { color: T.text, fontSize: 15, fontWeight: '900', marginTop: 10 },
  lockTx: { color: T.muted, fontSize: 11, fontWeight: '700', marginTop: 8 },

  subbar: { flexGrow: 0, backgroundColor: '#141d2e', borderTopWidth: 1, borderTopColor: T.line },
  subbarIn: { gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  sub_: { minWidth: 74, alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10, backgroundColor: T.surface },
  subOn: { backgroundColor: T.surface2, borderWidth: 1, borderColor: T.accent },
  subIc: { fontSize: 16, opacity: 0.8 },
  subTx: { color: T.muted, fontSize: 9, fontWeight: '800', marginTop: 2 },
  subTxOn: { color: T.accent },
  subLock: { position: 'absolute', top: 2, right: 5, fontSize: 8 },
});
