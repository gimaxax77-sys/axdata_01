# 로컬 빌드 가이드 — 지금 실제로 쓰는 절차

> **작성 2026-07-29 · 갱신 2026-07-30**(빌드 시간·APK 크기 단위·게이트 스크립트·up-to-date 함정).
> 이 문서에 적힌 명령·수치는 전부 **실제로 실행해 확인한 것**입니다.
> 작업 폴더 = `D:\.CODE\AXdata\axdata_01_eldria` (모든 경로는 여기 기준).

## 이 문서와 옛 빌드 문서 4개의 관계

`docs/`에 빌드 문서가 이미 4개 있습니다. **전부 7월 7~8일자이고 EAS(Expo 클라우드) 빌드를 권장안으로 설명합니다.**
지금은 **로컬 빌드가 기본**이고 EAS는 대안이라, 그대로 따라 하면 다른 길로 갑니다.

| 문서 | 무엇 | 현재 상태 |
|---|---|---|
| `ANDROID_BUILD.md` | EAS vs 로컬 비교, OTA 전략 | **참고자료** — EAS를 권장으로 서술 |
| `BUILD_APK.md` | EAS로 APK/AAB 뽑기 | **참고자료** — EAS 경로 |
| `BUILD_WALKTHROUGH.md` | 처음 빌드하는 사람용 워크스루 | **참고자료** — EAS 경로 |
| `DEPLOY.md` | 출시 배포(두 컨셉·3플랫폼) | **일부 유효** — 아이콘 생성·컨셉 분기는 지금도 맞음 |

**폐기가 아니라 참고자료로 둡니다**(`SEVEN_REVAMP.md`와 같은 취급). EAS를 다시 쓸 날이 오면 그 문서가 맞습니다.
**지금 빌드하려면 이 문서를 봅니다.**

---

# 빌드는 두 종류입니다

| | A. 웹 빌드 | B. 안드로이드 APK |
|---|---|---|
| **무엇** | `docs/play.html` 단일 파일 → GitHub Pages | 설치용 `.apk` → 구글 드라이브 |
| **언제** | **코드를 고칠 때마다**(일상 확인 루프) | 앱 형태로 볼 때, 가끔 |
| **걸리는 시간** | 약 1분 + 배포 반영 30~45초 | **캐시 있으면 40초 · 캐시 지우면 5분 40초** |
| **폰에서 보는 법** | 브라우저 링크 | 파일 받아 설치 |

일상 작업은 **A만** 하면 됩니다. B는 요청이 있을 때만 합니다.

---

# A. 웹 빌드 → `docs/play.html` → 배포

## A-1. 먼저 `dist`를 잠근 프로세스를 죽입니다 ⚠️

**이 단계를 건너뛰면 옛 코드가 조용히 배포됩니다.** 세 번 당한 함정입니다.

