# 🐹 두더지 잡기 (Mole Blitz)

React Native + Expo로 만든 간단한 모바일 게임입니다.
30초 안에 두더지를 최대한 많이 잡으세요. 단, 💣 폭탄을 치면 즉시 게임 오버!

## 게임 방법

- 구멍에서 튀어나오는 🐹 두더지를 탭하면 +1점
- 점수가 오를수록 두더지가 더 빠르게 등장하고 사라집니다 (난이도 상승)
- 💣 폭탄을 잘못 치면 즉시 게임 종료
- 최고 점수가 기록됩니다

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

### 3. 휴대폰에서 실행 (가장 쉬움)

1. 휴대폰에 **Expo Go** 앱을 설치합니다
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. `npm start` 실행 후 터미널에 나타나는 **QR 코드**를 스캔합니다
   - Android: Expo Go 앱으로 스캔
   - iOS: 기본 카메라 앱으로 스캔
3. 폰에서 바로 게임이 실행됩니다!

> 휴대폰과 컴퓨터가 **같은 Wi-Fi**에 연결되어 있어야 합니다.

### 웹 브라우저에서 미리보기

```bash
npm run web
```

## 프로젝트 구조

```
.
├── App.js          # 게임 전체 로직 & UI
├── app.json        # Expo 앱 설정
├── package.json    # 의존성
└── babel.config.js # Babel 설정
```

## 기술 스택

- **React Native** — 크로스 플랫폼 모바일 프레임워크
- **Expo** — 설치 없이 실기기 테스트가 가능한 개발 환경
- **Animated API** — 두더지 등장 애니메이션
