# 정산·결제 이력 — 프론트엔드 작업 가이드

백엔드 정산 API 및 결제 이력(tb_payment_history) 반영에 따라 프론트에서 할 작업을 정리한 문서입니다.

---

## 1. 정산 (Settlements)

### 1.1 API

- **GET /api/v1/settlements**
- **인증**: `Authorization: Bearer <token>` 필수
- **쿼리 파라미터** (모두 선택)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| period_start | string | 기간 시작 (YYYY-MM-DD) |
| period_end | string | 기간 끝 (YYYY-MM-DD) |
| target_type | string | "partner" \| "store" |
| target_id | string | 총판 ID 또는 매장 ID |
| status | string | "calculated" \| "pending" \| "paid" \| "failed" \| "hold" (현재는 calculated 위주) |
| page | number | 페이지 (1부터) |
| per_page | number | 페이지당 개수 (기본 100) |

### 1.2 응답 (JSON)

- **키**: `records`, `total`
- **필드명**: **camelCase** (백엔드가 camelCase로 내려줌)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 레코드 식별용 (계산 결과는 임시 id) |
| periodStart | string | 정산 기간 시작 (YYYY-MM-DD) |
| periodEnd | string | 정산 기간 끝 |
| targetType | "partner" \| "store" | 총판 정산 / 매장 정산 |
| targetId | string | 총판 ID 또는 매장 ID |
| netSalesAmount | number | 해당 대상·기간 순매출 (USDT) |
| commissionRatePercent | number | 적용 수익률 (%) — DB에서 조회한 값 |
| payoutAmount | number | 지급 예정 금액 (USDT) |
| network | string | 지갑 네트워크 (예: TRON) |
| walletAddress | string | 지갑 주소 |
| txHash | string \| null | 현재 단계에서는 null |
| status | string | "calculated" 등 (paid/failed/hold는 추후) |
| paidAt | string \| null | 현재 null |
| failureReason | string \| null | 현재 null |

### 1.3 권한별 노출

- **본사/관리자**: 전체 총판·매장 정산 조회
- **총판**: `target_type=partner` 이고 `target_id=본인 총판 ID` 인 건 + 본인 하위 매장(`target_type=store`, target_id ∈ 본인 소속 매장 ID)
- **매장**: `target_type=store` 이고 `target_id=본인 매장 ID` 인 건만

### 1.4 정산 트리 (누구에게 얼마를, 왜 주어야 하는가)

**트리 구조**를 한 번에 받으려면 아래 API를 사용하면 됩니다.

- **GET /api/v1/settlements/tree?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD**
- **인증**: `Authorization: Bearer <token>` 필수
- **역할별 응답**:
  - **관리자**: 전체 총판 목록 → 각 총판 아래 하위 매장 목록 + 본사 직속 매장 목록
  - **총판**: 본인 총판 1건 + 하위 매장 목록
  - **매장**: 본인 매장 1건 (headquartersStores에 포함)

**응답 (JSON) — camelCase**

| 필드 | 타입 | 설명 |
|------|------|------|
| periodStart | string | 정산 기간 시작 |
| periodEnd | string | 정산 기간 끝 |
| partners | array | 총판 노드 배열. 각 항목에 **stores** (하위 매장 배열) 포함 |
| headquartersStores | array | 본사 직속 매장 배열 (partner_id 없는 매장). 매장 계정일 때는 본인 1건 |
| **totalPayoutAmount** | number (선택) | 해당 기간 **총 지급 예정액**(USDT). 슈퍼관리자 옆 "총 지급 예정" 표시용. 없으면 프론트에서 트리 데이터로 합산 |

**partners[].** 각 총판 노드

| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 총판 ID |
| nickName | string \| null | 총판 표시명 (유저 nick_name) |
| commissionRatePercent | number | 수익률 (%) |
| walletNetwork, walletAddress | string \| null | 지갑 정보 |
| **settlement** | object \| null | 해당 기간 정산 결과 (없으면 null) |
| **stores** | array | 이 총판 소속 매장 배열 |

**partners[].settlement / stores[].settlement / headquartersStores[].settlement**

| 필드 | 타입 | 설명 |
|------|------|------|
| netSalesAmount | number | 순매출 |
| commissionRatePercent | number | 적용 수익률 |
| payoutAmount | number | 지급 예정 금액 |
| network, walletAddress | string \| null | 지갑 |
| status | string | "calculated" 등 |

