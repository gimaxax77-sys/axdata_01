import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Btn } from '../components';

// 온오프 토글 행
function Toggle({ label, desc, value, onChange }) {
  return (
    <TouchableOpacity style={c.row} activeOpacity={0.8} onPress={() => onChange(!value)}>
      <View style={{ flex: 1 }}>
        <Text style={c.label}>{label}</Text>
        {desc ? <Text style={c.desc}>{desc}</Text> : null}
      </View>
      <View style={[c.track, value && c.trackOn]}>
        <View style={[c.knob, value && c.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

export function SettingsModal({ visible, settings, onChange, onReset, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={c.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={c.sheet}>
          <Text style={c.title}>⚙️ 설정</Text>

          <Toggle label="사운드" desc="효과음 재생" value={!settings.muted} onChange={(v) => onChange('muted', !v)} />
          <Toggle label="햅틱" desc="진동 피드백 (모바일)" value={settings.haptics} onChange={(v) => onChange('haptics', v)} />
          <Toggle label="전투 연출" desc="애니메이션 (끄면 배터리 절약)" value={!settings.reduceMotion} onChange={(v) => onChange('reduceMotion', !v)} />

          <View style={c.divider} />
          <Text style={c.sec}>데이터</Text>
          <Btn label="처음부터 다시 시작 (초기화)" kind="ghost" onPress={onReset} />
          <Text style={c.note}>세이브는 이 기기에만 저장됩니다. 초기화하면 되돌릴 수 없습니다.</Text>

          <Text style={c.ver}>엘드리아 연대기 · v1.0.0</Text>
          <View style={{ height: 6 }} />
          <Btn label="닫기" onPress={onClose} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const c = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 1, borderColor: T.line },
  title: { color: T.text, fontWeight: '900', fontSize: 20, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.line },
  label: { color: T.text, fontWeight: '700', fontSize: 15 },
  desc: { color: T.muted, fontSize: 12, marginTop: 2 },
  track: { width: 46, height: 28, borderRadius: 14, backgroundColor: T.surface2, padding: 3, justifyContent: 'center' },
  trackOn: { backgroundColor: T.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.muted },
  knobOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: T.line, marginVertical: 14 },
  sec: { color: T.text, fontWeight: '800', fontSize: 14, marginBottom: 8 },
  note: { color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 16 },
  ver: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
