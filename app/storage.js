// 세이브 저장소 어댑터. 웹은 localStorage, 없으면 무동작(메모리).
// (RN/Expo Go 영구저장은 추후 AsyncStorage로 확장 가능.)
// 컨셉별로 세이브를 분리 — 판타지는 기존 키 유지(하위호환), SF는 별도 키.
const _cid = (typeof globalThis !== 'undefined' && globalThis.__ELDRIA_CONCEPT__) || 'fantasy';
const KEY = _cid === 'fantasy' ? 'eldria_save_v2' : `eldria_save_v2_${_cid}`;

function ls() {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

export function loadRaw() {
  try { return ls()?.getItem(KEY) ?? null; } catch { return null; }
}
export function saveRaw(str) {
  try { ls()?.setItem(KEY, str); } catch { /* 무시 */ }
}
export function clearSave() {
  try { ls()?.removeItem(KEY); } catch { /* 무시 */ }
}
