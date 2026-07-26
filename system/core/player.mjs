// 플레이어 레벨·칭호 — 진행도에서 파생한다(세이브 필드 신설 없음 = 마이그레이션 불필요).
//   세븐 상단 아바타("Lv 51 기사단장") 자리에 쓰는 값. 저장하지 않으므로 항상 진행도와 일치한다.

// 칭호 구간 — at 이상이면 그 칭호. 낮은 것부터 정렬해 둔다.
export const PLAYER_TITLES = [
  { at: 1, name: '견습' },
  { at: 8, name: '모험가' },
  { at: 16, name: '기사' },
  { at: 28, name: '기사단장' },
  { at: 44, name: '영웅' },
  { at: 64, name: '전설' },
];

// 역대 최고층(peakStage)과 환생 횟수로 만든다.
//   층은 제곱근으로 완만하게(초반 체감↑ 후반 인플레↓), 환생은 한 번에 5.
export function playerLevel(state) {
  const peak = Math.max(1, Math.floor(state?.peakStage || 1));
  const prestige = Math.max(0, Math.floor(state?.prestige || 0));
  return Math.floor(Math.sqrt(peak) * 2) + prestige * 5 + 1;
}

export function playerTitle(level) {
  let name = PLAYER_TITLES[0].name;
  for (const t of PLAYER_TITLES) if (level >= t.at) name = t.name;
  return name;
}
