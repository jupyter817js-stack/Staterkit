# 결제·구독 API — 백엔드 스펙 (검증용)

프론트엔드가 호출하는 **결제/구독 관련 API**를 백엔드에서 구현·검증할 때 맞춰볼 수 있도록 정리한 문서입니다.  
상세 구현(NOWPayments 연동, IPN 처리, DB 스키마 등)은 `BACKEND_SUBSCRIPTION.md`를 참고하세요.

---

## 1. 공통 사항

| 항목 | 내용 |
|------|------|
| **Base URL** | 백엔드 API 서버 주소 (예: `https://api.betsurezone.com`) |
| **인증** | 모든 결제/구독 API는 **로그인 필수**. `Authorization: Bearer <토큰>` (Firebase JWT 등) |
| **Content-Type** | `application/json` (POST 시) |

---

## 2. API 목록 요약

| 목적 | 메서드 | 경로 | 비고 |
|------|--------|------|------|
| 현재 유저 구독 상태 | GET | `/api/v1/auth/me` | 응답에 `subscription_plan` 포함 |
| 월 구독 결제 (STANDARD/PRO) | POST | `/api/v1/subscriptions/create` | 결제 링크는 **이메일**로만 발송. pay_url 미반환. |
| 1회성 결제 | POST | `/api/v1/payments/create` | `pay_url` 반환 → 구독 적용 없음 |
| 내 결제·구독 이력 | GET | `/api/v1/payments/my-history` | 로그인 유저 **본인** 이력만 |
| 결제 이력 목록 (관리자/총판/매장) | GET | `/api/v1/payments/history` | 권한별로 조회 범위 다름 |

---

## 3. GET /api/v1/auth/me

**역할:** 로그인한 유저 정보 조회. 프론트는 구독 상태 표시·권한 제어에 사용.

**헤더:** `Authorization: Bearer <토큰>`

**성공 응답 (200)** — 반드시 포함할 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 유저 ID |
| `email` | string | 이메일 |
| `subscription_plan` | `"PRO"` \| `"STANDARD"` \| `null` | 구독 없으면 `null` |

