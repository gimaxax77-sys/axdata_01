// 영웅 상세 · 초월 탭 — 호드워 `승성` 패널. 기준: Gim 실기 캡처(2026-07-27).
//   골격 = 성급 진행 바(★ ▶▶▶ ★★) · 효과 2줄(우측 초록 수치) · 재료 카드 2장(보유/필요) · [초월] 금색 + 안내.
//   엘드리아 대응 / 의도적 차이
//     · 호드워 `승성` = 엘드리아 **돌파(ascend)**. 랭크를 올려 레벨 상한과 스킬 슬롯을 연다.
//       (2026-07-27 Gim 지시로 속성 탭의 `돌파` 버튼을 없앴고, 그 기능이 이 탭으로 옮겨왔다.)
//     · 재료 — 호드워는 영웅 조각 2종. 엘드리아는 **소환석**과 **동일 영웅 중복**이라 그 둘을 카드로 놓는다.
//     · `부활 시 모든 육성 재료 복구` → 엘드리아는 해체(dismantle)가 투자 자원을 전액 반환한다.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { identity } from '../../system/concepts/index.mjs';
import { ascend, ascendCost } from '../../system/core/character.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { availableDupes } from '../../system/core/starGrade.mjs';
import { rankLevelCap } from '../../system/core/units.mjs';
import { skillSlots } from '../../system/core/skills.mjs';
import { BALANCE } from '../../system/core/balance.mjs';

// 재료 한 칸 — 초상(또는 실루엣) + 보유/필요.
function Mat({ label, have, need, emoji, image, rarity, dim }) {
  const enough = have >= need;
  return (
    <View style={a.mat}>
      <View style={[a.matCard, dim && a.matDim]}>
        <Portrait emoji={emoji} image={image} rarity={rarity} size={40} dim={dim} />
        <View style={a.matPlus}><Text style={a.matPlusTx}>＋</Text></View>
      </View>
      <Text style={[a.matCount, enough ? a.matOk : a.matNo]}>({fmt(have)}/{fmt(need)})</Text>
      <Text style={a.matLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function HeroAscendPanel({ state, bump, concept, unit, onMsg }) {
  const id = identity(concept, unit);
  const rank = unit.rank || 1;
  const cost = ascendCost(unit);
  const dupes = availableDupes(state, unit).length;
  const haveSummon = state.wallet.summon || 0;

  // 다음 랭크가 여는 것 — 레벨 상한과 스킬 슬롯.
  const nextCap = rankLevelCap(rank + 1);
  const nextSlots = skillSlots({ ...unit, rank: rank + 1 });
  const statPct = Math.round(BALANCE.statPerRank * 100);

  const doAscend = () => {
    const r = ascend(state, unit.uid);
    if (r.ok) recordMission(state, 'upgrade', 1);
    onMsg?.(r.ok ? `⭐ 초월 성공 — 랭크 ${r.rank}` : `⚠ ${r.reason}`);
    fx(r.ok ? 'success' : 'error');
    bump();
  };

  return (
    <View style={a.wrap}>
      {/* 성급 진행 바 — 현재 랭크 ▶▶▶ 다음 랭크 */}
      <View style={a.track}>
        <Text style={a.star}>{'★'.repeat(Math.min(rank, 5))}</Text>
        <Text style={a.arrow}>▶▶▶</Text>
        <Text style={a.star}>{'★'.repeat(Math.min(rank + 1, 6))}</Text>
      </View>

      {/* 효과 2줄 — 좌측 항목 / 우측 초록 수치 */}
      <View style={a.row}>
        <Text style={a.rowIc}>🛡️</Text>
        <Text style={a.rowKey}>공격/방어/HP</Text>
        <Text style={a.rowVal}>+{statPct}%</Text>
      </View>
      <View style={a.row}>
        <Text style={a.rowIc}>🅖</Text>
        <Text style={a.rowKey}>레벨 상한 · 스킬 슬롯</Text>
        <Text style={a.rowVal}>{nextCap}레벨 · {nextSlots}칸</Text>
      </View>

      {/* 재료 2장 + 초월 버튼 */}
      <View style={a.bottom}>
        <Mat label={concept.resources.summon.name} have={haveSummon} need={cost.summon}
          emoji={concept.resources.summon.emoji} rarity={unit.rarity} />
        <Mat label="동일 영웅" have={dupes} need={1} dim={dupes === 0}
          emoji={id.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} />
        <View style={a.btnCol}>
          <TouchableOpacity style={a.btn} activeOpacity={0.85} onPress={doAscend}
            accessibilityRole="button" accessibilityLabel={`초월 — 랭크 ${rank}에서 ${rank + 1}로`}>
            <Text style={a.btnTx}>초월</Text>
          </TouchableOpacity>
          <Text style={a.btnNote}>해체 시 투자 자원 전액 반환</Text>
        </View>
      </View>
    </View>
  );
}

const a = StyleSheet.create({
  wrap: { padding: 10 },

  track: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#d3bd93', borderRadius: 7, paddingVertical: 4, paddingHorizontal: 10 },
  star: { color: T.accent, fontSize: 13, fontWeight: '900', textShadowColor: '#6b4a12', textShadowRadius: 1 },
  arrow: { color: '#3f9b4a', fontSize: 13, fontWeight: '900', letterSpacing: -1 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  rowIc: { fontSize: 13 },
  rowKey: { flex: 1, color: '#3b2a12', fontSize: 11, fontWeight: '900' },
  rowVal: { color: '#2f6b30', fontSize: 12, fontWeight: '900' },

  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  mat: { alignItems: 'center', width: 56 },
  matCard: { width: 48, height: 52, borderRadius: 7, borderWidth: 2, borderColor: '#e08a3a', backgroundColor: '#c07a34', alignItems: 'center', justifyContent: 'center' },
  matDim: { borderColor: '#8f8f8f', backgroundColor: '#8a8a8a' },
  matPlus: { position: 'absolute', right: -2, bottom: -2, width: 15, height: 15, borderRadius: 4, backgroundColor: '#e8d5ae', borderWidth: 1, borderColor: '#8a6d47', alignItems: 'center', justifyContent: 'center' },
  matPlusTx: { color: '#3b2a12', fontSize: 9, fontWeight: '900' },
  matCount: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  matOk: { color: '#2f6b30' },
  matNo: { color: '#a83a2a' },
  matLabel: { color: '#7a6238', fontSize: 8, fontWeight: '800' },

  btnCol: { flex: 1, alignItems: 'center' },
  btn: { alignSelf: 'stretch', paddingVertical: 9, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f', alignItems: 'center' },
  btnTx: { color: '#3d2a00', fontSize: 15, fontWeight: '900' },
  btnNote: { color: '#7a6238', fontSize: 8, fontWeight: '800', marginTop: 3, textAlign: 'center' },
});
