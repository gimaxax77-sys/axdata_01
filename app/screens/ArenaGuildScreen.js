import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt, LockedPanel } from '../components';
import { isUnlocked, unlockStage } from '../../system/core/unlocks.mjs';
import { ARENA_ENTRIES, arenaEntriesLeft, arenaFight, arenaTier } from '../../system/core/arena.mjs';
import { GUILD_ATTACKS, guildAttacksLeft, guildAttack, guildBossMaxHp } from '../../system/core/guild.mjs';

export default function ArenaGuildScreen({ state, bump, concept }) {
  const [arenaLog, setArenaLog] = useState(null);
  const [guildLog, setGuildLog] = useState(null);

  const arenaOpen = isUnlocked(state, 'arena');
  const guildOpen = isUnlocked(state, 'guild');

  const doArena = () => {
    const r = arenaFight(state, Math.random);
    if (r.ok) setArenaLog(r);
    bump();
  };
  const doGuild = () => {
    const r = guildAttack(state);
    if (r.ok) setGuildLog(r);
    bump();
  };

  const aLeft = arenaOpen ? arenaEntriesLeft(state) : 0;
  const gLeft = guildOpen ? guildAttacksLeft(state) : 0;
  const bossMax = guildOpen ? guildBossMaxHp(state) : 1;
  const bossHp = guildOpen ? (state.guild.bossHp ?? bossMax) : bossMax;

  return (
    <ScrollView contentContainerStyle={c.wrap}>
      {/* ── 아레나 ───────────────────────────────── */}
      <Card>
        <View style={c.head}>
          <Text style={c.sec}>⚔️ 아레나 <Text style={c.dim}>랭크전</Text></Text>
          {arenaOpen && <Text style={c.tier}>{arenaTier(state.arena.points)} · {state.arena.points}p</Text>}
        </View>
        {!arenaOpen ? (
          <Text style={c.lock}>🔒 스테이지 {unlockStage('arena')} 도달 시 해금</Text>
        ) : (<>
          <Text style={c.sub}>내 파티 전투력으로 상대와 겨뤄 랭크 포인트를 얻습니다. 승리 시 {concept.resources.gem.emoji}다이아 + {concept.resources.currency.emoji}골드.</Text>
          <Text style={c.left}>오늘 입장 {aLeft}/{ARENA_ENTRIES}</Text>
          {arenaLog && (
            <View style={[c.result, { borderColor: arenaLog.win ? T.good : T.danger }]}>
              <Text style={[c.resultTitle, { color: arenaLog.win ? T.good : T.danger }]}>
                {arenaLog.win ? '승리! +25p' : '패배 −12p'}
              </Text>
              <Text style={c.resultSub}>내 {fmt(arenaLog.myPower)} vs 상대 {fmt(arenaLog.oppPower)} · 현재 {arenaLog.points}p ({arenaLog.tier})</Text>
              {arenaLog.win && <Text style={c.resultReward}>보상 {concept.resources.gem.emoji}+{arenaLog.reward.gem} {concept.resources.currency.emoji}+{fmt(arenaLog.reward.currency)}</Text>}
            </View>
          )}
          <View style={{ height: 10 }} />
          <Btn label={aLeft > 0 ? '전투 시작' : '오늘 입장 소진'} kind="gold" disabled={aLeft <= 0} onPress={doArena} />
        </>)}
      </Card>

      {/* ── 길드 보스 ─────────────────────────────── */}
      <Card style={{ marginTop: 12, marginBottom: 24 }}>
        <View style={c.head}>
          <Text style={c.sec}>🛡️ 길드 보스 <Text style={c.dim}>레이드</Text></Text>
          {guildOpen && <Text style={c.tier}>티어 {state.guild.tier} · 🪙{fmt(state.guild.coins)}</Text>}
        </View>
        {!guildOpen ? (
          <Text style={c.lock}>🔒 스테이지 {unlockStage('guild')} 도달 시 해금</Text>
        ) : (<>
          <Text style={c.sub}>매일 파티 딜로 보스를 공격합니다. 처치하면 티어가 오르고 {concept.resources.gem.emoji}다이아 + {concept.resources.summon.emoji}소환권 보너스.</Text>
          <View style={c.bossBar}>
            <View style={[c.bossFill, { width: `${Math.max(0, (bossHp / bossMax) * 100)}%` }]} />
            <Text style={c.bossText}>보스 HP {fmt(bossHp)} / {fmt(bossMax)}</Text>
          </View>
          <Text style={c.left}>오늘 공격 {gLeft}/{GUILD_ATTACKS}</Text>
          {guildLog && (
            <View style={[c.result, { borderColor: guildLog.killed ? T.accent : T.line }]}>
              <Text style={[c.resultTitle, { color: guildLog.killed ? T.accent : T.text }]}>
                {guildLog.killed ? `보스 처치! 티어 ${guildLog.tier}` : `피해 ${fmt(guildLog.dmg)}`}
              </Text>
              <Text style={c.resultSub}>기여 🪙+{guildLog.coin} · {concept.resources.currency.emoji}+{fmt(guildLog.reward.currency)}</Text>
              {guildLog.killed && <Text style={c.resultReward}>처치 보너스 {concept.resources.gem.emoji}+{guildLog.bonus.gem} {concept.resources.summon.emoji}+{guildLog.bonus.summon}</Text>}
            </View>
          )}
          <View style={{ height: 10 }} />
          <Btn label={gLeft > 0 ? '보스 공격' : '오늘 공격 소진'} disabled={gLeft <= 0} onPress={doGuild} />
        </>)}
      </Card>
    </ScrollView>
  );
}

const c = StyleSheet.create({
  wrap: { padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sec: { color: T.text, fontWeight: '800', fontSize: 16 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  tier: { color: T.accent, fontWeight: '800', fontSize: 13 },
  sub: { color: T.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  lock: { color: T.muted, fontSize: 13, paddingVertical: 12 },
  left: { color: T.text, fontSize: 12, fontWeight: '700' },
  result: { marginTop: 12, backgroundColor: T.surface2, borderRadius: 12, padding: 12, borderWidth: 1 },
  resultTitle: { fontWeight: '900', fontSize: 15 },
  resultSub: { color: T.muted, fontSize: 12, marginTop: 4 },
  resultReward: { color: T.good, fontSize: 12, fontWeight: '700', marginTop: 4 },
  bossBar: { height: 26, backgroundColor: T.surface2, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', marginBottom: 8 },
  bossFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: T.danger, opacity: 0.5 },
  bossText: { color: T.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
