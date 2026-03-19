# Betsurezone 로고·아이콘 제작 가이드

**사이트**: betsurezone.com  
**목적**: 현재 "ynex" 텍스트/아이콘을 Betsurezone 브랜드 로고·아이콘으로 교체하기 위한 제작 자료.  
**도구**: 아래는 **GPT Image Generator**용 지령(1~7)과 **Looka(looka.com)** 용 지령을 모두 포함합니다.

**사용 방법**: GPT는 **한 번에 이미지 하나만** 생성할 수 있으므로, **지령 1~7**을 **한 번에 하나씩** 실행하세요. 각 지령마다 **해상도·확장자**를 기존 Ynex 로고와 동일하게 맞춰 두었으니, 생성 후 지정된 **파일명 1개**로만 저장하면 됩니다.

**기준 경로**: `Ynex-tailwind-ts-nextjs\public\assets\images\brand-logos` (또는 Staterkit의 `public/assets/images/brand-logos`)  
**기준 사양**: desktop-* 100×35 px PNG, toggle-* 36×36 px PNG, favicon 16×16 px ICO.

---

## 공통 참고 (브랜드 컨텍스트 · 반드시 반영)

- **서비스**: 퀀트급 슈어벳·밸류벳 분석 플랫폼 — 실시간 배당, 유동성·예상 체결가, T-value, SafeStake. “실행 가능한 기회”에 초점.
- **로고가 전달해야 할 것**: 전문성 + **기억에 남는 브랜드 감성**. 단순한 한 가지 색·플랫한 실루엣만 쓰면 섬뜩하고 단조로워 보이므로 **금지**.
- **배경 (필수)**: 모든 로고·아이콘은 **투명 배경(transparent)** 으로 생성. 다양한 배경에 올려 쓸 수 있도록 단색/흰/검정 채우지 말 것.
- **색감 (테마 primary 기준)**  
  - **라이트 모드** (desktop-logo, toggle-logo, favicon): 파란 사용 금지. **테마 primary 색** 사용 (Staterkit 기준 **#845adf**). **"Bet"** 부분만 primary 색, **"surezone"** 부분은 **어두운 그라데이션**(진한 남청~검정에 가까운 톤, 기존 ynex "nex" 두 번째 참고 이미지처럼). 아이콘도 primary(#845adf) 계열·은은한 그라데이션.  
  - **다크 모드** (desktop-white, desktop-dark, toggle-white, toggle-dark): **"Bet"** 만 primary(#845adf), **"surezone"** 은 **기존색 유지**(흰색~밝은 회색). 아이콘은 흰색~밝은 회색. 다크에서도 그라데이션은 은은하게. 광택·메탈릭 금지.
- **디테일**:  
  - 심볼: 슈어벳(여러 배당 수렴)·밸류벳(가치 상승)·차트·실행(체크/타깃) 등 **서비스 의미가 읽히는 요소**를 넣되, 작은 크기에서도 구분 가능하게.  
  - "Betsurezone" 텍스트: **글자 굵기·자간·약간의 개성** 있는 산세리프. 너무 얇거나 무난한 폰트만 쓰지 말 것.  
  - **은은한 깊이**: 완전 플랫보다는 **같은 색 계열 안에서만** 은은한 톤 차이. 광택(glossy)·메탈릭·강한 그라데이션은 촌스러우므로 금지.
- **피할 것**: 단일 색 플랫, 지나치게 미니멀해 보이는 아이콘, 아무 앱에나 쓸 수 있는 범용 실루엣, 텍스트만 강조한 단순 조합.

- **촌스러움·색상 불균형 방지 (필수)**  
  - **글래스/메탈 금지**: 로고 전체에 광택(glossy)·메탈릭(metallic)·반짝이는 하이라이트를 넣지 말 것. 2000년대 스타일의 “기름진” 그라데이션은 촌스러워 보이므로 **금지**.  
  - **색상 조화**: 라이트 모드에서는 **primary(#845adf)** 와 **surezone용 어두운 그라데이션**만 사용. 파란·초록 강조 금지.  
  - **그라데이션**: Bet·아이콘은 primary 계열 내 은은한 톤 차이. surezone(라이트)는 진한 남청→검정 쪽 어두운 그라데이션. 다크 모드 surezone·아이콘은 흰↔밝은 회색 톤만.
- **캔버스 채우기 (필수)**: 주어진 해상도(100×35, 36×36, 16×16) 안에서 **로고·아이콘이 프레임을 꽉 채워야** 함. 여백을 크게 두면 같은 픽셀 사이즈여도 내용이 작아 보이므로, **패딩·여백 최소화**, **아이콘과 글자가 가용 공간의 대부분을 사용**하도록 생성할 것.

---

## 고정 아이콘·글꼴 (지령 1~7 전부 동일 · 필수)

**7개 에셋은 모두 같은 아이콘·같은 글꼴을 쓴다. 바꾸는 것은 형식(가로 로고 vs 아이콘만), 배경, 색상뿐이다.**

- **아이콘 (첫 번째 참고 이미지 기준)**  
  - **구성**: 왼쪽에 **막대 그래프**(세로 막대 4개, 왼쪽→오른쪽으로 높이 증가) + 그 뒤/오른쪽에서 **곡선 3줄이 모여 위쪽을 향하는 화살표** 형태.  
  - **색**: 참고 이미지에서는 막대는 흰색, 곡선·화살표는 밝은 회색으로 톤 차이. 다른 버전에서는 파란 한 계열 또는 흰/밝은 회색으로 통일.  
  - **의미**: 상승·성장·밸류벳/슈어벳 데이터를 연상시키는 한 가지 심볼. **지령 1~7 모두 이 아이콘만 사용.**

- **글꼴 (두 번째 참고 이미지 기준)**  
  - **표기**: 반드시 **"Betsurezone"** — 맨 앞 **B만 대문자**, 나머지 **etsurezone**은 소문자.  
  - **스타일**: 모던한 산세리프, medium~semi-bold, 자간 균형 좋은, 읽기 쉬운 굵기.  
  - **적용**: 가로 로고(지령 1~3)에서만 텍스트 사용. 지령 4~7은 **아이콘만** (글자 없음).

- **변경 가능한 것만**  
  - **형식**: 가로 로고(아이콘+텍스트) vs 정사각형 아이콘만.  
  - **배경**: 모두 **투명**. (표시 시점의 라이트/다크 배경에 따라 적절한 파일 선택.)  
  - **색상**: 라이트용 = Bet·아이콘 primary(#845adf), surezone 어두운 그라데이션. 다크용 = Bet primary, surezone·아이콘 흰색~밝은 회색.

---

## 중요: GPT는 1024×1024만 생성할 때 (작업 흐름)

**상황**: 이미지 생성기가 **1024×1024** 크기만 출력하고, 저장 시 **100×35·36×36·16×16** 등으로 리사이즈·크롭함. 그대로 만들면 정사각형 중앙에 작게 그려져서, 100×35로 줄이면 **아이콘·글자가 너무 작아지고**, 위·아래 여백만 넓어짐.

**해결**:

- **가로 로고 (지령 1~3, 100×35)**  
  - **1024×1024 안에서 “가로 긴 띠”만 사용**하라고 지시.  
  - 아이콘과 "Betsurezone" 텍스트는 **전체 가로는 꽉 쓰고, 세로는 화면의 가운데 약 35% 높이만 사용** (즉, 100:35 비율의 영역을 가운데에 두고, 그 안을 로고로 꽉 채움).  
  - 위·아래 나머지 영역은 **단색 배경**으로 두고, 저장 시 **그 가운데 가로 띠만 크롭해 100×35**로 저장하면, 로고가 프레임을 채워서 **글자·아이콘이 크게 보임**.

- **정사각형 아이콘 (지령 4~6: 36×36, 지령 7: 16×16)**  
  - **1024×1024 전체를 심볼로 꽉 채움**. 가장자리까지 여백 없이 그리게 하면, 36×36·16×16으로 줄여도 **아이콘이 작아 보이지 않음**.

아래 지령 1~7 프롬프트는 이 원칙을 반영해, **1024×1024로 생성한 뒤 지정 비율로 크롭·리사이즈했을 때** 아이콘과 텍스트가 잘 보이도록 작성되어 있음.

**저장 시 변환 (필수)**  
| 구분 | GPT 출력 | 저장할 때 |
|------|----------|-----------|
| 지령 1~3 (desktop) | 1024×1024 | **가운데 가로 띠만 크롭** → 100×35 PNG |
| 지령 4~6 (toggle) | 1024×1024 | **전체 리사이즈** → 36×36 PNG |
| 지령 7 (favicon) | 1024×1024 | **전체 리사이즈** → 16×16 PNG → ICO로 변환 후 favicon.ico |

---

## 지령 1 — desktop-logo.png

**저장 파일**: `desktop-logo.png`  
**해상도**: **100 × 35 px**  
**확장자**: **PNG**

**생성할 것**: 라이트 모드 헤더용 가로 로고. **아이콘**: 막대 그래프(세로 막대 4개, 왼쪽→오른쪽 높이 증가) + 곡선 3줄이 모인 위쪽 화살표. **글꼴**: "Betsurezone"(B만 대문자, 나머지 소문자), 모던 산세리프 medium~semi-bold. **1024×1024** 출력, 로고는 **가운데 가로 띠(세로 약 35%)만** 꽉 채우기. 파란 한 계열, 광택·메탈릭·밝은 초록 금지.

**▼ 프롬프트 (복사해서 사용):**

```
Horizontal logo. Left: ONE fixed icon—bar chart (4 vertical bars, height increasing left to right) plus three curved lines forming an upward-pointing arrow (same icon used for all Betsurezone assets). Right: text "Betsurezone" only—capital B, rest lowercase "etsurezone", modern clean sans-serif, medium to semi-bold. CRITICAL: Output 1024x1024. Draw the logo ONLY in the center horizontal band (full width, middle 35% height ~358px). Icon and text FILL this band; top and bottom solid background. One blue family (#1e40af to #2563eb), soft gradient. No glossy, metallic, or green. White or light background. Output: 1024x1024 PNG.
```

---

## 지령 2 — desktop-white.png

**저장 파일**: `desktop-white.png`  
**해상도**: **100 × 35 px**  
**확장자**: **PNG**

**생성할 것**: 다크 배경용 가로 로고. **아이콘·글꼴은 지령 1과 동일**(막대 그래프+상승 화살표 아이콘, "Betsurezone" B 대문자·소문자, 같은 산세리프). **1024×1024**, 가운데 가로 띠만 꽉 채우기. 아이콘·텍스트 흰색~밝은 회색, 배경 어두운 파란 또는 검정.

**▼ 프롬프트 (복사해서 사용):**

```
Same Betsurezone logo as desktop-logo: left = bar chart (4 vertical bars, increasing height) + curved lines forming upward arrow; right = "Betsurezone" (capital B, lowercase etsurezone), modern sans-serif medium to semi-bold. CRITICAL: Output 1024x1024. Logo ONLY in center horizontal band (full width, middle 35% height). Icon and text in white to light gray; dark blue or black background. Top and bottom solid dark. Output: 1024x1024 PNG.
```

---

## 지령 3 — desktop-dark.png

**저장 파일**: `desktop-dark.png`  
**해상도**: **100 × 35 px**  
**확장자**: **PNG**

**생성할 것**: 다크 테마용 가로 로고. **아이콘·글꼴 지령 1·2와 동일.** **1024×1024**, 가운데 가로 띠만 꽉 채우기. 다크 배경, 흰색~밝은 회색.

**▼ 프롬프트 (복사해서 사용):**

```
Same as desktop-white: bar chart + upward arrow icon left, "Betsurezone" (B capital, etsurezone lowercase) right, modern sans-serif. 1024x1024, logo only in center horizontal band. White or light gray, dark background. Output: 1024x1024 PNG.
```

---

## 지령 4 — toggle-logo.png

**저장 파일**: `toggle-logo.png`  
**해상도**: **36 × 36 px**  
**확장자**: **PNG**

**생성할 것**: 라이트용 **아이콘만** (글자 없음). **지령 1과 동일한 아이콘**—막대 그래프(세로 막대 4개, 높이 증가)+상승 화살표. 1024×1024, 프레임 꽉 채우기. 파란 한 계열, 광택·초록 금지.

**▼ 프롬프트 (복사해서 사용):**

```
Icon only, no text. SAME symbol as desktop logo: bar chart (4 vertical bars, height increasing left to right) + three curved lines forming upward-pointing arrow. Must FILL entire 1024x1024 frame edge to edge. Do NOT include "Betsurezone" or any letters. One blue family, soft gradient. No glossy, no green. White or transparent background. Output: 1024x1024 PNG.
```

---

## 지령 5 — toggle-white.png

**저장 파일**: `toggle-white.png`  
**해상도**: **36 × 36 px**  
**확장자**: **PNG**

**생성할 것**: 다크 배경용 **아이콘만**. **지령 4와 동일 아이콘**(막대 그래프+상승 화살표). 1024×1024, 프레임 꽉 채우기. 흰색~밝은 회색, 어두운 배경.

**▼ 프롬프트 (복사해서 사용):**

```
Icon only. Same symbol as toggle-logo: bar chart (4 bars, increasing height) + curved lines forming upward arrow. 1024x1024, fill frame. White to light gray. Dark blue or black background. No text. Output: 1024x1024 PNG.
```

---

## 지령 6 — toggle-dark.png

**저장 파일**: `toggle-dark.png`  
**해상도**: **36 × 36 px**  
**확장자**: **PNG**

**생성할 것**: 다크 테마용 **아이콘만**. **지령 4·5와 동일 아이콘.** 1024×1024, 프레임 꽉 채우기. 흰색~밝은 회색, 어두운 배경.

**▼ 프롬프트 (복사해서 사용):**

```
Icon only. Same symbol: bar chart + upward arrow. 1024x1024, fill frame. White or light gray, dark background. No text. Output: 1024x1024 PNG.
```

---

## 지령 7 — favicon.ico

**저장 파일**: `favicon.ico`  
**해상도**: **16 × 16 px**  
**확장자**: **ICO** (생성 시에는 16×16 PNG로 만든 뒤 ICO로 변환)

**생성할 것**: 브라우저 탭용 파비콘. **지령 4와 동일 아이콘**(막대 그래프+상승 화살표). 1024×1024, 프레임 꽉 채우기. 파란 한 계열, 단순하게.

**▼ 프롬프트 (복사해서 사용):**

```
Favicon. Same icon as toggle-logo: bar chart (4 vertical bars, increasing height) + curved lines forming upward arrow. No text. 1024x1024, fill frame. One blue family, simple. White or transparent background. Output: 1024x1024 PNG. (Resize to 16x16 and convert to .ico.)
```

---

## 파일 위치 (생성 후 저장·교체 시)

- **경로**: `Ynex-tailwind-ts-nextjs\public\assets\images\brand-logos` 또는 Staterkit `public/assets/images/brand-logos`
- **지령별 저장 (1지령 = 이미지 1개 = 파일 1개)**:

| 지령 | 저장 파일명       | 해상도   | 확장자 |
|------|-------------------|----------|--------|
| 1    | desktop-logo.png  | 100×35   | PNG    |
| 2    | desktop-white.png | 100×35   | PNG    |
| 3    | desktop-dark.png  | 100×35   | PNG    |
| 4    | toggle-logo.png   | 36×36    | PNG    |
| 5    | toggle-white.png  | 36×36    | PNG    |
| 6    | toggle-dark.png   | 36×36    | PNG    |
| 7    | favicon.ico       | 16×16    | ICO*   |

\* 지령 7은 16×16 PNG로 생성한 뒤 온라인 변환 도구 등으로 `.ico`로 변환해 `favicon.ico`로 저장.

---

## 특정 크기(100×35, 36×36 등)로 잘라 쓰는 방법

생성기가 1024×1024만 줄 때, 아래처럼 **크롭·리사이즈**해 최종 해상도에 맞춘다.

### 1. 가로 로고 → 100×35

- **목표**: desktop-logo, desktop-white, desktop-dark (가로 로고 3종).
- **원본**: 1024×1024. 로고는 **가운데 가로 띠**(세로 약 35% 높이)에만 그려져 있음.
- **방법 A — 이미지 편집기 (포토샵, GIMP, Photopea 등)**  
  1. 원본 1024×1024 열기.  
  2. **가운데 세로 358px 높이** 구간 선택: 위에서 (1024−358)/2 ≈ 333px 아래부터 358px. 가로는 전체 1024px.  
  3. 해당 영역만 크롭.  
  4. 이미지 크기 조절로 **100×35**로 리사이즈(비율 유지).  
- **방법 B — Node (sharp)**  
  - `sharp(input).extract({ left: 0, top: 333, width: 1024, height: 358 }).resize(100, 35).toFile('desktop-logo.png')`  
  - top 값은 “로고가 들어 있는 가로 띠”가 화면 중앙에 오도록 조정 (예: 320~340).
- **방법 C — CSS로 표시만**  
  - `<img>`에 `object-fit: cover; object-position: center; width: 100px; height: 35px;` 적용하면, 1024×1024 이미지에서 가운데 세로 띠가 잘려 보임. (실제 파일 크기는 그대로이므로, 용량이 중요하면 A/B로 미리 100×35 파일을 만드는 것이 좋음.)

### 2. 아이콘 → 36×36

- **목표**: toggle-logo, toggle-white, toggle-dark.
- **원본**: 1024×1024. 심볼이 프레임을 꽉 채운 정사각형.
- **방법**  
  - **리사이즈만** 하면 됨. 크롭 없이 1024×1024 → 36×36 비율 축소.  
  - 이미지 편집기: 이미지 크기 → 36×36.  
  - Node: `sharp(input).resize(36, 36).toFile('toggle-logo.png')`.  
  - CSS: `width: 36px; height: 36px; object-fit: contain;` (원본이 정사각형이면 비율 유지).

### 3. 파비콘 → 16×16 (및 ICO)

- **목표**: favicon.ico.
- **원본**: 1024×1024 아이콘.
- **방법**  
  1. 1024×1024 → **16×16** 리사이즈 (이미지 편집기 또는 sharp 등).  
  2. 16×16 PNG 저장.  
  3. 온라인 변환(예: favicon.io, convertio.co) 또는 `sharp` + ico 엔코딩으로 **.ico** 생성 후 `favicon.ico`로 저장.

### 요약 표

| 최종 용도       | 원본 (1024×1024)     | 작업                    | 결과 크기 |
|----------------|----------------------|-------------------------|-----------|
| desktop-* 로고 | 가로 띠에 로고 그린 것 | 가운데 세로 띠 크롭 후 리사이즈 | 100×35    |
| toggle-* 아이콘 | 프레임 꽉 채운 아이콘  | 리사이즈만              | 36×36     |
| favicon        | 프레임 꽉 채운 아이콘  | 리사이즈 → PNG → ICO    | 16×16     |

---

## Looka 용 지령 (looka.com)

Looka에서 로고 만들 때 아래 항목대로 입력·선택하면 Betsurezone 브랜드에 맞게 나옵니다. **공통 참고**의 색상·촌스러움 방지·캔버스 채우기 규칙은 동일하게 적용하세요.

### 1. 브랜드 이름
- **Company name / Brand name**: **Betsurezone** (대소문자 그대로)

### 2. 업종·산업
- **Industry**: **Finance & Banking** 또는 **Technology** 또는 **Data & Analytics**  
- 없으면 **Business & Consulting** 등 전문 서비스에 가까운 것 선택.  
- 스포츠/베팅만 강조하는 카테고리보다는 **금융·테크·데이터** 느낌이 나는 쪽 선택.

### 3. 로고 스타일 (선호하는 것 고를 때)
- **선택 권장**: Modern, Professional, Trustworthy, Clean, Minimal (단, 너무 빈약한 미니멀은 X)  
- **기피**: Playful, Retro, Glossy, Luxury(과한 금색/메탈)

### 4. 심볼·아이콘 선호
- **고르면 좋은 것**: Chart / Graph, Upward trend / Arrow up, Shield, Checkmark, Abstract geometric (수렴하는 선·데이터 느낌)  
- **의도**: 슈어벳·밸류벳·배당·실행 가능 기회를 연상시키는 아이콘.  
- **피할 것**: 공·트로피 등 스포츠만 강조하는 아이콘만 있는 조합.

### 5. 색상
- **Primary color**: **파란 한 계열**만. (Looka에서 Blue 팔레트 선택 후, **한 가지 블루 톤** 또는 **진한 파란↔밝은 파란**만 쓰는 옵션 선택.)  
- **Avoid**: 밝은 초록(Lime), 에메랄드, 청록을 메인으로 쓰는 조합. 파란+초록 동시 강조 금지.  
- **다크 배경용**은 나중에 에디터에서 배경을 어두운 색으로 바꾸고, 로고는 흰색/밝은 회색으로 조정.

### 6. Looka 결과물로 파일 만들 때
- **가로 로고**(아이콘 + "Betsurezone") → **100×35 px**로 리사이즈·크롭해 `desktop-logo.png`, `desktop-white.png`, `desktop-dark.png` 저장. **로고가 프레임을 꽉 채우도록** 여백 최소로 크롭.
- **아이콘만** 추출(또는 아이콘만 있는 버전 선택) → **36×36 px**로 저장해 `toggle-logo.png`, `toggle-white.png`, `toggle-dark.png` 사용.
- **파비콘**은 아이콘을 **16×16 px**로 리사이즈한 뒤 `.ico`로 변환해 `favicon.ico`로 저장.

### 7. 한 줄 요약 (Looka 설명란에 넣을 때)
- **영문**: `Quant-grade surebet and valuebet odds analysis platform. Professional, data-driven, one blue color family, no glossy.`
- **한글**: 퀀트급 슈어벳·밸류벳 분석 플랫폼. 전문적, 데이터 기반, 파란 한 계열, 광택 없음.

---

## 체크리스트 (생성 후 확인)

- [ ] **촌스러움·색상 조화**: 광택·메탈릭 없나? 파란 한 계열로 통일되어 있나? 밝은 초록/라임이 과하게 쓰이지 않았나?
- [ ] **단순·섬뜩함 방지**: 단일 플랫 색이 아닌가? (파란 계열 내) 은은한 톤 변화가 있는가?
- [ ] **브랜드 상징**: 심볼이 슈어벳·밸류벳·배당·실행 가능 기회 등 서비스를 연상시키는가?
- [ ] 로고: "Betsurezone" 텍스트가 굵기·개성 있고, 아이콘과 가로로 자연스럽게 붙어 있는가?
- [ ] 아이콘: 32×32에서도 선명하고, 지령 1 로고의 심볼과 콘셉트가 통일되어 있는가?
- [ ] 라이트/다크 버전 모두에서 대비·가독성이 충분한가?
- [ ] 전반적으로 “사이트를 대표하는 프리미엄 브랜드” 느낌이 나는가?

---

**요약**: 지령 1~7을 **한 번에 하나씩** 실행해, 각각 지정된 **해상도·확장자**로 저장하세요. desktop-* 는 100×35 PNG, toggle-* 는 36×36 PNG, favicon은 16×16 PNG 생성 후 ICO로 변환해 `favicon.ico`로 저장. 모두 `brand-logos` 폴더에 넣으면 됩니다.
