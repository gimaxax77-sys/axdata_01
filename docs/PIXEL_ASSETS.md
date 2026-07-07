# 픽셀 에셋 쇼핑 리스트 (큐레이션)

풀 비주얼 픽셀 게임에 필요한 카테고리별 추천. **다운로드는 Gim이 itch.io 로그인 후**,
받은 파일은 제가 우리 규격에 맞게 렌더/통합합니다. **라이선스는 각 페이지에서 최종 확인** 필수.

> ⚠️ 3대 주의
> 1. **스타일 통일** — 여러 작가 팩을 섞으면 그림체가 튑니다. 캐릭터 팩 1개를 기준으로
>    UI·배경을 거기에 맞추는 게 안전. (한 작가/한 스타일 계열로 모으기)
> 2. **시점** — 우리 전투는 좌우 대치(사이드/정면). 탑다운 걷기 스프라이트는 정면 대기컷만
>    쓰거나 부적합할 수 있음.
> 3. **로스터 수** — 영웅 28종 + 등급 + 적. 무료 팩 하나로 28종은 어려움 → 모듈러(장비 교체)
>    팩 + 색변형으로 확보하거나 우선 소수부터.

---

## 1. 캐릭터 (영웅·적) — 최우선

| 팩 | 특징 | 라이선스 | 링크 |
|---|---|---|---|
| **Cute Fantasy RPG** (Kenmi) | 캐릭터+적+동물, 대기/이동/공격 애니, 16×16 탑다운. 톤 귀엽고 통일감↑ | 상업 허용(페이지 확인) | kenmi-art.itch.io/cute-fantasy-rpg |
| **Free Tiny Hero Sprites** (Free Game Assets) | 작은 영웅 스프라이트, 개인·상업 OK | 상업 허용 | free-game-assets.itch.io/free-tiny-hero-sprites-pixel-art |
| **Pixel Prototype Player** (Dead Revolver) | 사이드뷰 1캐릭 다수 애니, CC0 | CC0 | deadrevolver.itch.io/pixel-prototype-player-sprites |

→ **추천**: 컬렉션 RPG엔 **Cute Fantasy RPG**가 캐릭+적+애니를 한 스타일로 커버해 통일감이 좋음. 이걸 기준 스타일로.

## 2. UI / GUI

| 팩 | 특징 | 라이선스 | 링크 |
|---|---|---|---|
| **Fantasy RPG UI Pixel Pack** (Mounir Tohami) | 버튼·HP바·패널·아이콘·대화창, 16×16 그리드 | 상업 허용 | veyroa.itch.io/fantasy-minimal-pixel-art-gui |
| **Pixel UI Kit – Fantasy RPG GUI** | **다크 패널 + 골드 트림** (우리 팔레트와 딱!) | 상업, 출처불요 | amadeva.itch.io/pixel-ui-kit-fantasy-rpg-gui-panels-menus-bars-icons |
| **Fantasy RPG UI (CC0)** (Veyroa) | 완전 CC0 인터페이스 | CC0 | veyroa.itch.io/fantasy-minimal-pixel-art-gui |

→ **추천**: **Pixel UI Kit(다크+골드)** — 지금 게임 색감(보라/금)과 바로 맞음.

## 3. 배경 / 타일셋

| 팩 | 특징 | 라이선스 | 링크 |
|---|---|---|---|
| **Castle Dungeon** (aamatniekss) | 성/던전 타일셋 + 시차(parallax) 배경 | 상업 허용 | aamatniekss.itch.io/castle-dungeon-f |
| **2D Pixel Dungeon** (Pixel_Poem) | 던전 에셋, 수정 자유 | 상업, 수정 OK | pixel-poem.itch.io/dungeon-assetpuck |

→ 속성별 씬(성역·협곡·설원…)은 여러 배경 팩을 등급/구역별로. 우선 던전 1종부터.

## 4. 폰트 — ✅ 확보 완료
- **Galmuri11** (갈무리, SIL OFL) — 이미 앱에 탑재. 추가 후보: 닐로(Neodgm), 둥근모.

## 5. 이펙트 (후순위)
- 타격·소환·환생 연출용 픽셀 FX 팩 (itch "pixel effects" 태그). Phase 3에서.

---

## 통합 워크플로 (Gim ↔ Claude)
1. Gim: 위에서 **캐릭터 1팩 + UI 1팩 + 배경 1팩** 우선 다운로드 (스타일 통일 위해 소수 정예).
2. Gim: 압축 풀어 폴더 통째로 공유(또는 리포에 커밋).
3. Claude: 우리 규격으로 정리 → `assets/pixel/` 교체, 캐릭터 매핑(28종 ↔ 스프라이트),
   UI 컴포넌트를 실제 팩 프레임으로 교체.
4. 미리보기(play.html) → OTA/빌드 반영.

## 우선순위 추천
**캐릭터(Cute Fantasy RPG) → UI(Pixel UI Kit 다크+골드) → 배경(Castle Dungeon)** 3개면
메인 화면을 "진짜 상용 픽셀 게임" 수준으로 끌어올릴 수 있습니다. 나머지는 그다음.
