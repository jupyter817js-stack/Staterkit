# 결제·구독 백엔드 요구사항

프론트엔드가 기대하는 결제·구독 관련 API 스펙입니다. 백엔드 구현·검증 시 이 문서를 기준으로 확인하면 됩니다.

---

## 1. 전체 정책 요약

| 항목 | 내용 |
|------|------|
| **데이터 소스** | **tb_user만 사용**. tb_payment_history는 사용하지 않음. |
| **결제 이력** | tb_user의 `subscription_plan`, `subscription_start_at`, `subscription_end_at` 기준으로 응답. |
| **구독 갱신** | 백엔드가 30초 주기 등으로 `GET /v1/subscriptions?status=PAID` 호출 후 **tb_user만 갱신**. |
| **IPN 콜백** | 서명 검증 후 200만 반환. 결제/구독 갱신과 무관해도 됨. |

---

## 2. 인증

- 모든 아래 API는 **Bearer 토큰** (`Authorization: Bearer <token>`) 필요.
- 401 시 프론트는 로그인 페이지 등으로 처리.

---

## 3. GET /api/v1/auth/me

**용도**: 현재 로그인 유저 정보. **구독 여부·플랜·만료일은 이 응답만으로 판단**합니다.

### 요청

- Method: `GET`
- Headers: `Authorization: Bearer <token>`

### 응답 (JSON) — 필수·권장 필드

| 필드 (snake_case 또는 camelCase) | 타입 | 필수 | 설명 |
|----------------------------------|------|------|------|
| id | number | ✅ | 유저 ID |
| email | string | ✅ | 이메일 |
| level | number | ✅ | 0=본사/관리자, 1=총판, 2=매장, 10=회원 |
| subscription_plan | string \| null | ✅ | `"PRO"` \| `"STANDARD"` \| null (미구독) |
| subscription_start_at | string \| null | 권장 | 구독 시작일 (ISO 8601 권장) |
| subscription_end_at | string \| null | 권장 | 구독 만료일 (ISO 8601 권장). 이 날짜가 지나면 프론트에서 “만료”로 표시 |
| firstname / firstName | string | - | 이름 |
| lastname / lastName | string | - | 성 |
| managed_partner_id / managedPartnerId | string \| null | - | 총판일 때 관리 총판 ID |
| managed_store_id / managedStoreId | string \| null | - | 매장일 때 관리 매장 ID |
| register_time / registerTime | string \| null | - | 가입일시 |
| lastlogin_time / lastLoginTime | string \| null | - | 마지막 로그인 |

- 프론트는 **snake_case / camelCase 둘 다** 수용합니다 (`subscription_plan` 또는 `subscriptionPlan` 등).

---

## 4. GET /api/v1/payments/my-history

**용도**: 로그인 유저 **본인의** 구독 이력. tb_user 1건 기준이므로 최대 1건.

### 요청

- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- Query (선택): `per_page`, `page` — 실질적으로 1건이므로 무시해도 됨.

### 응답 (JSON)

```json
{
  "items": [
    {
      "id": "유저 id (string 또는 number)",
      "email": "이메일",
      "plan": "PRO | STANDARD | 빈문자열",
      "payment_amount": null,
      "payment_date": "구독 시작일 (subscription_start_at, ISO 문자열 또는 null)",
      "expiry_date": "구독 만료일 (subscription_end_at, ISO 문자열 또는 null)",
      "status": "active | expired"
    }
  ],
  "total": 1
}
```

- 구독 **있음**: `items` 길이 1, `total` 1.
- 구독 **없음**: `items: []`, `total: 0`.

### 필드 규칙

| 필드 | 타입 | 비고 |
|------|------|------|
| id | string \| number | 유저 id |
| email | string | |
| plan | string | "PRO" \| "STANDARD" \| "" |
| payment_amount | **null** | tb_user에 금액 없음 → **항상 null** |
| payment_date | string \| null | 구독 시작일 (subscription_start_at) |
| expiry_date | string \| null | 구독 만료일 (subscription_end_at) |
| status | string | **"active"** (구독 중) \| **"expired"** (만료) |

- `status`: `subscription_end_at`가 현재 시각 이전이면 `"expired"`, 아니면 `"active"` 권장.

---

## 5. GET /api/v1/payments/history

**용도**: 관리자(또는 권한 있는 역할)용 **구독 유저 목록**. tb_user 기준, 구독이 있는 유저만.

### 요청

- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- Query (선택):

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| email | string | 이메일 필터 (부분 일치 또는 완전 일치) |
| date_from | string | 구독/결제일 범위 시작 (예: YYYY-MM-DD) |
| date_to | string | 구독/결제일 범위 끝 |
| plan | string | "STANDARD" \| "PRO" 등 플랜 필터 |
| per_page | number | 페이지당 개수 |
| page | number | 페이지 번호 |

### 응답 (JSON)