로컬 확인용 정적 서버가 `dist` 폴더를 잡고 있으면 `expo export`가 **EBUSY로 실패**하는데,
그다음 `build-play.mjs`가 **옛 `dist`를 읽어 성공해 버립니다.** 겉보기엔 빌드가 잘 된 것처럼 보입니다.

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*serve*' -and $_.CommandLine -notlike '*server.js*' } | Select-Object ProcessId, CommandLine
```

나오는 게 있으면 `Stop-Process -Id <PID> -Force` 로 죽입니다. 아무것도 안 나오면 그냥 다음으로 갑니다.

> **`-notlike '*server.js*'` 를 반드시 붙입니다.** `*serve*` 만으로 거르면 Gim의 다른 프로세스(`node server.js`)까지 죽습니다. 실제로 죽인 적이 있습니다.

## A-2. 빌드 (Git Bash에서)

```bash
EXPO_OFFLINE=1 npx expo export --platform web && node scripts/build-play.mjs
```

- **Git Bash에서 실행합니다.** Windows PowerShell은 `EXPO_OFFLINE=1 명령` 형태의 앞자리 환경변수를 못 읽습니다.
- `package.json`에 `npm run build:play` 스크립트가 같은 내용으로 들어 있습니다(Git Bash에서만 동작).
- 결과: **`docs/play.html`** (약 24.6MB 단일 파일). 이미지 185개가 base64로 안에 박혀 그렇게 큽니다.
- `docs/play.html`은 **`.gitignore` 대상**이라 커밋되지 않습니다. 배포는 아래 A-4의 별도 클론으로 합니다.

## A-3. 번들 해시가 바뀌었는지 확인합니다 ⚠️

`expo export` 출력 끝부분에 이런 줄이 나옵니다.

```
_expo/static/js/web/AppEntry-777e2010a44d34043f522db9cd21b9b7.js (1.18 MB)
```

**이 해시가 직전 빌드와 달라야 합니다.** 같으면 코드가 안 들어간 것이니 A-1로 돌아갑니다.

내 수정이 정말 들어갔는지 더 확실히 보려면 번들에서 **바뀐 값을 직접 찾습니다.**

```bash
grep -c "left:-30" dist/_expo/static/js/web/AppEntry-*.js
```

> ### 문자열로 찾을 때 주의 2가지
> 1. **한글은 `\uXXXX`로 이스케이프됩니다.** 원문으로 찾으면 전부 안 나와 빌드 실패로 오인합니다.
> 2. **템플릿으로 조합되는 문자열은 통째로 존재하지 않습니다.** `{N}레벨 상승`·`${d.label} 난이도` 같은 것은
>    조각으로만 들어갑니다. `레벨 상승` 처럼 나눠서 찾습니다.
>
> → 그래서 **한글 대신 색상코드·숫자 같은 ASCII 값**으로 찾는 편이 확실합니다.

## A-4. 배포 (GitHub Pages)

`gh-pages` 브랜치를 임시 폴더에 얕게 클론해서 `index.html`만 갈아끼웁니다.
(`--force` push와 `gh api POST`는 이 환경에서 차단돼 있습니다. 일반 push를 씁니다.)

```bash
SP="<스크래치패드 경로>"
git clone --depth 1 -b gh-pages https://github.com/gimaxax77-sys/axdata_01.git "$SP/ghp"
cp docs/play.html "$SP/ghp/index.html"
cd "$SP/ghp" && git add index.html && git commit -qm "변경 요약" && git push origin gh-pages
```

한 번 클론해 두면 다음부터는 `cp` → `commit` → `push` 세 줄이면 됩니다.

## A-5. 배포본이 정말 바뀌었는지 확인합니다

**GitHub Pages는 즉시 반영되지 않습니다.** 실측으로 **15초 간격 2~3회**(약 30~45초) 걸렸습니다.
바로 확인하면 옛 파일이 내려와 "반영 안 됨"으로 오인합니다.

로컬 파일과 배포본의 **sha256이 같아지면** 반영이 끝난 것입니다.

```bash
L=$(sha256sum docs/play.html | cut -d' ' -f1)
for i in $(seq 1 20); do
  R=$(curl -s "https://gimaxax77-sys.github.io/axdata_01/?n=$RANDOM" | sha256sum | cut -d' ' -f1)
  if [ "$L" = "$R" ]; then echo "MATCH: $R"; break; fi
  sleep 15
