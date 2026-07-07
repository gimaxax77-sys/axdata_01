// 전투 연출/애니메이션 축소 플래그 (접근성·배터리 절약).
// App이 설정에서 동기화하고, BattleView/소환 연출이 이를 읽어 애니메이션을 끈다.
let reduce = false;
export function setReduceMotion(v) { reduce = !!v; }
export function reducedMotion() { return reduce; }
