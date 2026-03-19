# 구독 관련 – 백엔드(.NET) 구현 가이드

프론트(Next.js)와 완전 분리된 구조에서, **구독·결제는 모두 백엔드(.NET)**에서 담당합니다.  
아래는 현재 프론트 동작에 맞추기 위해 백엔드에서 구현·설정해야 할 내용입니다.

---

## 1. 개요

- **NOWPayments** 연동(결제 생성, 구독 플랜 생성, 구독 생성, IPN 수신)은 전부 **백엔드**에서 수행.
- 프론트는 **인증(auth/me)** 과 **두 개의 API(payments/create, subscriptions/create)** 만 호출합니다.
- 구독 등급(`subscription_plan`)과 만료는 백엔드 DB에 두고, IPN 수신 시 갱신합니다.

---

## 2. 필수 설정 (환경 변수 / 설정 파일)

| 설정 | 설명 |
|------|------|
| **NOWPayments API Key** | NOWPayments 대시보드에서 발급. 결제/구독/플랜 생성 시 `x-api-key` 로 사용. |
| **NOWPayments IPN Secret** | IPN 콜백 서명 검증용. 대시보드에서 IPN URL 설정 후 시크릿 입력. |
| **NOWPAYMENTS_PLAN_STANDARD_ID** | 구독 플랜 "Standard" 생성 후 응답으로 받은 plan id (숫자). |
| **NOWPAYMENTS_PLAN_PRO_ID** | 구독 플랜 "Pro" 생성 후 응답으로 받은 plan id (숫자). |

- **IPN Callback URL** 은 백엔드 공개 URL로 설정. 예: `https://your-api.com/api/v1/webhooks/nowpayments-ipn`  
- 플랜 생성은 아래 "5. 구독 플랜 생성" 참고.

---

## 3. 인증 응답에 subscription_plan 포함

**엔드포인트:** `GET /api/v1/auth/me` (또는 기존 현재 유저 정보 API)

**응답에 포함할 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `subscription_plan` | `"STANDARD"` \| `"PRO"` \| `null` | 구독 등급. 미구독이면 `null`. |

- 프론트는 이 값으로 UI(라이브 탭, API 메뉴, 저지연 배지, 업그레이드 모달) 및 권한을 제어합니다.
- **최고관리자(level = SUPER_ADMIN, 예: 0)** 는 `subscription_plan` 값과 관계없이 **PRO와 동일한 권한**으로 처리해야 합니다. (프론트에서도 동일 규칙 적용)

**예시 응답 (camelCase):**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstname": "FirstName",
  "lastname": "LastName",
  "level": 3,
  "subscription_plan": "PRO"
}
```

---

## 4. 프론트가 호출하는 API (백엔드 구현 필수)

### 4.1 POST /api/v1/payments/create

- **역할:** 1회성 결제 링크 생성(관리자용). 백엔드가 NOWPayments `POST /v1/payment` 호출 후 결과를 그대로(또는 필요한 필드만) 반환.
- **인증:** 필요 (기존 Authorization 헤더).
- **Request Body (JSON):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `price_amount` | number | ✅ | 결제 금액 |
| `price_currency` | string | | 기본 "usd" |
| `pay_currency` | string | | 암호화폐. 예: "btc" (NOWPayments에서 필수일 수 있음) |
| `order_id` | string | | 없으면 백엔드에서 생성 |
| `order_description` | string | | 설명 |

- **Response:**  
  NOWPayments 결제 생성 응답과 호환. 최소 `pay_url`, `pay_address`, `pay_amount`, `pay_currency`, `order_id` 등 포함.
- **에러:** 4xx/5xx + 본문에 `error` 또는 `message` 포함 시 프론트에서 표시 가능.

### 4.2 POST /api/v1/subscriptions/create

- **역할:** 구독 생성. 백엔드가 NOWPayments `POST /v1/subscriptions` 호출 (subscription_plan_id, customer_email) → NOWPayments가 **고객 이메일로 결제 링크 발송**. (현재 NOWPayments API는 이메일 발송만 지원하며, 응답에 결제 URL을 포함하지 않음.)
- **인증:** 필요.
- **Request Body (JSON):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `plan` | string | ✅ | `"STANDARD"` \| `"PRO"` |
| `email` | string | ✅ | 결제 링크를 받을 고객 이메일 |

- **로직:**  
  - `plan`에 따라 `NOWPAYMENTS_PLAN_STANDARD_ID` 또는 `NOWPAYMENTS_PLAN_PRO_ID` 사용.  
  - `POST https://api.nowpayments.io/v1/subscriptions`  
    Body: `{ "subscription_plan_id": <id>, "customer_email": "<email>" }`  
    Header: `x-api-key`, `Content-Type: application/json`  
  - 성공 시 백엔드는 아래 **응답 형식**을 준수해 반환. (결제 URL을 별도로 얻을 수 있으면 `subscription_link` 등에 넣어 주면 프론트에서 새 탭으로 연다.)
