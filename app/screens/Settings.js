import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { T } from '../theme';
import { Btn } from '../components';
import { t, LANGS } from '../i18n';

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

// 세이브 문자열을 클립보드에 복사 (expo-clipboard → 웹 navigator 폴백).
async function copyText(str) {
  try { const C = require('expo-clipboard'); await C.setStringAsync(str); return true; } catch { /* noop */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) { await navigator.clipboard.writeText(str); return true; }
  } catch { /* noop */ }
  return false;
}

export function SettingsModal({ visible, settings, onChange, onReset, onClose, onExport, onImport }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const doExport = async () => {
    const c2 = onExport ? onExport() : '';
    const ok = await copyText(c2);
    setMsg(ok ? t('copied') : c2); // 복사 실패 시 코드 자체를 노출
  };
  const doImport = () => {
    if (!onImport) return;
    const ok = onImport(code.trim());
    setMsg(ok ? t('import_ok') : t('import_fail'));
    if (ok) { setCode(''); }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={c.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={c.sheet}>
          <Text style={c.title}>⚙️ {t('settings')}</Text>

          <Toggle label={t('sound')} desc={t('sound_desc')} value={!settings.muted} onChange={(v) => onChange('muted', !v)} />
          <Toggle label={t('haptic')} desc={t('haptic_desc')} value={settings.haptics} onChange={(v) => onChange('haptics', v)} />
          <Toggle label={t('battle_fx')} desc={t('battle_fx_desc')} value={!settings.reduceMotion} onChange={(v) => onChange('reduceMotion', !v)} />

          {/* 언어 */}
          <View style={c.langRow}>
            <Text style={c.label}>{t('language')}</Text>
            <View style={c.langPicker}>
              {LANGS.map((l) => {
                const on = (settings.lang || 'ko') === l.id;
                return (
                  <TouchableOpacity key={l.id} style={[c.langCell, on && c.langCellOn]} activeOpacity={0.8}
                    onPress={() => onChange('lang', l.id)}>
                    <Text style={[c.langText, on && c.langTextOn]}>{l.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 세이브 이관 */}
          <View style={c.divider} />
          <Text style={c.sec}>{t('transfer')}</Text>
          <View style={c.transferRow}>
            <View style={{ flex: 1 }}><Btn small kind="gold" label={t('export_save')} onPress={doExport} /></View>
            <View style={{ flex: 1 }}><Btn small kind="ghost" label={t('import_save')} onPress={doImport} /></View>
          </View>
          <TextInput
            style={c.input}
            value={code}
            onChangeText={setCode}
            placeholder={t('import_placeholder')}
            placeholderTextColor={T.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {msg ? <Text style={c.msg}>{msg}</Text> : null}
          <Text style={c.note}>{t('transfer_note')}</Text>

          {/* 데이터 */}
          <View style={c.divider} />
          <Text style={c.sec}>{t('data')}</Text>
          <Btn label={t('reset')} kind="ghost" onPress={onReset} />
          <Text style={c.note}>{t('reset_note')}</Text>

          <Text style={c.ver}>엘드리아 연대기 · v1.0.0</Text>
          <View style={{ height: 6 }} />
          <Btn label={t('close')} onPress={onClose} />
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
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.line },
  langPicker: { flexDirection: 'row', backgroundColor: T.surface2, borderRadius: 10, padding: 3, gap: 3 },
  langCell: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langCellOn: { backgroundColor: T.primary },
  langText: { color: T.muted, fontWeight: '700', fontSize: 13 },
  langTextOn: { color: '#fff' },
  divider: { height: 1, backgroundColor: T.line, marginVertical: 14 },
  sec: { color: T.text, fontWeight: '800', fontSize: 14, marginBottom: 8 },
  transferRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { backgroundColor: T.surface2, borderRadius: 10, borderWidth: 1, borderColor: T.line, color: T.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  msg: { color: T.accent, fontSize: 12, fontWeight: '700', marginTop: 8 },
  note: { color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 16 },
  ver: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