```json
{
  "items": [
    {
      "id": "유저 id",
      "email": "이메일",
      "plan": "PRO | STANDARD | ...",
      "payment_amount": null,
      "payment_date": "subscription_start_at 또는 null",
      "expiry_date": "subscription_end_at 또는 null",
      "status": "active | expired"
    }
  ],
  "total": 100
}
```

- **items**: 배열. `data` 키로 넘겨도 프론트는 `data`를 items로 사용합니다.
- **payment_amount**: tb_user에 금액 없음 → **항상 null**로 두면 됨.
- **status**: **"active"** \| **"expired"** 만 사용하면 됨. (프론트는 "구독 중" / "만료"로 표시)

---

## 6. POST /api/v1/subscriptions/create

**용도**: 구독 결제 링크 생성. 백엔드가 NOWPayments 등과 연동해 구독 생성 후, **결제 페이지 URL** 또는 “이메일로 발송” 결과를 반환.

### 요청

- Method: `POST`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body (JSON):

```json
{
  "Plan": "STANDARD | PRO",
  "Email": "user@example.com"
}
```

- 필드명은 **PascalCase** (`Plan`, `Email`) 로 보냅니다. (프론트 현재 구현 기준)

### 응답 (JSON) — 성공 시

다음 중 **하나 이상**에 결제 페이지 URL(절대 URL, `http` 또는 `https`로 시작)을 넣어 주세요.  
프론트는 **아래 순서대로** 첫 번째로 있는 URL을 사용해 새 탭을 엽니다.

| 필드 (하나만 있어도 됨) | 설명 |
|------------------------|------|
| subscription_link | 권장. 구독 결제 링크 |
| pay_url | |
| payment_url | |
| invoice_url | |
| payment_link | |
| invoice_link | |
| link | |
| url | |

- 예: `{ "subscription_link": "https://..." }` 또는 `{ "pay_url": "https://..." }`
- URL이 없으면 프론트는 “결제 링크가 이메일로 발송되었습니다” 메시지를 표시합니다.

### 응답 — 에러 시 (4xx/5xx)

- 본문에 에러 메시지를 넣어 주면 프론트가 그대로 사용합니다.
- 지원 형식 예:
  - `{ "message": "에러 메시지" }`
  - `{ "error": "에러 메시지" }`
  - `{ "error": "{\"message\":\"중첩 메시지\"}" }` (문자열인 JSON 파싱 시도)

---

## 7. POST /api/v1/payments/create (일회성 결제)

**용도**: 일회성 결제 링크 생성. (현재 프론트는 구독 플로우에서 주로 사용하지 않음. 필요 시 사용)

### 요청

- Method: `POST`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body (JSON):

```json
{
  "price_amount": 100,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "optional-order-id",
  "order_description": "optional-description"
}
```

### 응답 (JSON) — 성공 시

- NOWPayments 스타일 응답을 그대로 반환하면 됨.  
  프론트는 특히 **pay_url** 을 사용해 결제 페이지로 이동할 수 있습니다.

- 예시 필드: `payment_id`, `pay_url`, `pay_address`, `pay_amount`, `pay_currency`, `price_amount`, `price_currency`, `order_id`, `created_at`, `updated_at` 등.

### 응답 — 에러 시

- 4xx/5xx + 본문에 `message` 또는 `error` (위 구독 생성과 동일 형식).

---

## 8. 공통 규칙 정리

| 항목 | 규칙 |
|------|------|
| 구독 상태 판단 | **오직 GET /api/v1/auth/me** 의 `subscription_plan`, `subscription_start_at`, `subscription_end_at` 사용. |
| 결제 금액 | tb_user에는 금액 없음 → my-history / history 모두 **payment_amount: null**. |
| status | my-history, history 모두 **"active"** \| **"expired"** 만 사용. |
| 결제 완료 반영 | 백엔드가 주기적으로 PAID 구독 조회 후 **tb_user만 갱신**. 프론트는 결제 완료 안내 후 재진입 시 auth/me로 갱신. |

---

## 9. 체크리스트 (백엔드 검증용)

- [ ] GET /api/v1/auth/me 에 `subscription_plan`, `subscription_start_at`, `subscription_end_at` 포함
- [ ] GET /api/v1/payments/my-history 는 tb_user 1건 기준, 구독 없으면 `items: []`, `total: 0`
- [ ] GET /api/v1/payments/history 는 tb_user 목록(구독 있는 유저), `payment_amount` null, `status` "active"|"expired"
- [ ] POST /api/v1/subscriptions/create 요청: Body에 `Plan`, `Email` (PascalCase)
- [ ] POST /api/v1/subscriptions/create 응답: 결제 URL을 `subscription_link` 등 문서 6절 필드 중 하나로 반환
- [ ] 에러 응답: `message` 또는 `error` 로 메시지 반환 시 프론트에서 그대로 표시 가능

---

문서 버전: 1.0 (tb_user 전용 정책 기준)
