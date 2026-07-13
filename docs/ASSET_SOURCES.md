<!-- 무료(CC0 우선) 게임 에셋 소스 카탈로그 + 라이선스 정책 -->
# 게임 에셋 소스 카탈로그 (CC0 우선, 2026-07 조사)

> **요약**: 우리 노선(3D→2D 프리렌더)에 맞는 **무료·CC0** 소스를 우선 정리한다.
> 몬스터·환경도 **오늘 만든 렌더 파이프라인에 그대로** 얹을 수 있다.
> 관련: [`ART_STRATEGY.md`](./ART_STRATEGY.md) · [`ART_PIPELINE_3D.md`](./ART_PIPELINE_3D.md) · [`SPRITE_WORKFLOW.md`](./SPRITE_WORKFLOW.md) · [`PIXEL_ASSETS.md`](./PIXEL_ASSETS.md)
>
> 렌더 자동화 스크립트는 별도 저장소 `axdata_05`(scripts/render_sprites.py).

---

## 1. 파이프라인과의 연결 (중요)

우리 렌더 스크립트는 **KayKit 전용이 아니다.** 같은 저폴리 토ون 스타일의 **CC0 3D 몬스터·환경**을 넣으면
영웅과 **한 스타일로 통일**되어 2D로 구워진다. 즉 몬스터도 무료·일관 스타일로 대량 생산 가능.

---

## 2. 카테고리별 소스

| 카테고리 | 소스 | 라이선스 | 형식/비고 | 파이프라인 |
|---|---|---|---|:---:|
| **영웅(3D)** | KayKit Adventurers | **CC0** | 6바디 모듈러 + 무기 | 3D→2D ✅ |
| **몬스터·크리처(3D)** | **Quaternius** (LowPoly Animated Monsters 등, 70팩·2500+) | **CC0** | 공격·걷기·대기 애니 내장. OBJ/FBX/Blend | 3D→2D ✅ |
| **적(3D, 동일 리그)** | KayKit **Skeletons / Dungeon** 팩 | **CC0** | KayKit 애니 공유 가능 | 3D→2D ✅ |
| **배경·환경(3D)** | Quaternius Environments, Kenney 3D | **CC0** | 지형·소품 | 3D→2D(선택) |
| **UI·HUD** | **Kenney** UI Pack(430)·UI Pack Adventure(130) | **CC0** | 버튼·패널·바 | 2D 직접 |
| **아이콘(아이템·스킬)** | **game-icons.net** (4000+) | **CC BY 3.0** ⚠️ | 벡터/PNG. 출처표기 필요 | 2D 직접 |
| **아이콘·2D 잡에셋** | Kenney 아이콘·2D | **CC0** | — | 2D 직접 |
| **효과음(SFX)** | Kenney Audio, Freesound, OpenGameArt(CC0), Sonniss GDC | CC0/혼합 ⚠️ | 사운드별 확인 | 직접 |
| **배경음악(BGM)** | Incompetech(K. MacLeod), Kenney music, Pixabay | 대개 **CC BY** ⚠️ | 출처표기 확인 | 직접 |
| **폰트** | Kenney fonts, Google Fonts | CC0/OFL | 한글은 Noto 등 | 직접 |
| **애니메이션 보강** | Mixamo | 무료 | 휴머노이드 리그 | 3D 파이프라인 |

---

## 3. 라이선스 정책 (반드시 준수)

- **CC0 우선.** 무료·상업·**출처표기 불필요**. (KayKit · **Quaternius** · **Kenney** · OpenGameArt CC0 필터)
- **CC BY**는 무료·상업 가능하나 **출처표기 필수**. (game-icons.net · Incompetech · 일부 Freesound)
- 원칙: **가능하면 CC0만** 쓴다. CC0만 쓰면 크레딧 관리가 아예 필요 없다.
- CC BY를 쓸 경우 → 아래 크레딧 관리를 반드시 한다.

### 크레딧(출처표기) 관리
- CC BY 자산을 도입하면 **게임 내 "크레딧" 화면 목록**에 `저작자 · 출처 · 라이선스`를 남긴다.
- 도입 시점에 이 파일이나 `CREDITS.md`에 한 줄씩 누적해 두면 나중에 편하다.

---

## 4. 도입 우선순위

1. **Quaternius 몬스터 팩** → `axdata_05/scripts/render_sprites.py` 에 경로 추가 → 몬스터 배치 렌더(영웅 검증 후).
2. **Kenney** All-in-1 또는 UI Pack + UI Audio → UI·버튼 효과음 즉시 확보(CC0).
3. **game-icons.net** → 아이템/스킬 아이콘(출처표기 시작).
4. **Incompetech/Kenney music** BGM 1~2곡 · **Freesound/Kenney Audio** 전투 효과음.

---

## 5. 기존 문서와의 관계
- `PIXEL_ASSETS.md` = 2D 픽셀 노선(다수 유료) 카탈로그.
- 이 문서 = **3D→2D 노선(채택한 길)** 에 맞는 **CC0 무료** 소스 중심 → 현재 전략과 더 부합.

---

## 참고(Sources)
- Quaternius: https://quaternius.com/ · https://quaternius.itch.io/lowpoly-animated-monsters
- Kenney: https://kenney.nl/assets · https://kenney.itch.io/kenney-game-assets
- game-icons.net (CC BY 3.0): https://game-icons.net/
- Incompetech (CC BY 음악): https://incompetech.com/ · OpenGameArt CC0 사운드: https://opengameart.org/content/cc0-sound-effects
