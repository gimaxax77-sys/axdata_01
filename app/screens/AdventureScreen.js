// 모험 탭 — 스토리 캠페인(챕터 보스전 + 정주행 로그).
//   호드워의 '모험' = 주 진행 축. 하단 메뉴바에서 혼자 넓은 주버튼으로 들어온다.
//   코어 모듈(campaign.mjs)만 쓴다 — 선택 모듈은 파킹(docs/PARKED.md).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Card, pctW } from '../components';
import { fx } from '../feedback';
import { campaignChapters, fightChapter, storyLog, CAMPAIGN_CHAPTER_COUNT } from '../../system/core/campaign.mjs';

export default function AdventureScreen({ state, bump, concept }) {
  const [result, setResult] = useState(null);
  const [openStory, setOpenStory] = useState(null); // 펼친 챕터 index

  const chapters = campaignChapters(state, concept.campaign || []);
  const cleared = (state.campaign && state.campaign.cleared) || 0;
  const next = chapters.find((c) => c.isNext) || null;
  const log = storyLog(state, concept.campaign || []);
  const progPct = pctW((cleared / CAMPAIGN_CHAPTER_COUNT) * 100);

  const doFight = () => {
    if (!next) return;
    const r = fightChapter(state, next.index);
    if (!r.ok) setResult(`⚠ ${r.reason}`);
    else if (r.win) setResult(`🏆 VICTORY — ${next.title} 클리어!${r.reward ? ` 💎+${r.reward.gem} 🔮+${r.reward.summon}` : ''}`);
    else setResult('💀 DEFEAT — 영웅을 더 키운 뒤 다시 도전하세요');
    fx(r.ok && r.win ? 'success' : 'error');
    bump();
  };

  return (
    <View style={a.wrap}>
      {/* 진행 헤더 — 호드워 상단 VS 바 자리(모험은 진행도 바) */}
      <View style={a.head}>
        <Text style={a.headTx}>모험 {cleared}/{CAMPAIGN_CHAPTER_COUNT} 챕터</Text>
        <View style={a.prog}>
          <View style={[a.progFill, { width: `${progPct}%` }]} />
        </View>
      </View>

      <ScrollView style={a.flex} contentContainerStyle={a.scroll}>
        {/* 다음 챕터 — 주 진행 카드(호드워: BOSS COMING 배너 톤) */}
        {next ? (
          <Card style={a.nextCard}>
            <Text style={a.bossBanner}>☠️ BOSS COMING</Text>
            <Text style={a.nextTitle}>챕터 {next.index + 1} · {next.title}</Text>
            <Text style={a.nextStory}>{next.story}</Text>
            <Text style={a.nextMeta}>권장 {next.bossStage}층 · 보상 💎{next.reward.gem} 🔮{next.reward.summon}</Text>
            <TouchableOpacity style={a.fightBtn} activeOpacity={0.85} onPress={doFight}
              accessibilityRole="button" accessibilityLabel="챕터 보스 도전">
              <Text style={a.fightTx}>도전</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={a.nextCard}>
            <Text style={a.nextTitle}>🏅 모든 챕터 클리어</Text>
            <Text style={a.nextStory}>엘드리아에 새벽이 왔습니다.</Text>
          </Card>
        )}
        {result ? <Text style={a.result}>{result}</Text> : null}

        {/* 챕터 목록 — 클리어분은 스토리를 다시 펼쳐 읽는다(정주행). */}
        <Text style={a.sec}>📖 연대기 <Text style={a.dim}>{log.readable.length}/{log.total} 열람 가능</Text></Text>
        {chapters.map((c) => {
          const open = openStory === c.index;
          return (
            <TouchableOpacity key={c.index} activeOpacity={0.85}
              disabled={!c.cleared}
              onPress={() => { fx('tap'); setOpenStory(open ? null : c.index); }}
              style={[a.row, c.cleared && a.rowDone, c.isNext && a.rowNext]}
              accessibilityRole="button"
              accessibilityLabel={c.cleared ? `챕터 ${c.index + 1} ${c.title} 열람` : `챕터 ${c.index + 1} 잠김`}>
              <Text style={a.rowIc}>{c.cleared ? '✅' : c.isNext ? '⚔️' : '🔒'}</Text>
              <View style={a.flex}>
                <Text style={[a.rowTitle, !c.unlocked && a.rowLocked]} numberOfLines={1}>
                  {c.index + 1}. {c.cleared || c.isNext ? c.title : '???'}
                </Text>
                {open && <Text style={a.rowStory}>{c.story}</Text>}
              </View>
              <Text style={a.rowStage}>{c.bossStage}층</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

const a = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 10, paddingTop: 6 },
  dim: { color: T.muted, fontSize: 10, fontWeight: '700' },

  head: { paddingHorizontal: 10, paddingTop: 6 },
  headTx: { color: T.accent, fontSize: 11, fontWeight: '900' },
  prog: { height: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', marginTop: 3 },
  progFill: { height: 8, backgroundColor: T.accent, borderRadius: 4 },

  nextCard: { borderColor: T.accent },
  bossBanner: { color: T.danger, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  nextTitle: { color: T.text, fontSize: 15, fontWeight: '900', marginTop: 3 },
  nextStory: { color: T.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  nextMeta: { color: T.accent, fontSize: 10, fontWeight: '800', marginTop: 6 },
  fightBtn: { marginTop: 9, paddingVertical: 11, borderRadius: 10, backgroundColor: T.accent, alignItems: 'center' },
  fightTx: { color: '#1a1400', fontSize: 15, fontWeight: '900' },
  result: { color: T.text, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 8 },

  sec: { color: T.text, fontSize: 12, fontWeight: '900', marginTop: 12, marginBottom: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 10, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, marginBottom: 4 },
  rowDone: { borderColor: 'rgba(79,217,138,0.5)' },
  rowNext: { borderColor: T.accent, backgroundColor: T.surface2 },
  rowIc: { fontSize: 14 },
  rowTitle: { color: T.text, fontSize: 11, fontWeight: '800' },
  rowLocked: { color: T.muted },
  rowStory: { color: T.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  rowStage: { color: T.muted, fontSize: 9, fontWeight: '800' },
});
