// 세이브 저장소 어댑터. 웹은 localStorage, 없으면 무동작(메모리).
// (RN/Expo Go 영구저장은 추후 AsyncStorage로 확장 가능.)
const KEY = 'eldria_save_v2';

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
