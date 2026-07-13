# research.md — 작업·조사 기록

> CLAUDE.md 규칙: 모든 질문·요구·요청과 진행 과정·결과를 신중·깊이·상세·명확·정확하게 정리해 여기에 누적 기록한다.

## 기록 형식
- **날짜 — 제목**
  - 요청:
  - 진행:
  - 결정·근거:
  - 결과:

---

## 2026-07-13 — CLAUDE.md 규칙 추가 및 전 저장소 횡전개
- 요청: CLAUDE.md에 "모든 답변을 신중·깊이·상세·명확·정확하게 정리하고 research.md에 기록" 규칙 추가, 전 저장소 기본 브랜치에 횡전개.
- 진행: 7개 저장소(axax77, axdata_01/03/05/07/09, gax)의 기본 브랜치 CLAUDE.md에 "답변·기록 규칙" 섹션 추가, 각 저장소에 research.md 생성.
- 결정·근거: '횡전개' = 새 세션이 실제로 여는 기본 브랜치에 반영(ponytail 배포와 동일 기준). 기존 CLAUDE.md는 보존하고 규칙 섹션만 추가(수술적 변경).
- 결과: 각 저장소 커밋·푸시 완료(아래 커밋 참조).

## 2026-07-13 밤 — 아트 브릿지 확인 + 캐릭터 매핑 초안
- 확인: 게임팩에 이미 브릿지 존재(gen-art-csv.mjs → docs/art_assets.csv). 캐릭터 33명, 초상 14완료/19필요, 전투 스프라이트(4종) 33 전원 필요.
- 추가: gen-character-map.mjs → docs/character_map.csv 자동 초안(로스터 원형/속성 기반).
  - 원형→몸: STRIKER/VANGUARD→Knight, SUPPORT→Mage, ROGUE→Rogue, ARCHER→Ranger.
  - 속성→색: FIRE빨강/WATER파랑/WOOD초록/LIGHT금흰/DARK보라.
  - 배정: Knight 12·Mage 11·Rogue 5·Ranger 5. (Gim 검토·수정용, Barbarian/Rogue_Hooded 다양화 여지)
- 남은 통합: 렌더 도구가 이 매핑대로 게임 규격 이름·경로로 출력 → charImages.js 자동 반영.