- **Response (공통 형식):**

  **성공 시 (2xx):**
  ```json
  {
    "success": true,
    "message": "Subscription created. Payment link sent to email."
  }
  ```
  - `success`: boolean, `true` 필수.
  - `message`: string, 사용자/로그용 안내 문구.
  - **(선택)** `subscription_link`: string. 결제 페이지 URL을 넣으면 프론트가 새 탭으로 연다. 없으면 프론트는 "이메일로 발송되었습니다" 안내만 표시.

  **선택 필드 (URL이 있을 때만):**  
  `subscription_link` | `pay_url` | `payment_url` | `invoice_url` | `payment_link` | `invoice_link` | `link` | `url` 중 하나를 넣으면 프론트에서 해당 URL을 새 탭으로 연다.

  **실패 시 (4xx/5xx):**
  ```json
  {
    "success": false,
    "message": "에러 설명",
    "error": "에러 상세(선택)"
  }
  ```
  또는 `error` / `message` 등 프론트가 파싱 가능한 형태.
- **에러 예:**  
  - plan ID 미설정 → 503 + "Subscription plan not configured" 등.

### 4.3 GET /api/v1/payments/history (결제 이력 목록)

- **역할:** 관리자용 결제 이력 조회. 프론트 "결제 이력 관리" 페이지에서 호출.
- **인증:** 필요 (Authorization). **권한:** 관리자(SUPER_ADMIN/ADMIN)만 허용 권장.
- **Method:** GET
- **Query (선택):**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `email` | string | 이메일 부분 검색(해당 유저 결제만) |
| `date_from` | string | 조회 시작일 (YYYY-MM-DD) |
| `date_to` | string | 조회 종료일 (YYYY-MM-DD) |
| `plan` | string | 플랜 필터: STANDARD \| PRO |
| `per_page` | number | 페이지당 건수 (기본 10) |
| `page` | number | 페이지 번호 (1부터) |

- **Response (200):**

```json
{
  "items": [
    {
      "id": "결제/구독 ID",
      "email": "user@example.com",
      "plan": "PRO",
      "payment_amount": 89,
      "payment_date": "2025-02-01T00:00:00Z",
      "expiry_date": "2025-03-01",
      "status": "finished"
    }
  ],
  "total": 100
}
```

- **응답 필드 (각 item):**  
  `id`, `email`, `plan`, `payment_amount`(또는 `amount`), `payment_date`(또는 `paymentDate`, `created_at`), `expiry_date`(또는 `expiryDate`, `subscription_end_at`), `status`  
  프론트는 snake_case/camelCase 모두 매핑합니다.
- **미구현 시:** 프론트는 4xx/5xx 또는 예외 시 빈 목록(`items: []`)으로 처리해 에러 없이 "조회 결과가 없습니다"만 표시합니다. 백엔드 구현 후 위 형식으로 응답하면 바로 연동됩니다.

