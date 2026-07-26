// 편성 모달 — 호드워 '편성' 오버레이. 기준 docs/HORDWAR_SPEC.md "영웅 탭 · 편성".
//   골격 = 제목 배너 · 파티 프리셋 카드 세로 목록(슬롯 격자 + 마수 패널 + [파티 편집] 금색).
//   엘드리아 대응
//     · 슬롯 — 호드워는 5칸(2+3). 엘드리아 진형은 전열2·중열3·후열2 = 7칸이라 **2/3/2 세 줄**로 확장했다.
//     · 마수 — 펫·가디언이 파킹 상태라 자물쇠 원형 3칸으로만 둔다(docs/PARKED.md).
//     · 5인/3인 파티 탭 — 엘드리아엔 파티 인원 모드가 없어 넣지 않았다.
import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { identity } from '../../system/concepts/index.mjs';
import { formationSummary, ROLE_CAP, ROLE_LABEL } from '../../system/core/formation.mjs';
import { savePreset, loadPreset, presetInfo, PRESET_SLOTS } from '../../system/core/partyPresets.mjs';

const ROWS = ['front', 'mid', 'back']; // 위→아래. 호드워의 2+3 배치를 2/3/2로 확장.

// 프리셋 한 장의 슬롯 격자. 현재 편성(active)일 때만 실제 영웅을 그리고, 나머지는 인원수만 안다.
function SlotGrid({ state, concept, active }) {
  const sum = active ? formationSummary(state) : null;
  return (
    <View style={m.grid}>
      {ROWS.map((role) => (
        <View key={role} style={m.row}>
          {Array.from({ length: ROLE_CAP[role] }).map((_, i) => {
            const uid = sum && sum[role][i];
            const u = uid && state.units.find((x) => x.uid === uid);
            return (
              <View key={role + i} style={[m.slot, u && m.slotOn]}>
                {u ? (
                  <Portrait emoji={identity(concept, u).emoji}
                    image={charImage(concept.id, u.characterId)} rarity={u.rarity} size={34} />
                ) : <Text style={m.plus}>＋</Text>}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function FormationModal({ visible, state, bump, concept, onClose, onMsg }) {
  if (!visible) return null;
  const cur = state.party.length;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose}
        accessibilityRole="button" accessibilityLabel="편성 닫기">
        <TouchableOpacity activeOpacity={1} style={m.sheet}>
          <View style={m.titleBar}><Text style={m.title}>편성</Text></View>

          <ScrollView style={m.flex} contentContainerStyle={m.scroll}>
            {Array.from({ length: PRESET_SLOTS }, (_, i) => i + 1).map((slot) => {
              const info = presetInfo(state, slot);
              // 1번 칸을 '현재 편성'으로 쓴다 — 엘드리아는 활성 파티가 하나뿐이라
              // 프리셋 목록만 있으면 지금 무엇이 편성됐는지 볼 수가 없다.
              const active = slot === 1;
              return (
                <View key={slot} style={m.card}>
                  <View style={m.cardHead}>
                    <Text style={m.cardTitle}>
                      {active ? `현재 편성 (${cur}/7)` : `파티 프리셋${slot}`}
                      {!active && info.exists ? <Text style={m.cardSub}>  {info.count}명 저장됨</Text> : null}
                    </Text>
                    <Text style={m.cardGo}>›</Text>
                  </View>

                  <View style={m.body}>
                    <SlotGrid state={state} concept={concept} active={active} />
                    {/* 마수 — 펫·가디언 파킹으로 잠금 3칸(호드워: 삼각 배치) */}
                    <View style={m.beastPane}>
                      <Text style={m.beastTitle}>마수</Text>
                      <View style={m.beastTop}><View style={m.beast}><Text style={m.beastLock}>🔒</Text></View></View>
                      <View style={m.beastRow}>
                        <View style={m.beast}><Text style={m.beastLock}>🔒</Text></View>
                        <View style={m.beast}><Text style={m.beastLock}>🔒</Text></View>
                      </View>
                    </View>
                  </View>

                  {active ? (
                    <Text style={m.activeHint}>{ROWS.map((r) => `${ROLE_LABEL[r]} ${formationSummary(state)[r].length}/${ROLE_CAP[r]}`).join(' · ')}</Text>
                  ) : (
                    <TouchableOpacity style={m.edit} activeOpacity={0.85}
                      onPress={() => {
                        const r = loadPreset(state, slot);
                        onMsg?.(r.ok ? `📥 프리셋${slot} 적용 · ${r.applied}명` : `⚠ ${r.reason}`);
                        fx(r.ok ? 'success' : 'error'); bump();
                      }}
                      onLongPress={() => {
                        const r = savePreset(state, slot);
                        onMsg?.(r.ok ? `💾 프리셋${slot}에 저장 (${r.count}명)` : `⚠ ${r.reason}`);
                        fx(r.ok ? 'success' : 'error'); bump();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`프리셋 ${slot} 적용. 길게 누르면 현재 편성 저장`}>
                      <Text style={m.editTx}>파티 편집</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <Text style={m.hint}>프리셋 탭 = 적용 · 길게 = 현재 편성 저장</Text>
            <View style={{ height: 6 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  sheet: { width: '100%', maxWidth: 360, maxHeight: '86%', borderRadius: 14, backgroundColor: '#3b2d1d', borderWidth: 2, borderColor: '#6b543a', overflow: 'hidden' },
  titleBar: { alignItems: 'center', paddingVertical: 9, backgroundColor: '#2b2013', borderBottomWidth: 1, borderBottomColor: '#6b543a' },
  title: { color: '#f0e0c0', fontSize: 15, fontWeight: '900' },
  flex: { flex: 1 },
  scroll: { padding: 9 },

  card: { backgroundColor: '#e8d5ae', borderRadius: 9, borderWidth: 1, borderColor: '#8a6d47', padding: 9, marginBottom: 9 },
  cardHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d3bd93', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  cardTitle: { flex: 1, color: '#402d16', fontSize: 11, fontWeight: '900' },
  cardSub: { color: '#7a6238', fontSize: 9, fontWeight: '700' },
  cardGo: { color: '#8a6d47', fontSize: 14, fontWeight: '900' },

  body: { flexDirection: 'row', gap: 8, marginTop: 8 },
  grid: { flex: 1, gap: 5 },
  row: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  slot: { width: 42, height: 42, borderRadius: 7, backgroundColor: '#9b9b9b', borderWidth: 1, borderColor: '#7d7d7d', alignItems: 'center', justifyContent: 'center' },
  slotOn: { backgroundColor: '#c9b48c', borderColor: T.accent },
  plus: { color: '#5cd65c', fontSize: 20, fontWeight: '900' },

  beastPane: { width: 104, borderRadius: 7, backgroundColor: '#cbb491', borderWidth: 1, borderColor: '#a68a5f', paddingBottom: 7 },
  beastTitle: { color: '#402d16', fontSize: 10, fontWeight: '900', textAlign: 'center', paddingVertical: 3, backgroundColor: '#b79b70' },
  beastTop: { alignItems: 'center', marginTop: 6 },
  beastRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 5 },
  beast: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#5a4a33', borderWidth: 2, borderColor: '#8a6d47', alignItems: 'center', justifyContent: 'center' },
  beastLock: { fontSize: 13 },

  edit: { alignSelf: 'center', marginTop: 9, paddingHorizontal: 26, paddingVertical: 7, borderRadius: 7, backgroundColor: T.accent, borderWidth: 1, borderColor: '#8a6d47' },
  editTx: { color: '#3d2a00', fontSize: 12, fontWeight: '900' },
  activeHint: { color: '#5c4526', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 9 },
  hint: { color: '#b09a76', fontSize: 9, fontWeight: '700', textAlign: 'center' },
});