done
```

> `?n=$RANDOM` 은 캐시를 피하려고 붙입니다.

## A-6. Gim에게 링크를 보냅니다

```
https://gimaxax77-sys.github.io/axdata_01/?v=<번호>
```

`?v=` 뒤 번호는 **폰 브라우저 캐시를 피하려고 매번 올립니다.** 값 자체는 아무 의미가 없습니다.
(2026-07-29 기준 마지막은 `?v=41`)

---

# B. 안드로이드 APK 로컬 빌드

## B-0. 전제

| 항목 | 값 | 확인 |
|---|---|---|
| JDK | `D:\Android\jdk17` | 폴더 존재 |
| Android SDK | `D:\Android\Sdk` | `android/local.properties`의 `sdk.dir` |
| 네이티브 폴더 | `android/` | **`.gitignore` 대상** — `npx expo prebuild`로 재생성 |

## B-1. ⚠️ `android/gradle.properties` 두 줄을 먼저 확인합니다

**폴더 이름에 한글(`엘드리아`)이 있어서, 이 두 줄이 없으면 빌드가 시작도 못 하고 실패합니다.**

```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8
android.overridePathCheck=true
```

| 없을 때 나오는 에러 | 진짜 원인 |
|---|---|
| `Included build '…\node_modules\@react-native\gradle-plugin' does not exist` (**폴더는 실제로 있습니다**) | `settings.gradle` 7번 줄이 `node`로 받은 경로(UTF-8)를 JVM 기본 문자셋(MS949)으로 디코딩해 한글이 깨집니다 |
| `Your project path contains non-ASCII characters.` | 안드로이드 빌드 도구(AGP)가 한글 경로를 아예 막습니다 |

> **셸 문제가 아닙니다.** PowerShell·Git Bash 둘 다 똑같이 실패합니다.
> 콘솔 코드페이지(`chcp` 65001)와 JVM 문자셋은 별개입니다. 확인하려면
> `& "D:\Android\jdk17\bin\java.exe" -XshowSettings:properties -version` 의 `file.encoding` 을 봅니다.
>
> **`android/`가 `.gitignore` 대상이라 이 두 줄은 커밋되지 않습니다.**
> `expo prebuild`로 폴더가 재생성되면 조용히 사라지고 같은 실패를 처음부터 다시 겪습니다.
> 2026-07-29에 실제로 재발했습니다(7/19에 이미 한 번 고쳤던 문제).

## B-2. ~~ASCII 가상 드라이브(`subst`)~~ → **2026-07-30 폴더 개명으로 불필요해졌습니다**

폴더가 `axdata_01_eldria`(전부 ASCII)로 바뀌어 **`subst` 없이 실제 경로에서 그대로 빌드됩니다.**
같은 날 캐시를 지우고 실측했습니다 — `BUILD SUCCESSFUL in 5m 39s`(726 tasks 중 **649개 실제 실행**, ninja 오류 0건, APK 87.8MB).
(캐시가 살아 있을 때의 수치는 B-3 표를 봅니다.)

> 아래는 **왜 그랬는지**에 대한 기록입니다. 폴더 이름에 한글을 다시 들이면 그대로 재발합니다.

<details><summary>개명 전 상황 (한글 경로일 때)</summary>

**한글 경로에서 직접 빌드하면 네이티브 C++ 단계에서 실패합니다.** B-1의 두 줄로는 못 막습니다.

```
ninja: error: FindFirstFileExA(d:/.code/axdata/axdata_01_…/node_modules/expo-av/…/cpp): 지정된 경로를 찾을 수 없습니다
```

`ninja`(NDK의 C++ 빌드 도구)는 옛 ANSI 파일 API를 써서 한글 경로를 열지 못하고, **이건 해제 옵션이 없습니다.**
(2026-07-29 첫 빌드가 통과한 건 C++ 산출물이 7/19 것 그대로 남아 있어 그 단계를 건너뛰었기 때문입니다. 캐시가 무효화되자 바로 드러났습니다.)

```powershell
subst X: "D:\.CODE\AXdata\axdata_01_eldria"
```

> **정션(`mklink /J`)은 안 됩니다.** `ninja`는 통과하지만 **Metro가 실패**합니다 —
> Node가 정션을 원래 한글 경로로 되돌려 해석해서 `Unable to resolve module ../../App` 이 납니다.
> **`subst`는 장치 매핑이라 되돌려지지 않아** 전 구간이 `X:\…` 로만 보입니다. 실제로 이 차이로 갈렸습니다.
>
> `subst`는 **재부팅하면 사라집니다.** 빌드할 때마다 위 한 줄을 먼저 실행하면 됩니다.
> 이미 있으면 `이미 SUBST된 드라이브입니다` 가 뜨는데 그냥 진행하면 됩니다. 해제는 `subst X: /D`.

</details>

## B-3. 빌드

### 권장 — 게이트 스크립트 한 줄

B-1의 확인과 빌드를 한 번에 합니다. 점검 항목은 JDK · SDK · `local.properties` · `node_modules` · 한글 경로 2관문 · 경로 ASCII · ABI 4종 · 네이티브 캐시 8가지입니다.

```powershell
npm run build:apk:local
```

점검만 하고 빌드는 안 하려면 `npm run gate` 입니다.
(실체는 `_TOOLS\build-gate\build-gate.ps1` — 3트랙 공용입니다. `-Fix` 를 주면 한글 경로 2관문을 자동으로 채워 넣습니다.)

### 직접 돌릴 때 (PowerShell)

```powershell
$env:JAVA_HOME="D:\Android\jdk17"; $env:ANDROID_HOME="D:\Android\Sdk"; $env:ANDROID_SDK_ROOT="D:\Android\Sdk"
cd "D:\.CODE\AXdata\axdata_01_eldria\android"
.\gradlew.bat assembleRelease --no-daemon
```

### 걸리는 시간 — 캐시 상태에 따라 8배 차이납니다

둘 다 2026-07-30 실측입니다. 전체 task는 726개로 같고, **실제로 실행되는 개수**가 다릅니다.

| 캐시 | 실행 task | 시간 |
|---|---|---|
| 지운 뒤(첫 빌드) | 726개 중 **649개** | **5분 39초** |
| 살아 있을 때 | 726개 중 **37개** | **40초** |

끝에 `BUILD SUCCESSFUL` 이 보여야 합니다.

- 결과: **`android/app/build/outputs/apk/release/app-release.apk`**
- 크기 **87.8MB** — 윈도우 탐색기에는 **83.8MB**로 보입니다. 87,844,197바이트를 십진(1000) MB로 쓰느냐 1024 기준 MiB로 쓰느냐 차이일 뿐 **같은 파일입니다.** 둘 중 뭘 봐도 놀라지 않습니다.

> ### ⚠️ 코드가 안 바뀌었으면 Gradle은 APK를 **다시 만들지 않습니다**
> `BUILD SUCCESSFUL` 이 떠도 `app-release.apk` 의 **수정 시각과 sha256이 그대로**입니다.
> 신호는 이 줄입니다 — `726 actionable tasks: 37 executed, 689 up-to-date`.
>
> **실패가 아니라 정상 동작입니다.** 다만 "새 APK를 뽑았다"고 착각하기 쉽습니다.
> 2026-07-30 01:40에 실제로 겪었습니다 — 재빌드했는데 01:15에 만들어진 파일이 그대로 나왔습니다.
>
> → **빌드 뒤 파일 수정 시각을 봅니다.** 방금 시각이 아니면 내용이 그대로라는 뜻입니다.
> 앱이 정말 같은지는 파일 해시 말고 **APK 안의 `index.android.bundle` 해시**로 봅니다
> (APK 전체 해시는 빌드 시각·서명 때문에 매번 달라져 비교에 쓸 수 없습니다).

> **주의: `| tail` 같은 파이프를 붙이면 종료코드가 파이프 끝 명령 것이 됩니다.**
> gradle이 실패해도 성공(0)으로 보고돼 실패를 놓칩니다. 출력 끝을 확인할 땐 종료코드를 따로 봅니다.

## B-4. 알맹이가 들어갔는지 확인합니다

```bash
unzip -l app-release.apk | grep -E "index.android.bundle|libhermes"
```

- `assets/index.android.bundle` (약 1.6MB, Hermes 바이트코드) — **JS 코드 본체입니다.** 없으면 빈 앱입니다.
- `lib/{arm64-v8a,armeabi-v7a,x86,x86_64}/…` — 네이티브 라이브러리 4종.

## B-5. 구글 드라이브로 올립니다

```powershell
Copy-Item "…\app-release.apk" "G:\내 드라이브\APK\엘드리아_<날짜>_<시각>_<메모>.apk"
```

데스크톱 자동동기화로 폰에서 받습니다. **MCP Drive 도구는 대용량이 안 되므로 `G:` 드라이브에 복사합니다.**
복사 후 **원본과 사본의 sha256을 대조**해 온전히 갔는지 확인합니다.

```powershell
(Get-FileHash $원본 -Algorithm SHA256).Hash; (Get-FileHash $사본 -Algorithm SHA256).Hash
```

## B-6. 알아둘 것

- **release가 debug 키스토어로 서명됩니다**(`android/app/build.gradle`). 사이드로딩은 되지만 **플레이스토어 업로드는 불가**합니다.
- `versionCode`는 `app.json`에 있고 현재 **2**입니다. 사이드로딩엔 상관없지만 스토어에 낼 땐 올려야 합니다.
- 아키텍처는 **4종 전부** 담고 있습니다(`gradle.properties`의 `reactNativeArchitectures`).
  arm64만 남기면 **약 39MB 줄어 49MB**가 되고 빌드도 짧아지지만, PC 에뮬레이터에서 못 돌립니다.
  **Gim 결정(2026-07-29): 보류, 4종 유지.**

---

# 공통 — 완료 전에 반드시

## 테스트

```bash
node --test system/test/*.test.mjs
```

**309개 전부 통과**해야 합니다(2026-07-29 기준). 코드를 건드렸으면 "완료" 라고 말하기 전에 돌립니다.

> 테스트 안에서는 **테스트 모드가 강제로 꺼집니다.** 앱은 지금 테스트 모드가 켜져 있어
> 재화·해금이 전부 풀려 있지만(`system/core/testmode.mjs`의 `const ON = true`),
> 자동화 테스트 결과는 그 영향을 받지 않아 여전히 유효합니다.

## 화면 확인의 한계 ⚠️

브라우저 페인으로는 **`resize_window` 후 접근성 트리 읽기까지만** 됩니다.
**RN-Web이 합성 클릭을 받지 않아 탭 전환조차 불가능합니다.** 기본 탭(요새) 외의 화면은 직접 볼 수 없습니다.

→ **조작·레이아웃 확인은 Gim 폰에 맡기고, 확인하지 못한 것을 답변에 반드시 명시합니다.**

---

# 순서 요약 (체크리스트)

**웹 (일상)**
- [ ] `dist` 잠근 서버 종료 (`-notlike '*server.js*'` 필수)
- [ ] `EXPO_OFFLINE=1 npx expo export --platform web && node scripts/build-play.mjs` (Git Bash)
- [ ] **번들 해시 변경 확인**
- [ ] `gh-pages` 클론에 `index.html` 복사 → commit → push
- [ ] **배포본과 로컬 sha256 일치 확인**(30~45초 걸림)
- [ ] 테스트 309개 통과
- [ ] `?v=` 번호 올려 폰 링크 전달

**APK (요청 시)**
- [ ] `android/gradle.properties` 두 줄 확인
- [ ] ~~`subst X:`~~ **불필요**(2026-07-30 폴더 개명으로 경로가 전부 ASCII)
- [ ] `npm run build:apk:local` (게이트 점검 + 빌드) — 캐시 있으면 **40초**, 지운 뒤면 **5분 39초**
- [ ] **APK 수정 시각이 방금인지 확인** — 그대로면 코드가 안 바뀌어 재생성이 생략된 것
- [ ] APK 안에 `index.android.bundle` 있는지 확인
- [ ] `G:\내 드라이브\APK\` 복사 → **sha256 대조**
