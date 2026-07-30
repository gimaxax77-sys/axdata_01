// 세븐식 탭 공통 골격 — 상단 전투력·재화 바 + 콘텐츠 + 하단 서브탭 줄.
//   근거: 구글플레이 실물 캡처(캐릭터 탭·코스튬 화면)에서 두 화면 모두 이 골격을 쓰는 것을 확인.
//   세븐은 재화를 상단이 아니라 '전투력 바'에 함께 둔다(전투력 152K | 💎100000 | 🪙997K).
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fmt } from '../components';
import { fx } from '../feedback';

// subs: [{ key, label, dot? }] · active: key · onSub(key)
export default function TabShell({ concept, wallet, power, subs, active, onSub, children }) {
  const R = concept.resources;
  return (
    <View style={st.wrap}>
      {/* 세븐식 전투력 바 — 전투력 + 주요 재화 2종 */}
      <View style={st.powerBar}>
        <Text style={st.powerLb}>전투력</Text>
        <Text style={st.powerVal}>{fmt(power)}</Text>
        <View style={{ flex: 1 }} />
        <Text style={st.curIc}>{R.gem.emoji}</Text><Text style={st.curVal}>{fmt(wallet.gem || 0)}</Text>
        <Text style={st.curIc}>{R.currency.emoji}</Text><Text style={st.curVal}>{fmt(wallet.currency || 0)}</Text>
      </View>

      <View style={st.body}>{children}</View>

      {/* 세븐식 서브탭 줄 — 알약형, 선택된 것만 밝게(실물: 영웅 관리·편성·펫·도감) */}
      {subs && subs.length > 1 && (
        <View style={st.subbar}>
          {subs.map((s) => {
            const on = s.key === active;
            return (
              <TouchableOpacity key={s.key} style={[st.sub, on && st.subOn]} activeOpacity={0.85}
                onPress={() => { fx('tap'); onSub(s.key); }}
                accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={s.label}>
                <Text style={[st.subTx, on && st.subTxOn]} numberOfLines={1}>{s.label}</Text>
                {s.dot && <View style={st.subDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  powerBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#141d2e', borderBottomWidth: 1, borderBottomColor: T.line },
  powerLb: { color: T.muted, fontSize: 10, fontWeight: '800' },
  powerVal: { color: T.accent, fontSize: 13, fontWeight: '900' },
  curIc: { fontSize: 12, marginLeft: 6 },
  curVal: { color: T.text, fontSize: 11, fontWeight: '800' },
  body: { flex: 1 },
  subbar: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#141d2e', borderTopWidth: 1, borderTopColor: T.line },
  sub: { flex: 1, borderRadius: 14, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  subOn: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.accent },
  subTx: { color: T.muted, fontSize: 10, fontWeight: '800' },
  subTxOn: { color: T.accent },
  subDot: { position: 'absolute', top: 2, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: T.danger },
});
