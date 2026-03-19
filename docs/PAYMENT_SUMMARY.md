# 결제·구독 관련 진행사항 정리

현재까지 한 작업, 구현된 기능, 이후에 할 일을 한 문서로 정리한 요약입니다.

---

## 1. 무얼 했는지 (진행한 작업)

| 구분 | 내용 |
|------|------|
| **결제 연동** | NOWPayments 기준으로 1회성 결제 링크 생성 플로우 구성. 초기에는 Next.js API 라우트에서 처리하다가, **프론트/백엔드 완전 분리** 후에는 **백엔드(.NET) 전담**으로 이전함. |
| **구독 모델 정의** | Standard($79~$99/월), Pro($199/월) 2단계. `shared/types/subscription.ts`에 구독 등급, Entitlements, 플랜별 권한 매핑 정의. |
| **권한 구조** | `shared/types/users.ts`에 `CurrentUser.subscription_plan` 추가. `useEntitlements`, `useIsPro` 훅으로 화면·기능 제어. **최고관리자(SUPER_ADMIN)** 는 구독 없이 PRO와 동일 권한. |
| **프론트/백엔드 분리** | Next.js의 `pages/api/nowpayments/*`(create-payment, create-subscription, subscription-plan, ipn) **전부 제거**. 결제·구독·IPN·플랜 관리는 **백엔드만** 담당. 프론트는 백엔드 `POST /api/v1/payments/create`, `POST /api/v1/subscriptions/create` 호출. |
| **결제 관리 페이지** | `pages/payments.tsx`. 관리자(SUPER_ADMIN/ADMIN) 전용. 금액·통화·결제통화·설명 입력 → 백엔드 호출 → `pay_url` 등 표시. |
| **구독 플랜 페이지** | `pages/subscription.tsx`. Standard/Pro 카드, "구독 시작" → 백엔드 구독 생성·이메일 발송. 비로그인 시 "로그인 후 구독 가능" 안내 + 로그인 버튼. |
| **UI 규칙** | 라이브 탭: STANDARD는 비활성 + 클릭 시 업그레이드 모달. API 메뉴: PRO(또는 최고관리자)만 표시. Surebet 헤더에 "Low Latency" 배지(PRO만). `UpgradeModal`, `pages/api.tsx`(API 메뉴 진입 시 PRO만 내용 표시). |
| **에러·권한 처리** | 백엔드 `error`/`message`(및 중첩 JSON) 파싱해 화면에 표시. 결제/구독 API는 `redirectOnError: false`로 본문 읽어 메시지 추출. |
| **문서화** | `FRONTEND_SUBSCRIPTION.md`(프론트 현황·설정·기대 API), `BACKEND_SUBSCRIPTION.md`(.NET 백엔드 구현·설정·IPN·권한), `SUBSCRIPTION_PLAN_SETUP.md`(플랜 ID는 백엔드에서 발급). |

---

## 2. 구현된 기능

### 2.1 프론트(Next.js)

- **결제 링크 생성(관리자)**  
  결제 관리 페이지에서 금액/통화/결제통화/설명 입력 → 백엔드 `POST /api/v1/payments/create` 호출 → 응답의 `pay_url`, `pay_address`, `pay_amount` 등 표시.
- **구독 시작**  
  구독 페이지에서 Standard 또는 Pro 선택 → 백엔드 `POST /api/v1/subscriptions/create` (Plan, Email) 호출 → "결제 링크가 이메일로 발송됩니다" 안내.
- **구독 기반 권한·UI**  
  - auth/me의 `subscription_plan` + level(SUPER_ADMIN)으로 Entitlements 계산.  
  - 라이브 탭 비활성/업그레이드 유도, API 메뉴 노출, Low Latency 배지, 업그레이드 모달, API 전용 페이지 접근 제어.
- **비로그인 구독 페이지**  
  로그인 전에는 플랜 카드 대신 "로그인 후 구독할 수 있습니다" + 로그인 버튼만 표시.

### 2.2 백엔드(.NET) – 프론트가 기대하는 것

- **GET /api/v1/auth/me**  
  응답에 `subscription_plan` (`"STANDARD"` \| `"PRO"` \| null) 포함.
- **POST /api/v1/payments/create**  
  인증 필수. body: price_amount, price_currency, pay_currency, order_description 등. NOWPayments 결제 생성 후 pay_url 등 반환.
- **POST /api/v1/subscriptions/create**  
  인증 필수. body: Plan, Email (또는 plan, email). NOWPayments 구독 생성 후 고객 이메일로 결제 링크 발송.

(실제 NOWPayments 호출·IPN·DB 갱신은 백엔드 구현 문서 참고.)

---

## 3. 해야 할 것 (나중에 마저 완성할 부분)

### 3.1 백엔드(.NET)

- [ ] **환경 설정**  
  NOWPayments API Key, IPN Secret, `NOWPAYMENTS_PLAN_STANDARD_ID`, `NOWPAYMENTS_PLAN_PRO_ID` 설정.  
  IPN Callback URL을 백엔드 웹훅 URL로 등록.
- [ ] **플랜 생성**  
  NOWPayments에 Standard/Pro 플랜 한 번씩 생성 후, 응답 plan id를 위 환경 변수에 반영. (절차: `BACKEND_SUBSCRIPTION.md` §5.)
- [ ] **IPN 웹훅**  
  결제/구독 성공 시 유저의 `subscription_plan`(및 만료일) DB 갱신.
- [ ] **데이터 API 권한**  
  surebets/search 등에서 STANDARD일 때 라이브 제한, API 전용 기능은 PRO(또는 최고관리자)만 허용 등. (상세: `BACKEND_SUBSCRIPTION.md` §8.)

### 3.2 결제 플로우 보완 (추후)

- [ ] **결제 완료/실패 화면**  
  결제 링크에서 결제 후 돌아오는 success/cancel URL 페이지(또는 안내)가 있으면 UX 정리 가능.
- [ ] **구독 갱신/해지**  
  만료 전 갱신, 구독 해지 버튼·플로우는 현재 미구현. 필요 시 백엔드 API + 프론트 UI 추가.
- [ ] **결제·구독 이력 조회**  
  관리자/유저용 “결제 내역”, “내 구독” 목록·상세는 미구현. 필요 시 백엔드 API + 프론트 페이지 추가.
- [ ] **환불/출금**  
  정책 확정 후 백엔드·프론트에 반영.

### 3.3 문서

- 상세 스펙·설정: **`docs/FRONTEND_SUBSCRIPTION.md`**, **`docs/BACKEND_SUBSCRIPTION.md`**  
- 플랜 ID 발급: **`docs/SUBSCRIPTION_PLAN_SETUP.md`** (백엔드에서 수행한다는 안내 포함)

---

## 4. 한 줄 요약

- **한 것:** NOWPayments 기준 1회 결제 + Standard/Pro 구독 플로우를 프론트/백엔드 분리 구조로 설계·구현했고, 구독 권한(Entitlements)·UI(라이브/API 메뉴/배지/업그레이드 모달)까지 반영함. 결제·구독·IPN·플랜은 백엔드 전담.
- **할 것:** 백엔드에서 NOWPayments 설정·플랜 ID·IPN·권한 검증 완료 후, 필요 시 결제 완료/갱신/해지/이력/환불 등 플로우를 단계적으로 추가.