**예시:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "subscription_plan": "PRO"
}
```

- snake_case(`subscription_plan`) 또는 camelCase(`subscriptionPlan`) 모두 프론트에서 처리 가능.
- **최고관리자(level = SUPER_ADMIN)** 는 프론트에서 구독 없이 PRO와 동일 권한으로 처리.

---

## 4. POST /api/v1/subscriptions/create (월 구독)

**역할:** STANDARD 또는 PRO 월 구독 생성. NOWPayments가 **고객 이메일로 결제 링크를 발송**하며, 이 API 응답에는 결제 페이지 URL을 넣지 않는 것이 원칙입니다.

**헤더:** `Authorization: Bearer <토큰>`, `Content-Type: application/json`

**Request Body (JSON) — 필드명 소문자:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `plan` | string | O | `"STANDARD"` 또는 `"PRO"` (대소문자 구분 없음 가능) |
| `email` | string | O | 결제 링크를 받을 이메일. **로그인 유저 이메일과 동일**하게 보내는 것이 좋음. |

**예시:**
```json
{
  "plan": "PRO",
  "email": "user@example.com"
}
```

**성공 응답 (200):**
```json
{
  "success": true,
  "message": "구독이 생성되었습니다. 결제 링크가 이메일로 발송됩니다. 도착하지 않으면 스팸함을 확인하거나 잠시 기다려 주세요.",
  "subscription_id": "12345"
}
```

- `subscription_id` 는 선택(백엔드/연동 상태에 따라 없을 수 있음).
- **이 API는 `pay_url` 등을 반환하지 않는 것을 전제로 합니다.** (NOWPayments가 이메일로만 링크 발송)

**에러 응답:**

| HTTP | 내용 |
|------|------|
| 400 | `plan` / `email` 누락 또는 `plan` 이 STANDARD, PRO 가 아님. body 에 `error` 또는 `message` 포함 권장. |
| 401 | 토큰 없음/만료 |
| 503 | NOWPayments 오류 또는 설정 미완료. body 에 `message` 또는 `error` 포함. |

---

## 5. POST /api/v1/payments/create (1회성 결제)

**역할:** 특정 금액 1회 결제 링크 생성. **구독 적용 없음.**

**헤더:** `Authorization: Bearer <토큰>`, `Content-Type: application/json`

**Request Body (JSON):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `price_amount` | number | O | 결제 금액 (0 초과) |
| `price_currency` | string | 선택 | 기본 `"usd"` |
| `pay_currency` | string | 선택 | 암호화폐 (예: btc) |
| `order_id` | string | 선택 | 주문 식별자 |
| `order_description` | string | 선택 | 주문 설명 |

**성공 응답 (200):**
```json
{
  "pay_url": "https://nowpayments.io/payment/?id=...",
  "pay_address": "...",
  "pay_amount": 0.00012,
  "pay_currency": "btc",
  "order_id": "...",
  "order_description": "..."
}
```

- **`pay_url`** 은 필수. 프론트에서 이 URL로 유저를 이동(리다이렉트 또는 새 창)시킵니다.

**에러:** 4xx/5xx 시 body 에 `error` 또는 `message` 포함 시 프론트에서 표시 가능.

---

## 6. GET /api/v1/payments/my-history (본인 결제·구독 이력)

**역할:** 로그인한 유저 **본인**의 결제/구독 이력만 조회. IPN 콜백으로 DB에 쌓인 데이터.

**헤더:** `Authorization: Bearer <토큰>`

**Query (선택):**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `per_page` | number | 선택 | 기본 20, 최대 100 |
| `page` | number | 선택 | 기본 1 |

**성공 응답 (200):**
```json
{
  "items": [
    {
      "id": "1",
      "email": "user@example.com",
      "plan": "PRO",
      "payment_amount": 29.99,
      "payment_date": "2026-02-12T00:00:00",
      "expiry_date": "2026-03-12T00:00:00",
      "status": "finished"
    }
  ],
  "total": 1
}
```

- 본인(user_id 또는 email 일치) 건만 반환.
- **401** 이면 로그인 필요.

---

## 7. GET /api/v1/payments/history (관리자/총판/매장 결제 이력)

**역할:** 권한에 따라 결제 이력 조회.

- **슈퍼관리자:** 전체 고객 결제 이력.
- **총판관리자:** 자기 총판 하위 유저(총판 직속 + 소속 매장 유저)만.
- **매장관리자:** 자기 매장 하위 유저만.
- 그 외(일반 회원 등): **403**.

**헤더:** `Authorization: Bearer <토큰>`

**Query (선택):**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `email` | string | 선택 | 이메일 부분 검색 |
| `date_from` | string | 선택 | 결제일 from (날짜) |
| `date_to` | string | 선택 | 결제일 to (날짜) |
| `plan` | string | 선택 | `STANDARD` 또는 `PRO` |
| `per_page` | number | 선택 | 기본 10, 최대 100 |
| `page` | number | 선택 | 기본 1 |

**성공 응답 (200):**
```json
{
  "items": [
    {
      "id": "1",
      "email": "user@example.com",
      "plan": "PRO",
      "payment_amount": 29.99,
      "payment_date": "2026-02-12T00:00:00",
      "expiry_date": "2026-03-12T00:00:00",
      "status": "finished"
    }
  ],
  "total": 1
}
```

- **403** 이면 권한 없음(슈퍼관리자/총판/매장이 아님).

---

## 8. IPN 웹훅 (NOWPayments → 백엔드)

**역할:** 결제/구독 완료 시 NOWPayments가 백엔드로 알림. 백엔드에서 유저 구독 상태 갱신.

| 항목 | 내용 |
|------|------|
| **경로** | `POST /api/v1/webhooks/nowpayments-ipn` (또는 합의한 URL) |
| **호출 주체** | NOWPayments (프론트 호출 아님) |
| **검증** | `x-nowpayments-sig` 헤더로 HMAC-SHA512 서명 검증 (IPN Secret 사용) |
| **처리** | `payment_status`(예: finished), `customer_email`, `subscription_plan_id` 등 파싱 후, 해당 유저의 `subscription_plan`, 만료일 DB 갱신 |
| **응답** | 2xx 반환 (재시도 방지) |

자세한 처리 순서·DB 갱신은 `BACKEND_SUBSCRIPTION.md` §6, §12 참고.

---

## 9. 백엔드 검증 체크리스트

- [ ] **GET /api/v1/auth/me** 응답에 `subscription_plan` (`"PRO"` \| `"STANDARD"` \| `null`) 포함
- [ ] **POST /api/v1/subscriptions/create**  
  - Request body 필드명: **`plan`**, **`email`** (소문자)  
  - 성공 시: `success`, `message` (및 선택 `subscription_id`) 반환. **`pay_url` 등 결제 URL 미반환** (이메일 발송만)
- [ ] **POST /api/v1/payments/create**  
  - 1회성 결제만. 성공 시 **`pay_url`** 반환. 구독 적용 없음.
- [ ] **GET /api/v1/payments/my-history**  
  - 로그인 유저 본인 이력만. `per_page`, `page` 지원. 401 시 로그인 유도.
- [ ] **GET /api/v1/payments/history**  
  - 슈퍼관리자: 전체 / 총판: 소속 하위만 / 매장: 소속 매장 하위만. 그 외 403.
- [ ] **IPN 웹훅**  
  - 서명 검증 후 결제/구독 성공 시 해당 유저 `subscription_plan`·만료일 DB 갱신

---

## 10. 참고 문서

- **프론트 기대 동작·체크리스트:** 프로젝트 내 결제 연동 프론트엔드 가이드 (또는 `FRONTEND_SUBSCRIPTION.md`)
- **백엔드 상세 구현(NOWPayments, IPN, DB, 권한):** `BACKEND_SUBSCRIPTION.md`

이 문서는 프론트엔드와의 연동 검증을 위해 작성되었습니다. API 베이스 URL·환경 변수는 배포 환경에 맞게 설정하세요.
