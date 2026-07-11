import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { T } from '../theme';
import { Btn } from '../components';
import { ROLE_LABEL } from '../../system/core/roles.mjs';
import { buildNoticeConfig, buildEventConfig, consoleCapabilities, NOTICE_MAX } from '../../system/core/console.mjs';

// 운영자 콘솔 — 매니저/운영자가 공지·이벤트를 발송(원격 설정에 기록).
//   기록되면 모든 플레이어가 기존 공지 배너로 자동 표시한다.
export function ConsoleModal({ visible, onClose, role, remote, onSet, onClear }) {
  const cap = consoleCapabilities(role);
  const [notice, setNotice] = useState('');
  const [event, setEvent] = useState('');
  const [msg, setMsg] = useState(null);

  const curNotice = remote && remote.notice ? remote.notice.text : null;
  const curEvent = remote && remote.event ? remote.event.text : null;

  const flash = (r, okText) => setMsg(r && r.ok ? { ok: true, t: okText } : { ok: false, t: (r && r.reason) || '실패' });

  const postNotice = async () => {
    const b = buildNoticeConfig(notice);
    if (!b.ok) { setMsg({ ok: false, t: b.reason }); return; }
    flash(await onSet(b.key, b.value), '공지를 발송했습니다'); setNotice('');
  };
  const postEvent = async () => {
    const b = buildEventConfig(event);
    if (!b.ok) { setMsg({ ok: false, t: b.reason }); return; }
    flash(await onSet(b.key, b.value), '이벤트를 발송했습니다'); setEvent('');
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={c.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={c.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={c.titleRow}>
              <Text style={c.title}>🛠 운영자 콘솔</Text>
              <Text style={[c.badge, role === 'admin' && c.badgeAdmin]}>{ROLE_LABEL[role] || '일반'}</Text>
            </View>
            <Text style={c.lead}>공지·이벤트를 발송하면 모든 플레이어의 화면 상단 배너에 표시됩니다.</Text>

            {/* 공지 */}
            {cap.notice && (<>
              <View style={c.divider} />
              <Text style={c.sec}>📢 공지</Text>
              <Text style={c.cur}>{curNotice ? `현재: ${curNotice}` : '현재 게시된 공지 없음'}</Text>
              <TextInput style={c.input} value={notice} onChangeText={setNotice} multiline
                placeholder={`공지 내용 (최대 ${NOTICE_MAX}자)`} placeholderTextColor={T.muted} />
              <View style={c.row}>
                <View style={{ flex: 1 }}><Btn small kind="gold" label="공지 발송" onPress={postNotice} /></View>
                {curNotice && <View style={{ flex: 1 }}><Btn small kind="ghost" label="내리기" onPress={async () => flash(await onClear('notice'), '공지를 내렸습니다')} /></View>}
              </View>
            </>)}

            {/* 이벤트 */}
            {cap.event && (<>
              <View style={c.divider} />
              <Text style={c.sec}>🎉 이벤트 배너</Text>
              <Text style={c.cur}>{curEvent ? `현재: ${curEvent}` : '현재 게시된 이벤트 없음'}</Text>
              <TextInput style={c.input} value={event} onChangeText={setEvent} multiline
                placeholder={`이벤트 문구 (최대 ${NOTICE_MAX}자)`} placeholderTextColor={T.muted} />
              <View style={c.row}>
                <View style={{ flex: 1 }}><Btn small kind="gold" label="이벤트 발송" onPress={postEvent} /></View>
                {curEvent && <View style={{ flex: 1 }}><Btn small kind="ghost" label="내리기" onPress={async () => flash(await onClear('event'), '이벤트를 내렸습니다')} /></View>}
              </View>
            </>)}

            {msg ? <Text style={[c.msg, !msg.ok && c.err]}>{msg.ok ? '✓ ' : '⚠ '}{msg.t}</Text> : null}

            <Text style={c.note}>발송 즉시 서버(remote_config)에 기록되고, 다른 플레이어는 다음 실행(또는 동기화) 시 배너로 봅니다. 매니저는 공지·이벤트만, 밸런스 조정은 운영자 조작 화면에서 합니다.</Text>

            <View style={{ height: 10 }} />
            <Btn label="닫기" onPress={onClose} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const c = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 1, borderColor: T.line, maxHeight: '86%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { color: T.text, fontWeight: '900', fontSize: 20 },
  badge: { color: '#7fd3ff', backgroundColor: 'rgba(127,211,255,0.15)', fontWeight: '800', fontSize: 11, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  badgeAdmin: { color: '#ffd257', backgroundColor: 'rgba(255,210,87,0.15)' },
  lead: { color: T.muted, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  divider: { height: 1, backgroundColor: T.line, marginVertical: 14 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 6 },
  cur: { color: T.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: T.surface2, borderRadius: 10, borderWidth: 1, borderColor: T.line, color: T.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, minHeight: 44, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  msg: { color: T.accent, fontSize: 13, fontWeight: '800', marginTop: 12 },
  err: { color: '#ff8a8a' },
  note: { color: T.muted, fontSize: 11, marginTop: 12, lineHeight: 16 },
});
