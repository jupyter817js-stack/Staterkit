# 새 암호화폐 결제 시스템 — 프론트엔드 변경사항

`docs/requirement_payment/crypto_payment_openapi.yaml` 기준으로 새 결제 시스템의 프론트엔드 구현 현황 및 할 일을 정리한 문서입니다.

**통신 방식 요구사항:** 프론트엔드와 메인 백엔드 간 통신은 **Rsignal**을 사용해야 합니다.

---

## 1. 요구사항 요약 (OpenAPI 기준)

| API | 메서드 | 경로 | 역할 |
|-----|--------|------|------|
| 플랜 목록 | GET | `/api/v1/plans` | 구독 플랜 목록 조회 |
| 구독 인보이스 생성 | POST | `/api/v1/subscription/create` | currency, network, planId, userId로 인보이스 생성 |
| 결제 인보이스 생성 | POST | `/payment/api/v1/invoice` | (상세 스펙 미정) |
| 인보이스 상태 | GET | `/payment/api/v1/invoice/{id}` | 인보이스 상태 조회 |

**기존 NOWPayments와의 차이:**
- 기존: `plan`(STANDARD/PRO) + `email` → 이메일로 결제 링크 발송
- 신규: `planId` + `currency` + `network` + `userId` → 인보이스 생성 후 결제 URL 반환

---

## 2. 완료된 프론트엔드 작업

### 2.1 API 클라이언트

| 파일 | 내용 |
|------|------|
| `shared/api/crypto-payment.ts` | `getPlans()`, `createSubscriptionInvoice()`, `getInvoiceStatus()`, `getPaymentUrl()`, `getInvoiceId()` |
| `shared/types/crypto-payment.ts` | `SubscriptionPlan`, `CreateSubscriptionParams`, `CreateSubscriptionResponse`, `InvoiceStatus` 타입 |

### 2.2 UI 컴포넌트

| 파일 | 내용 |
|------|------|
| `pages/components/subscription/CryptoSubscriptionModal.tsx` | 플랜 선택, 통화/네트워크 선택, 인보이스 생성, 결제 URL 새 탭 오픈 |

**CryptoSubscriptionModal 사용 예:**
```tsx
<CryptoSubscriptionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  preselectedPlanType="PRO"
  onSuccess={() => { /* 구독 생성 성공 시 */ }}
/>
```

### 2.3 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 메인 API (플랜, 구독 생성) |
| `NEXT_PUBLIC_PAYMENT_API_URL` | (선택) 결제 서비스가 다른 도메인일 때. 없으면 `NEXT_PUBLIC_API_URL` 사용 |
| `NEXT_PUBLIC_PAYMENT_PAGE_PATH` | (선택) payUrl 미반환 시 결제 페이지 경로. `{invoiceId}` 치환. 기본: `/payment/invoice/{invoiceId}` |

---

## 3. 남은 작업 (해야 할 것)

### 3.0 Rsignal 연동 (우선)

- [ ] **프론트 ↔ 메인 백엔드 통신을 Rsignal로 전환**  
  - 현재: REST API (`fetch` + `NEXT_PUBLIC_API_URL`)  
  - 요구: Rsignal 기반 통신으로 변경  
  - 적용 범위: 결제/구독 API뿐 아니라 valuebets, surebets, auth 등 전체 API 호출

### 3.1 랜딩/구독 페이지 연동

- [x] **랜딩 페이지 `#pricing` 섹션**  
  - 완료: `handlePricingSubscribe` → `CryptoSubscriptionModal` 오픈 (Standard/Pro 버튼 클릭 시)  
  - NOWPayments 제거됨

- [ ] **구독 전용 페이지**  
  - `pages/subscription.page.tsx`는 현재 `/#pricing`으로 리다이렉트  
  - 필요 시: `/subscription`에서 `CryptoSubscriptionModal` 또는 전용 결제 UI 제공

### 3.2 인보이스 상태 폴링 / SignalR

- [x] **결제 완료 감지**  
  - SignalR Hub `/api/hubs/payment` 연결, `PaymentConfirmed` 이벤트 수신  
  - SignalR 실패 시 `SubscriptionPaymentPoller`가 `getInvoiceStatus` 폴링 (12초 간격)  
  - `status === "finished"` 시 `getCurrentUser()` 재조회 → 구독 상태 갱신

- [ ] **인보이스 만료/실패 처리**  
  - `expired`, `failed` 시 사용자 안내 및 모달/UI 업데이트

### 3.3 통화/네트워크 옵션

- [ ] **백엔드 API 연동**  
  - 현재: `CURRENCY_OPTIONS` 하드코딩 (USDT TRON/TRC20, USDT POLYGON)  
  - 개선: `GET /api/v1/currencies` 또는 플랜 응답에 `supportedCurrencies` 포함 시 동적 로딩

### 3.4 플랜 매핑

- [ ] **STANDARD/PRO ↔ planId**  
  - `getPlans()` 응답의 `planType` 또는 `name`으로 매핑  
  - 랜딩 카드(Standard $89, Pro $199)와 API 플랜 id 연결

### 3.5 NOWPayments 제거 (완료)

- [x] `shared/api/nowpayments.ts` 삭제
- [x] `shared/types/nowpayments.ts` 삭제
- [x] 랜딩 페이지 `createSubscription`, `getSubscriptionPaymentUrl` 제거
- [x] 이메일 발송 안내 UI 및 번역 제거

---

## 4. 백엔드 연동 체크리스트

프론트가 정상 동작하려면 백엔드에서 다음을 제공해야 합니다.

- [ ] **GET /api/v1/plans**  
  - 응답: `{ plans: [{ id, name?, planType?, priceAmount?, priceCurrency? }] }` 또는 `[{ id, ... }]`

- [ ] **POST /api/v1/subscription/create**  
  - Request: `{ planId, currency, network, userId }`  
  - Response: `{ success, data: { invoiceId, address?, payUrl?, ... } }` 또는 `{ payUrl, invoiceId }`  
  - `payUrl` 없으면 프론트가 `{API_BASE}/payment/invoice/{invoiceId}` 사용 (NEXT_PUBLIC_PAYMENT_PAGE_PATH로 변경 가능)

- [ ] **GET /payment/api/v1/invoice/{id}**  
  - Response: `{ id, status, pay_url?, pay_address?, pay_amount?, pay_currency?, network?, expires_at? }`  
  - `status`: `pending` | `waiting` | `confirming` | `finished` | `failed` | `expired`

---

## 5. 파일 구조

```
shared/
  api/
    crypto-payment.ts    # 암호화폐 결제 API 클라이언트
  types/
    crypto-payment.ts   # 결제 관련 타입

pages/
  components/
    pages/
      landing.tsx       # CryptoSubscriptionModal 연동 (Standard/Pro 버튼)
    subscription/
      CryptoSubscriptionModal.tsx  # 플랜/통화 선택, 인보이스 생성
      SubscriptionPaymentPoller.tsx # SignalR 실패 시 인보이스 폴링 폴백
```

---

## 6. 참고 문서

- `docs/requirement_payment/crypto_payment_openapi.yaml` — API 스펙
- `docs/FRONTEND_SUBSCRIPTION.md` — 기존 구독 프론트 현황
- `docs/PAYMENT_BACKEND_API.md` — 기존 결제 API (NOWPayments)
