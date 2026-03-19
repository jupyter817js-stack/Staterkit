# 구독 관련 – 프론트엔드(Next.js) 현황 및 가이드

프론트와 백엔드(.NET)를 완전 분리한 구조에서, **구독 관련 프론트 측**의 진행 상황, 동작 방식, 필요한 설정, 할 일을 정리한 문서입니다.

---

## 1. 현재 프론트 진행·동작 상태

### 1.1 구현된 것

| 구분 | 내용 |
|------|------|
| **타입·권한** | `shared/types/subscription.ts` – 구독 등급(STANDARD/PRO), Entitlements, 플랜별 매핑. `shared/types/users.ts` – `CurrentUser.subscription_plan` |
| **권한 훅** | `shared/hooks/useEntitlements.ts` – `useEntitlements(currentUser)`, `useIsPro(currentUser)`. 최고관리자(SUPER_ADMIN)는 구독 없이 PRO 권한 |
| **API 호출** | `shared/api/nowpayments.ts` – **백엔드** `POST /api/v1/payments/create`, `POST /api/v1/subscriptions/create` 호출(인증 헤더 포함). Next.js 쪽 NOWPayments API 라우트 없음 |
| **결제 관리 페이지** | `pages/payments.tsx` – 최고관리자 전용. 금액·통화·결제통화·설명 입력 후 "결제 링크 생성" → 백엔드 호출 → 응답의 `pay_url` 등 표시 |
| **구독 플랜 페이지** | `pages/subscription.tsx` – Standard/Pro 카드, "구독 시작" → 백엔드 `subscriptions/create` 호출, 이메일로 결제 링크 발송 안내 |
| **UI 규칙** | 라이브 탭: STANDARD는 비활성+클릭 시 업그레이드 모달. API 메뉴: PRO(또는 최고관리자)만 표시. 저지연 배지: PRO만. `pages/components/subscription/UpgradeModal.tsx` |
| **API 페이지** | `pages/api.tsx` – PRO만 내용 표시, 비-PRO는 업그레이드 유도 |

### 1.2 프론트에서 제거된 것 (백엔드로 이전)

- ~~`pages/api/nowpayments/create-payment.ts`~~ → 백엔드에서 결제 생성
- ~~`pages/api/nowpayments/create-subscription.ts`~~ → 백엔드에서 구독 생성
- ~~`pages/api/nowpayments/subscription-plan.ts`~~ → 백엔드에서 플랜 생성/관리
- ~~`pages/api/nowpayments/ipn.ts`~~ → 백엔드에서 IPN 수신·구독 갱신

프론트에는 **NOWPayments API 키·IPN·플랜 ID** 등 설정 없음. 모두 백엔드(.NET)에서 처리합니다.

### 1.3 동작 흐름 (백엔드 연동 기준)

1. **인증**  
   `GET {NEXT_PUBLIC_API_URL}/api/v1/auth/me` → 응답에 `subscription_plan` (`"STANDARD"` \| `"PRO"` \| null) 포함되어야 함.
2. **결제 링크 생성(관리자)**  
   결제 관리 페이지에서 "결제 링크 생성" → 프론트가 `POST {API}/api/v1/payments/create` 호출 → 백엔드가 NOWPayments 연동 후 `pay_url` 등 반환 → 프론트가 표시.
3. **구독 시작**  
   구독 페이지에서 플랜 선택 후 "구독 시작" → 프론트가 `POST {API}/api/v1/subscriptions/create` 호출(plan, email) → 백엔드가 NOWPayments 구독 생성·이메일 발송 → 프론트는 성공 메시지 표시.
4. **권한·UI**  
   `auth/me`의 `subscription_plan`(및 level=SUPER_ADMIN)으로 `useEntitlements`/`useIsPro` 계산 → 라이브 탭·API 메뉴·배지·업그레이드 모달 표시.

---

## 2. 프론트 필요한 설정 (백엔드 연동용)

| 설정 | 필수 여부 | 설명 |
|------|-----------|------|
| **NEXT_PUBLIC_API_URL** | **필수** | 백엔드(.NET) 기준 URL. 예: `https://api.yourdomain.com` 또는 `http://localhost:5000`. 결제/구독·인증·데이터 API 모두 이 주소로 호출. |

그 외 NOWPayments 관련 환경 변수는 **프론트에 두지 않음**. `.env.example`에는 백엔드용이라고만 안내해 두었음.

---

## 3. 프론트가 기대하는 백엔드 API (연동 계약)

아래를 백엔드에서 제공해야 프론트 현재 구현이 그대로 동작합니다.

### 3.1 GET /api/v1/auth/me

- **응답**에 `subscription_plan` 포함: `"STANDARD"` \| `"PRO"` \| `null` (또는 생략 시 STANDARD로 간주).
- 프론트는 동일하게 `id`, `email`, `firstname`, `lastname`, `level` 등 기존 auth/me 스펙 유지 가정.

### 3.2 POST /api/v1/payments/create

- **역할:** 1회성 결제 링크 생성(관리자용).
- **인증:** 필요(동일 Authorization 헤더).
- **Request Body (JSON):**  
  `price_amount` (필수), `price_currency` (선택, 기본 "usd"), `pay_currency` (선택), `order_id` (선택), `order_description` (선택).
- **Response:**  
  NOWPayments 결제 생성 응답과 호환되는 JSON. 최소 `pay_url`, `pay_address`, `pay_amount`, `pay_currency`, `order_id` 등이 있으면 됨.

### 3.3 POST /api/v1/subscriptions/create

- **역할:** 구독 생성(결제 링크 이메일 발송).
- **인증:** 필요.
- **Request Body (JSON):**  
  `plan`: `"STANDARD"` \| `"PRO"`, `email`: string (해당 유저 이메일).
- **Response:**  
  성공 시 2xx + 본문은 자유(프론트는 성공만 판단). 실패 시 4xx/5xx + `error` 또는 `message` 등 메시지 필드 있으면 프론트에서 표시 가능.

---

## 4. 프론트에서 추가로 할 일 (반영 완료)

- **에러 메시지:** 결제/구독 API 호출 시 `redirectOnError: false`로 백엔드 응답 본문을 읽고, `error` / `message` 및 중첩 JSON 문자열을 파싱해 화면에 표시. `shared/api/nowpayments.ts`의 `getErrorMessage()` 사용.
- **결제 관리 페이지 권한:** `SUPER_ADMIN` 또는 `ADMIN`이면 접근 가능. 백엔드 role과 맞춰 조정 가능.
- **구독 페이지:** 비로그인 시 플랜 카드 대신 "로그인 후 구독할 수 있습니다" 안내 + 로그인 버튼(`/login`) 표시. 로그인 시에만 플랜 선택 가능하며, `currentUser.email`로 구독 생성 요청.

---

## 5. 문서 참고

- **백엔드 구현·NOWPayments·IPN·권한 검증:** `docs/BACKEND_SUBSCRIPTION.md` (.NET 백엔드용).
- 구독 플랜 ID 발급·플랜 생성은 모두 **백엔드**에서 수행하며, 해당 절차는 백엔드 문서에 정리됨.