**프론트 트리 UI (구현 반영)**

1. 기간 선택 후 `GET /api/v1/settlements/tree?period_start=&period_end=` 호출.
2. `partners` 를 순회하며 각 총판을 1단계 노드로 표시, `partner.settlement` 로 "순매출 / 수익률 / 지급 예정" 표시.
3. 각 총판의 `stores` 를 2단계(들여쓰기)로 표시, `store.settlement` 로 금액 표시.
4. `headquartersStores` 를 "본사 직속 매장" 섹션으로 표시 (관리자일 때만 의미 있음).

### 1.5 프론트 체크리스트

- [x] 정산 목록 페이지에서 **GET /api/v1/settlements** 호출 시 쿼리 `period_start`, `period_end` (필요 시 `target_type`, `target_id`, `status`) 사용
- [x] **정산 트리**(계층 구조) UI: **GET /api/v1/settlements/tree** 사용. 기간 선택 시 트리 뷰에서 해당 API 호출 후 `partners` + `headquartersStores` 로 "본사 → 총판 → 매장" 및 지급 예정 금액 표시
- [x] 응답은 **camelCase** 기준으로 사용 (periodStart, periodEnd, netSalesAmount, commissionRatePercent, payoutAmount, walletAddress 등)
- [x] 테이블/카드에 순매출(netSalesAmount), 수익률(commissionRatePercent), 지급 예정(payoutAmount), 지갑(network, walletAddress) 표시
- [x] 현재 단계에서는 **자동 지급 버튼/기능 없음**. txHash, paidAt 은 null 로 표시(또는 "—")

---

## 2. 결제 이력 (Payment History) — tb_payment_history 기반

### 2.1 백엔드 동작 요약

- **결제 이력 수집**: 백그라운드에서 **api.nowpayments.io** 구독 목록(Standard·Pro) + **api.nowpayments.io/v1/subscriptions/{id}/payments** 구독별 결제를 주기적으로 호출해 **tb_payment_history** 에 저장 (유저 테이블에 있는 이메일만).
- **내 결제 이력 (my-history)**:  
  - 이전에는 tb_user 1건 기준으로만 반환했으나, **tb_payment_history** 가 채워지면 해당 테이블에서도 조회할 수 있도록 백엔드가 확장될 수 있음.  
  - 현재는 **GET /api/v1/payments/my-history** 가 tb_user 기준 1건인지, tb_payment_history 기반 목록인지는 백엔드 구현에 따름.  
  - 프론트는 **items** 배열과 **total** 을 그대로 사용하면 됨.
- **관리자용 결제 이력 (history)**:  
  - **GET /api/v1/payments/history** 는 tb_user 기준이었음. tb_payment_history 가 쌓이면 백엔드가 이 테이블 기반으로 전환할 수 있음.  
  - 프론트는 기존과 동일하게 `items`, `total` 및 필드(payment_amount, payment_date, status 등)를 사용.

### 2.2 프론트 체크리스트 (결제 이력)

- [x] **내 결제 이력** 페이지: `GET /api/v1/payments/my-history` 호출 후 `items`/`total` 표시.  
  - `payment_amount` 가 null 일 수 있음 → "—" 또는 숨김 처리  
  - `status` 는 "active" \| "expired" 또는 "finished" 등 백엔드 규칙에 맞게 표시
- [x] **관리자/총판/매장 결제 이력** 페이지: `GET /api/v1/payments/history` 호출, 쿼리(email, date_from, date_to, plan, per_page, page) 사용.  
  - 동일하게 `payment_amount` null 처리, status 표시
- [x] 구독 상태(프로/스탠다드, 만료일)는 계속 **GET /api/v1/auth/me** 의 `subscription_plan`, `subscription_end_at` 으로 판단

---

## 3. 공통

- 모든 API는 **Bearer 토큰** 필요. 401 시 로그인 페이지 등으로 처리
- 에러 응답은 `message` 또는 `error` 로 메시지 표시
- 정산·결제 이력 모두 **자동 지급/실제 송금 기능 없음** — "지급 예정"·"계산 결과"·"이력 조회" 용도로만 UI 구성

---

문서 버전: 1.0 (정산 계산만 + tb_payment_history 수집 반영)
