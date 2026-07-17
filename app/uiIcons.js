// UI 아이콘 레지스트리 — 상단 자원바 등에서 이모지 대신 KayKit 3D 렌더 아이콘 사용.
//   규격: 128×128 투명 PNG. 위치: assets/ui/<key>.png
//   미등록 키는 null → 호출부가 이모지로 폴백.

const RES_ICONS = {
  currency: require('../assets/ui/currency.png'),
  growth: require('../assets/ui/growth.png'),
  summon: require('../assets/ui/summon.png'),
  gem: require('../assets/ui/gem.png'),
};

// 자원 키 → 아이콘 소스 또는 null(이모지 폴백).
export function resIcon(key) {
  return (key && RES_ICONS[key]) || null;
}