---

## 4.4 참고: NOWPayments 구독(이메일) API 응답

공식 문서([Recurring Payments API](https://nowpayments.io/blog/recurring-payments-api)) 기준으로:

- **POST https://api.nowpayments.io/v1/subscriptions**  
  - 요청: `subscription_plan_id`, `customer_email`  
  - 설명: "**payment links will be sent** to customers **via email**"  
  - 즉, **이메일로 결제 링크를 보내는 용도**로 문서화되어 있으며, **응답 본문에 invoice URL이 포함된다는 설명은 없음.**

따라서 **이메일 구독 생성만으로는 응답에서 결제 URL을 직접 받기 어렵다**고 보는 것이 맞습니다.  
백엔드에서 `subscription_link`를 내려주려면 예를 들어:

- NOWPayments 최신 API/Postman 문서에서 구독 생성 응답 스키마를 다시 확인하거나,
- 구독 생성 후 반환되는 `subscription_id` 등으로 결제/인보이스 URL을 조회하는 **별도 API**(예: GET subscription by id)가 있다면 해당 URL을 조회해 `subscription_link`로 내려주거나,
- 지원 문의([NOWPayments](https://nowpayments.io/))로 “구독 생성 시 응답에 결제 페이지 URL 포함 여부”를 확인하는 방법을 고려할 수 있습니다.

백엔드는 성공 시 `success` + `message`만 반환하면 되며, 프론트는 이메일 발송 안내와 수신 주소를 표시합니다. 나중에 URL을 넣을 수 있으면 `subscription_link` 등을 추가해 주면 프론트에서 새 탭으로 엽니다.

---

## 5. 구독 플랜 생성 (Standard / Pro 한 번만)

구독을 쓰려면 NOWPayments에 플랜을 먼저 만들어 두고, 응답의 **plan id**를 설정에 넣어야 합니다.

- **NOWPayments API:**  
  `POST https://api.nowpayments.io/v1/subscriptions/plans`  
  Header: `x-api-key`, `Content-Type: application/json`  
  Body 예시:

```json
{
  "title": "Standard",
  "interval_day": 30,
  "amount": 89,
  "currency": "usd"
}
```

- **Standard:** amount 79~99 중 선택 (예: 89).  
- **Pro:**  
  동일 API로 한 번 더 호출:  
  `"title": "Pro"`, `"amount": 199`, `"interval_day": 30`, `"currency": "usd"`.

응답에 포함된 **plan id**(필드명은 `id` 또는 `plan_id` 등 NOWPayments 문서 참고)를 각각 환경 변수 `NOWPAYMENTS_PLAN_STANDARD_ID`, `NOWPAYMENTS_PLAN_PRO_ID`에 넣습니다.

- 이 호출은 **백엔드에서** 스크립트/관리자 API/콘솔 앱 등으로 한 번씩만 수행하면 됩니다. (프론트에는 해당 API 없음.)

---

## 6. IPN(결제 알림) 웹훅

- **URL:** 백엔드 공개 URL. 예: `POST https://your-api.com/api/v1/webhooks/nowpayments-ipn`
- **NOWPayments 대시보드**에서 IPN Callback URL을 위 주소로 설정.
- **처리 순서:**  
  1. `x-nowpayments-sig` 헤더로 서명 검증 (HMAC-SHA512, IPN Secret 사용).  
  2. 본문에서 `payment_status`, `order_id`, (구독이면) `subscription_plan_id`, `customer_email` 등 파싱.  
  3. 결제/구독 성공 시 해당 유저의 `subscription_plan` 및 만료일(`subscription_end_at` 등)을 DB에 갱신.

이렇게 하면 결제 완료 후 auth/me에 `subscription_plan`이 반영되고, 프론트는 별도 처리 없이 동작합니다.

---

## 7. DB/스키마

- **최소:** 유저별 `subscription_plan` (enum 또는 string: `STANDARD`, `PRO`, null).
- **권장:** `subscription_start_at`, `subscription_end_at` (또는 `current_period_end`) – 갱신/해지 시 업데이트.

---

## 8. 데이터 API 권한 검증 (Entitlement)

모든 데이터 요청에서 구독(및 최고관리자 예외)을 적용하는 것을 권장합니다.

**예외:**  
- **최고관리자(level = SUPER_ADMIN)** 는 구독 없이 **PRO와 동일 권한**.

**플랜별 권한 요약:**

| 항목 | STANDARD | PRO |
|------|----------|-----|
| access_prematch | ✅ | ✅ |
| access_live | ❌ | ✅ |
| access_valuebet | ✅ | ✅ |
| data_latency_mode | REALTIME | LOW_LATENCY |
| api_enabled | ❌ | ✅ |
| presets_enabled | ❌ | ✅ |
| 기타 | 문서의 STANDARD 제한 | 문서의 PRO 전체 |

**적용 예:**

1. **POST /api/v1/surebets/search**  
   - STANDARD일 때 `islive=true` 요청이 오면 400/403 또는 서버에서 islive=false로 고정해 프리매치만 반환.
2. **API Key / API 전용 엔드포인트**  
   - PRO(또는 최고관리자)만 허용. 그 외 403.
3. **필터 프리셋 저장**  
   - 백엔드에서 제공 시 PRO만 허용.
4. **저지연 데이터**  
   - 경로/스트림을 나눌 경우 PRO만 저지연 허용.

---

## 9. 체크리스트

- [ ] 환경 변수: NOWPayments API Key, IPN Secret, PLAN_STANDARD_ID, PLAN_PRO_ID
- [ ] GET /api/v1/auth/me 응답에 `subscription_plan` 포함, 최고관리자 PRO 동일 처리
- [ ] POST /api/v1/payments/create 구현 (NOWPayments 결제 생성 후 pay_url 등 반환)
- [ ] POST /api/v1/subscriptions/create 구현 (NOWPayments 구독 생성, 이메일 발송)
- [ ] NOWPayments에 Standard/Pro 플랜 생성 후 plan id를 설정에 반영
- [ ] IPN 웹훅 엔드포인트 구현 및 서명 검증, 결제/구독 성공 시 DB 갱신
- [ ] surebets/search 등 데이터 API에 STANDARD/PRO 권한 적용
- [ ] API 전용 기능은 PRO(또는 최고관리자)만 허용

---

## 10. 참고

- **프론트 동작·설정·기대 API:** `docs/FRONTEND_SUBSCRIPTION.md`
- NOWPayments API: https://documenter.getpostman.com/view/7907941/2s93JusNJt 등 공식 문서 참고.

---

## 11. 구독 취소 (Already subscribed 에러 대응)

**에러 예:** `Email(s) jupyter817js@gmail.com already subscribed to the plan 1733005014`  
→ 해당 이메일이 이미 해당 플랜(1733005014)으로 구독 중이라, 같은 이메일로 다시 구독 생성이 불가한 상태입니다.

### 11.1 지금 당장 취소하는 방법 (대시보드)

1. **NOWPayments 대시보드**  
   - [https://account.nowpayments.io](https://account.nowpayments.io) 로그인  
   - **Subscriptions** / **Recurring Payments** (또는 이메일 구독 관리) 메뉴 이동  
   - 해당 이메일(`jupyter817js@gmail.com`) 또는 플랜(1733005014)으로 등록된 구독 찾기  
   - **취소(Cancel)** 또는 **비활성화** 처리  

취소 후에는 같은 이메일로 `POST /api/v1/subscriptions/create` 를 다시 호출할 수 있습니다.

### 11.2 서비스에서 “구독 취소” 기능을 넣는 방법 (선택)

- NOWPayments 공식 API에 **구독 취소** 엔드포인트가 있는지 Postman 문서([링크](https://documenter.getpostman.com/view/7907941/2s93JusNJt))의 Recurring Payments 섹션에서 확인하거나, 지원팀에 문의합니다.  
- 취소 API가 있다면:
  - 백엔드에 예: `POST /api/v1/subscriptions/cancel` 또는 `DELETE /api/v1/subscriptions/:id` 를 추가하고,  
  - 요청 본문에 `email` 또는 `subscription_id` 등을 받아 NOWPayments 취소 API를 호출한 뒤,  
  - DB의 해당 유저 `subscription_plan` / 만료일을 해지 상태로 갱신합니다.  
- 프론트(설정/구독 페이지)에 **구독 취소** 버튼을 두고 위 백엔드 API를 호출하도록 구현하면 됩니다.

**요약:** 당장은 **NOWPayments 대시보드에서 해당 이메일 구독을 취소**하면 됩니다. 서비스에 취소 기능을 넣으려면 NOWPayments 취소 API 확인 후 백엔드 + 프론트에 취소 플로우를 추가하면 됩니다.

---

## 12. 결제 완료 후 백엔드에서 할 일 (체크리스트)

유저가 구독 결제를 완료한 직후부터 계정이 업그레이드된 것처럼 동작하려면 아래를 백엔드에서 구현·확인해야 합니다.

### 12.1 IPN 웹훅 (필수)

- **엔드포인트:** `POST /api/v1/webhooks/nowpayments-ipn` (또는 합의한 경로)
- **순서:**
  1. `x-nowpayments-sig` 헤더로 **HMAC-SHA512 서명 검증** (IPN Secret 사용). 검증 실패 시 401/403 반환.
  2. 본문에서 `payment_status`(예: `finished`), `order_id`, 구독이면 `subscription_plan_id`, `customer_email` 등 파싱.
  3. **결제/구독 성공** 시:
     - `customer_email`(또는 order_id로 매핑한 유저)에 해당하는 유저를 DB에서 조회.
     - 해당 유저의 `subscription_plan`을 플랜에 맞게 설정 (예: plan_id가 STANDARD 플랜 ID면 `STANDARD`, PRO 플랜 ID면 `PRO`).
     - `subscription_end_at`(또는 `current_period_end`)을 갱신(예: 결제일 + 1개월).
  4. 응답 2xx 반환 (NOWPayments가 재시도하지 않도록).

이렇게 하면 결제 직후 IPN이 오면 DB가 갱신되고, 프론트에서 `GET /api/v1/auth/me`를 다시 호출했을 때 `subscription_plan`이 반영됩니다.

### 12.2 GET /api/v1/auth/me 응답 (필수)

- 응답 JSON에 **`subscription_plan`** 필드 포함: `"STANDARD"` | `"PRO"` | `null`.
- snake_case(`subscription_plan`) 또는 camelCase(`subscriptionPlan`) 모두 프론트에서 처리 가능.
- **최고관리자(level = SUPER_ADMIN)** 는 구독 값과 관계없이 프론트에서 PRO와 동일 권한으로 처리하므로, 백엔드에서 별도 가공하지 않아도 됨.

### 12.3 결제 성공 리다이렉트 URL (선택, 권장)

- NOWPayments 구독/결제 완료 후 유저가 돌아올 **Success URL** 에 다음 쿼리 파라미터를 붙이면, 프론트에서 “결제가 완료되었고 계정이 업그레이드되었다”는 토스트를 띄웁니다.
- **예:**  
  `https://your-frontend.com/#pricing?payment_success=1`  
  또는 `https://your-frontend.com/?subscription_success=1`
- 프론트는 `payment_success=1` 또는 `subscription_success=1` 를 감지 → `auth/me` 재호출 → 성공 토스트 표시 후 URL에서 해당 쿼리 제거.
- 백엔드에서 구독 생성 시 NOWPayments에 넘기는 success_url, 또는 플랜/결제 설정에서 위와 같은 URL을 지정해 두면 됩니다.

### 12.4 STANDARD/PRO 권한 적용 (필수)

- 결제가 반영되면 `auth/me`의 `subscription_plan`에 따라 프론트가 라이브 탭·API 메뉴 등을 제어합니다.
- **데이터 API**에서도 동일한 기준으로 권한을 적용해야 합니다 (§8 참고).
  - 예: `POST /api/v1/surebets/search` 에서 `subscription_plan === STANDARD` 이면 `islive=true` 요청 거부 또는 프리매치만 반환.
  - API Key / API 전용 엔드포인트는 PRO(또는 최고관리자)만 허용.

### 12.5 요약

| 항목 | 담당 | 내용 |
|------|------|------|
| IPN 웹훅 | 백엔드 | 서명 검증 → 유저 매칭 → `subscription_plan`, 만료일 DB 갱신 |
| auth/me | 백엔드 | 응답에 `subscription_plan` 포함 |
| Success URL | 백엔드(설정) | `?payment_success=1` 또는 `?subscription_success=1` 로 프론트 복귀 URL 설정 권장 |
| 권한 적용 | 백엔드 | surebets/search, API 등에 STANDARD/PRO 제한 적용 |

### 12.6 "NOWPayments에는 결제됐는데 앱에서는 Free로 보일 때" (점검 사항)

**증상:** NOWPayments 대시보드에서는 특정 이메일(예: `jupyter817@outlook.com`)이 Standard 구독으로 **Active**이고, 결제 이력에서 해당 결제가 **Finished**인데, 같은 이메일로 로그인한 앱에서는 여전히 **Free(현재 플랜)** 로만 보임.

**원인:** 프론트는 `GET /api/v1/auth/me` 응답의 `subscription_plan` 값만 사용합니다. 아래 중 하나가 아니면 화면은 계속 Free로 표시됩니다.

1. **IPN이 백엔드에 오지 않음**  
   - NOWPayments 대시보드에서 IPN Callback URL이 백엔드 공개 URL(예: `https://your-api.com/api/v1/webhooks/nowpayments-ipn`)로 설정되어 있는지 확인.  
   - 해당 URL이 외부에서 POST로 접근 가능한지(방화벽/보안 그룹) 확인.

2. **IPN은 오지만 유저 매칭/갱신이 안 됨**  
   - IPN 본문에 **`customer_email`**(또는 구독 결제 시 사용하는 이메일 필드)이 포함됩니다.  
   - 이 **이메일**로 DB에서 유저를 조회한 뒤, 해당 유저의 `subscription_plan`을 갱신해야 합니다.  
   - **플랜 매핑:** IPN의 `subscription_plan_id`(또는 동일한 의미의 plan id)가  
     - `NOWPAYMENTS_PLAN_STANDARD_ID`와 같으면 → `subscription_plan = "STANDARD"`  
     - `NOWPAYMENTS_PLAN_PRO_ID`와 같으면 → `subscription_plan = "PRO"`  
   - 결제 상태가 **`payment_status === "finished"`**(또는 NOWPayments 문서상의 완료 상태 값)일 때만 위 갱신 수행.

3. **auth/me에서 subscription_plan을 내려주지 않음**  
   - `GET /api/v1/auth/me` 응답 JSON에 **`subscription_plan`** 필드가 포함되어야 합니다.  
   - 값: `"STANDARD"` | `"PRO"` | `null` (미구독이면 `null`).  
   - DB 컬럼명이 다르면(예: `SubscriptionPlan`) 응답 시 `subscription_plan`으로 매핑해 내려주면 됩니다.

**점검 순서 요약:**  
① IPN URL 설정 및 접근 가능 여부 → ② IPN 수신 시 서명 검증 후 `customer_email`로 유저 조회 → ③ `payment_status`가 완료일 때 `subscription_plan_id`로 STANDARD/PRO 판단해 DB `subscription_plan` 갱신 → ④ `auth/me`에서 해당 유저의 `subscription_plan` 반환.
