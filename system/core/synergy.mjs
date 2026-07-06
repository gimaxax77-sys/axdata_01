// ─────────────────────────────────────────────────────────────
// 팀 시너지 — 파티 "구성"에 따라 팀 전체에 붙는 보너스.
// 파티가 단순 합산이 아니라 "누구를 넣느냐"가 전략이 되게 한다.
//   · 삼위일체 : 3원형(방어·공격·지원) 모두 편성
//   · 원형 진형 : 같은 원형 3+ 집중
//   · 속성 결속 : 같은 속성을 여럿 모을수록 화력↑
//   · 오색 결속 : 전원 서로 다른 속성 (다양성 보상)
// 결속과 오색은 자연히 배타적(같은 속성 겹치면 오색 불가).
// resolution.resolve()가 이 배수를 파티 전체에 적용한다.
// ─────────────────────────────────────────────────────────────

export function teamSynergy(units) {
  const mult = { atk: 1, hp: 1, def: 1 };
  const list = [];
  const add = (id, label, desc, m) => {
    mult.atk *= m.atk || 1; mult.hp *= m.hp || 1; mult.def *= m.def || 1;
    list.push({ id, label, desc });
  };
  if (!units || units.length === 0) return { mult, list };

  const arch = {}; const elem = {};
  for (const u of units) {
    arch[u.archetype] = (arch[u.archetype] || 0) + 1;
    if (u.element) elem[u.element] = (elem[u.element] || 0) + 1;
  }

  // 삼위일체 — 3원형 모두
  if (arch.VANGUARD && arch.STRIKER && arch.SUPPORT) {
    add('trinity', '삼위일체', '3원형 편성 · 전 스탯 +12%', { atk: 1.12, hp: 1.12, def: 1.12 });
  }
  // 원형 진형 — 같은 원형 3+
  if ((arch.STRIKER || 0) >= 3) add('str_focus', '공격 진형', '전사 3+ · 공격 +18%', { atk: 1.18 });
  if ((arch.VANGUARD || 0) >= 3) add('van_focus', '철벽 진형', '수호 3+ · 체력 +20% 방어 +15%', { hp: 1.20, def: 1.15 });
  if ((arch.SUPPORT || 0) >= 3) add('sup_focus', '지휘 진형', '지원 3+ · 공격 +12%', { atk: 1.12 });

  // 속성 결속 — 같은 속성 최대 그룹 크기에 비례
  const maxElem = Math.max(0, ...Object.values(elem));
  if (maxElem >= 2) {
    const m = maxElem >= 4 ? 1.22 : maxElem >= 3 ? 1.15 : 1.08;
    add('elem_bond', '속성 결속', `동일 속성 ${maxElem} · 공격 +${Math.round((m - 1) * 100)}%`, { atk: m });
  }
  // 오색 결속 — 전원(3+) 서로 다른 속성
  const withElem = units.filter((u) => u.element).length;
  if (withElem >= 3 && Object.keys(elem).length === withElem) {
    add('rainbow', '오색 결속', '전원 다른 속성 · 공격·체력 +10%', { atk: 1.10, hp: 1.10 });
  }

  return { mult, list };
}
