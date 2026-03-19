# 총판·매장·정산 – 백엔드에서 할 일

총판 → 매장 → 회원 구조 및 링크 기반 자동 귀속·정산을 위해 **백엔드에서 구현·처리할 항목**을 정리한 문서입니다.  
프론트 구현 현황은 `docs/FRONTEND_PARTNER_STORE.md` 참고.  
기준 문서: `docs/[총판 → 매장 → 회원 구조  링크 기반 자동 귀속 및 정산.txt`

---

## 0. DB 구조 변경 (필수)

총판·매장·정산 기능을 위해 **유저 테이블 수정**과 **신규 테이블 추가**가 필요합니다.

### 0.1 users 테이블 수정

| 컬럼 | 타입 | 비고 |
|------|------|------|
| **store_id** | string (nullable) | 귀속 매장 ID. FK → stores.id 권장. |
| **partner_id** | string (nullable) | 귀속 총판 ID. FK → partners.id 권장. |

- 가입 시 위 값 설정 후 일반 회원은 변경 불가(관리자만 수정).
- **level**: 0=본사/관리자, 1=총판, 2=매장, 10=일반회원 (0.7절 참고).

### 0.2 partners 테이블 (신규)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | string (PK) | 총판 ID (가입 링크 `p=` 값, 내부 식별) |
| **nick_name** | string (nullable) | 화면 표시명. 없으면 id 표시. |
| commission_rate_percent | number | 수익률 (예: 40) |
| wallet_network | string | TRON, POLYGON 등 |
| wallet_address | string | 지갑 주소 |
| **user_id** 또는 **manager_user_id** | FK → users.id (nullable, unique) | 이 총판을 “관리”하는 로그인 계정. DB 컬럼명이 `manager_user_id`이면 엔티티에서 `[Column("manager_user_id")]` 또는 Fluent API `HasColumnName("manager_user_id")` 로 매핑. |
| created_at | datetime | |

- 관리자가 총판 생성 시 id, nick_name, 수익률, 지갑 설정. 표시에는 nick_name 사용.
- 총판으로 로그인할 계정을 나중에 연결할 경우 `user_id` 업데이트.

### 0.3 stores 테이블 (신규)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | string (PK) | 매장 ID (가입 링크 `s=` 값, 내부 식별) |
| **nick_name** | string (nullable) | 화면 표시명. 없으면 id 표시. |
| **partner_id** | string (FK → partners.id, **nullable**) | 상위 총판. **NULL = 본사 직속 매장.** |
| commission_rate_percent | number | 매장 수익률 (총판 매장일 때만 ≤ 해당 총판 수익률) |
| wallet_network | string | |
| wallet_address | string | |
| **user_id** | FK → users.id (nullable, unique) | 이 매장을 “관리”하는 로그인 계정 (level=2, auth/me 시 managed_store_id 반환) |
| created_at | datetime | |

- 제약: `partner_id`가 NOT NULL일 때만 매장 수익률 ≤ 해당 총판의 `commission_rate_percent`. **본사 직속 매장**(`partner_id = NULL`)은 관리자만 생성 가능.

### 0.3.1 컬럼명이 manager_user_id 인 경우 (EF Core 매핑)

DB에 **manager_user_id** 로 이미 있으면, `user_id` 컬럼을 새로 추가할 필요 없습니다.  
대신 백엔드 엔티티에서 **컬럼명 매핑**만 해주면 됩니다.

- **C# 엔티티 예시 (속성명은 UserId 로 두고 DB 컬럼만 매핑)**  
  ```csharp
  [Column("manager_user_id")]
  public int? UserId { get; set; }
  ```
  또는 Fluent API:
  ```csharp
  entity.Property(e => e.UserId)
      .HasColumnName("manager_user_id");
  ```
- **auth/me** 의 managed_partner_id: `partners.manager_user_id = current_user.id` 인 행의 `partners.id` 로 조회하면 됩니다.

### 0.3.2 partners / stores 테이블에 user_id 컬럼이 아예 없을 때 (MySQL)

에러: `Unknown column 't.user_id' in 'field list'` 가 나고, 위 0.3.1처럼 `manager_user_id` 도 없다면 아래처럼 컬럼을 추가하세요. **이미 manager_user_id 가 있으면 0.3.1만 적용.**

```sql
-- partners 테이블에 user_id 추가 (users.id 타입에 맞게)
ALTER TABLE partners
  ADD COLUMN user_id INT NULL UNIQUE,
  ADD CONSTRAINT fk_partners_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- stores 테이블에 user_id 또는 manager_user_id 추가
ALTER TABLE stores
  ADD COLUMN user_id INT NULL UNIQUE,
  ADD CONSTRAINT fk_stores_user_id FOREIGN KEY (user_id) REFERENCES users(id);
```

- `users.id` 가 BIGINT면 `INT` → `BIGINT` 로 바꿔서 사용.

### 0.4 인증 정책: 총판/매장 등록도 Firebase 경유

- **총판·매장 관리자 계정**도 일반 회원과 동일하게 **Firebase Auth**를 거쳐 생성해야 합니다.  
- **금지**: 백엔드에서 비밀번호를 직접 저장하거나, DB에만 users를 추가하는 방식.  
- **권장 처리**:  
  - `POST /api/v1/partners`, `POST /api/v1/stores` 수신 시 **Firebase Admin SDK**로 해당 이메일·비밀번호로 Firebase Auth 사용자를 먼저 생성.  
  - 생성된 Firebase UID로 백엔드 users + partners/stores 레코드 생성 (level=1 또는 2).  
  - 이후 해당 계정은 이메일/비밀번호로 **일반 로그인 플로우**와 동일하게 Firebase 로그인 → idToken 검증으로 접속.

### 0.5 settlement_records 테이블 (신규)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | PK (auto) | |
| period_start | date | 정산 기간 시작 |
| period_end | date | 정산 기간 끝 |
| target_type | enum('partner','store') | 총판 / 매장 구분 |
| target_id | string | partners.id 또는 stores.id |
| net_sales_amount | decimal | 순매출 |
| commission_rate_percent | number | 적용 수익률 |
| payout_amount | decimal | 지급 금액 |
| network | string | |
| wallet_address | string | |
| tx_hash | string (nullable) | 블록체인 트랜잭션 해시 |
| status | enum('paid','failed','hold') | |
| paid_at | datetime (nullable) | |
| failure_reason | string (nullable) | |
| created_at | datetime | |

- 10일 단위 지급 시 1건씩 insert/update.

### 0.6 결제·주문 테이블 (기존이 있는 경우)

- 정산 계산을 위해 **어느 매장/총판 귀속 결제인지** 알 수 있어야 함.
- 예: `payments` 또는 `orders` 테이블에 **user_id**만 있다면, `users.store_id` / `users.partner_id`로 귀속 조회 가능.
- 확정 시점(7일 경과 등)을 저장하려면 `confirmed_at` 또는 `status = CONFIRMED` 등 컬럼 필요.

### 0.7 Level 정의 (백엔드 SubscriptionService와 동기화)

| level | 상수 | 의미 |
|-------|------|------|
| 0 | LevelSuperAdmin | 본사/관리자 |
| 1 | LevelPartner | 총판 |
| 2 | LevelStore | 매장 |
| 10 | LevelMember | 일반 회원 (가입 시 기본) |

### 0.8 권한 매트릭스

| 역할 | 총판 관리 | 매장 관리 | 유저 관리 |
|------|------------|------------|-----------|
| 본사/관리자(0) | ✅ 전체 | ✅ 전체 | ✅ 전체 |
| 총판(1) | — | ✅ 자기 내 매장 | ✅ 그 내 유저 |
| 매장(2) | — | — | ✅ 자기 내 유저 |
| 일반회원(10) | — | — | — |

### 0.9 partners.user_id / stores.user_id — 컬럼 이름과 채워지는 시점

- **DB 컬럼 이름**: `partners` 테이블의 **user_id**, `stores` 테이블의 **user_id** (users 쪽에 `managed_user_id` 같은 컬럼을 두는 방식이 아님).  
  - 그림/ERD에서 이름이 다르다면(예: `manager_user_id`) 위와 동일한 의미로 매핑하면 됨.

- **언제·어떻게 채워지나 (권장: 관리자/총판이 폼으로 등록)**  
  - **partners.user_id**:  
    - **권장**: 관리자가 **총판 관리** 화면에서 총판 등록 시 **이름·이메일·비밀번호**를 함께 입력 → `POST /api/v1/partners` 에서 **user 생성(level=1) + partners 행 생성 시 partners.user_id = 해당 user id** 로 한 번에 처리.  
    - (선택) 예전 방식: partners만 먼저 만들고 **user_id = null** 로 두었다가, `/join?p=partner_A` 로 **처음** 가입한 사람을 총판(level=1)으로 두고 partners.user_id 를 채우는 방식도 가능.  
  - **stores.user_id**:  
    - **권장**: 관리자 또는 총판이 **매장 관리** 화면에서 매장 등록 시 **이름·이메일·비밀번호**를 함께 입력 → `POST /api/v1/stores` 에서 **user 생성(level=2) + stores 행 생성 시 stores.user_id = 해당 user id** 로 한 번에 처리.  
    - (선택) 예전 방식: stores만 먼저 만들고 user_id = null, `/join?s=store_1` 첫 가입자를 매장(level=2)으로 두는 방식도 가능.

- **auth/me**에서:
  - **managed_partner_id**: `partners.user_id = current_user.id` 인 행의 `partners.id` (level=1일 때).
  - **managed_store_id**: `stores.user_id = current_user.id` 인 행의 `stores.id` (level=2일 때).

---

## 1. 인증·가입

### 1.1 POST .../auth/firebase-register

- **Request body**  
  - 기존: `idToken`, `firstName`, `lastName`  
  - **추가(선택)**: `store_id`, `partner_id` (프론트가 쿠키에서 넣어줌)  
  - **level은 보내지 않음** → 백엔드가 아래 규칙으로 설정.

- **처리 (귀속 + level)**  
  - Firebase 검증 후 회원 생성 시:

  1. **store_id 존재**  
     - 해당 `store_id`의 stores 행 조회.  
     - **stores.user_id가 아직 null** → 매장 관리자 가입: `users.store_id`, `users.partner_id`(상위 총판), **users.level = 2**, `stores.user_id = 새 유저 id`.  
     - **stores.user_id가 이미 있음** → 해당 매장 회원: **users.level = 10**.

  2. **store_id 없고 partner_id만 존재**  
     - 해당 `partner_id`의 partners 행 조회.
     - **partners.user_id가 아직 null인 경우**  
       - **총판 본인이 가입하는 것**으로 간주.  
       - `users.partner_id = partner_id`, **users.level = 1 (총판)**  
       - `partners.user_id = 새 유저 id` 로 업데이트 (이 계정이 해당 총판 관리자).
     - **partners.user_id가 이미 있는 경우**  
       - 해당 총판 아래 회원 가입.  
       - `users.partner_id = partner_id`, **users.level = 10 (일반회원)**.

  3. **둘 다 없음**  
     - 본사 직속 (store_id, partner_id null), **users.level = 10 (일반회원)**.

  - 가입 시점에 귀속·level 확정, 이후 일반 회원은 변경 불가 (관리자만 변경 가능하도록 정책 유지).

- **⚠️ level이 항상 10(일반회원)으로만 저장될 때**  
  - 프론트는 `store_id`/`partner_id`만 보냅니다. **level은 백엔드에서 반드시 위 규칙으로 설정**해야 합니다.  
  - **총판 링크로 가입했는데도 level=10**이면 → `firebase-register` 안에서 **partner_id 수신 시 해당 partners 행을 조회**하고, **partners.user_id === null**이면 새 유저를 **level = 1**로 저장한 뒤 **partners.user_id = 새 유저 id** 로 업데이트하는 분기인이 누락된 상태입니다.  
  - 동일하게, **store_id** 수신 시 **stores.user_id === null**이면 **level = 2** + **stores.user_id** 업데이트가 필요합니다.

---

## 2. GET .../api/v1/auth/me (또는 동일 역할 엔드포인트)

- **응답에 추가**  
  - **managed_partner_id** (string | null): level=1(총판)일 때, 해당 유저가 관리하는 총판 ID.  
  - **managed_store_id** (string | null): level=2(매장)일 때, 해당 유저가 관리하는 매장 ID.  
  - 기존 `level`, `store_id`, `partner_id` 등 유저 정보 유지.

---

## 3. 총판(Partners) API

- **목록**  
  - `GET /api/v1/partners` (또는 동일 경로)  
  - **관리자 전용.** (총판 계정이 호출 시 403 Forbidden 등으로 거부.)  
  - 응답: 총판 목록 (id, **nick_name**, commissionRatePercent, walletNetwork, walletAddress, manager_user_id, createdAt 등). **표시에는 nick_name 사용 권장.**
- **단건 조회 (총판 본인 표시명용)**  
  - `GET /api/v1/partners/:id`  
  - **권한**  
    - **관리자(level=0)**: 모든 `:id` 조회 가능.  
    - **총판(level=1)**: **현재 사용자의 `managed_partner_id`와 `:id`가 일치할 때만** 200 반환. 그 외 id 요청 시 403 또는 404.  
    - 그 외(매장·일반회원): 403.  
  - **응답**: 단일 총판 객체.  
    - 예: `{ "partner": { "id": "5", "nick_name": "총판관리자", "commission_rate_percent": 40, "wallet_network": "TRON", "wallet_address": "...", "manager_user_id": 17, "created_at": "..." } }`  
    - 또는 `{ "id": "5", "nick_name": "총판관리자", ... }` (프론트는 `data.partner ?? data` 로 수신).  
  - **용도**: 총판 계정으로 유저 관리 페이지 접속 시, `GET /api/v1/partners`는 호출하지 않고 이 API로 **자기 총판 한 건만** 조회해 "Partner · 총판관리자 (총판관리자)" 등 표시에 사용.
- **생성 (Firebase Auth 경유 회원가입 + 총판 레코드 동시 생성)**  
  - `POST /api/v1/partners`  
  - **Request body**:  
    - `id` (총판 ID), **`nickName` (표시명, optional)**  
    - `firstName`, `lastName`, `email`, `password`  
    - `commissionRatePercent`, `walletNetwork`, `walletAddress`  
  - **처리 (일반 회원가입과 동일한 Firebase 절차)**  
    1. 이메일 중복 검사 (기존 users / Firebase 동일 이메일 여부).  
    2. **Firebase Admin SDK**로 해당 이메일·비밀번호로 **Firebase Auth 사용자 생성**.  
    3. 생성된 Firebase UID로 **백엔드 users** 생성 (level=1, …).  
    4. **partners** 행 생성 (id, **nick_name**, commission_rate_percent, wallet_network, wallet_address, **user_id**).  
  - 관리자 전용.  
  - 총판 가입 링크 `/join?p={id}` 는 **일반 회원(level=10)** 이 해당 총판 아래로 귀속 가입할 때만 사용. 총판 본인 계정은 이 API로만 생성.
- **수정**  
  - `PATCH /api/v1/partners/:id`  
  - Request body: `nickName`, `commissionRatePercent`, `walletNetwork`, `walletAddress` (일부만 보내도 됨).  
  - 관리자 전용.
- **삭제**  
  - `DELETE /api/v1/partners/:id`  
  - 관리자 전용. 하위 매장·유저 정책은 백엔드에서 정의.

---

## 4. 매장(Stores) API

- **목록**  
  - `GET /api/v1/stores?partner_id={id}` (선택)  
  - **관리자**: partner_id 생략 시 **전체**(본사 직속 + 총판별 매장 포함), 지정 시 해당 총판 매장만.  
  - **총판(level=1)**: 자신의 `managed_partner_id`로만 조회 가능하도록 권한 제한.  
  - **매장(level=2)**: 목록 API 호출 시 403 등으로 거부. (매장관리자는 단건 조회만 사용.)  
  - 응답 시 `partner_id`가 null이면 프론트에서 "본사 직속"으로 표시.
- **단건 조회 (매장 본인 표시명용)**  
  - `GET /api/v1/stores/:id`  
  - **권한**  
    - **관리자(level=0)**: 모든 `:id` 조회 가능.  
    - **총판(level=1)**: 자신이 관리하는 매장(해당 총판 소속)의 id만 조회 가능.  
    - **매장(level=2)**: **현재 사용자의 `managed_store_id`와 `:id`가 일치할 때만** 200 반환. 그 외 id 요청 시 403 또는 404.  
    - 그 외(일반회원): 403.  
  - **응답**: 단일 매장 객체.  
    - 예: `{ "store": { "id": "2", "nick_name": "매장관리자", "partner_id": "5", "commission_rate_percent", "wallet_network", "wallet_address", "user_id", "created_at" } }`  
    - 또는 `{ "id", "nick_name", ... }` (프론트는 `data.store ?? data` 로 수신).  
  - **용도**: 매장 계정으로 유저 관리 페이지 접속 시, `GET /api/v1/stores`는 호출하지 않고 이 API로 **자기 매장 한 건만** 조회해 "Store · 매장관리자 (매장관리자)" 등 표시에 사용.
- **생성 (Firebase Auth 경유 회원가입 + 매장 레코드 동시 생성)**  
  - `POST /api/v1/stores`  
  - **Request body**:  
    - `id` (매장 ID), **`nickName` (표시명, optional)**  
    - **`partnerId` (상위 총판 ID, optional)** — **null 또는 생략 시 본사 직속 매장.**  
    - `firstName`, `lastName`, `email`, `password`  
    - `commissionRatePercent`, `walletNetwork`, `walletAddress`  
  - **처리**: Firebase Auth 사용자 생성 후 users + **stores** 행 생성 (id, **nick_name**, partner_id, …).  
  - **본사 직속 매장**: 관리자만 `partnerId`를 null(또는 미포함)으로 보내 생성 가능.  
  - 관리자 또는 해당 총판만 생성 가능.  
  - 매장 가입 링크 `/join?s={id}` 는 **일반 회원(level=10)** 귀속 가입용. 매장 관리자 계정은 이 API로만 생성.
- **수정**  
  - `PATCH /api/v1/stores/:id`  
  - Request body: `nickName`, `commissionRatePercent`, `walletNetwork`, `walletAddress` (일부만 보내도 됨).  
  - 관리자 또는 해당 매장 소속 총판만.
- **삭제**  
  - `DELETE /api/v1/stores/:id`  
  - 관리자 또는 해당 매장 소속 총판. 하위 유저 정책은 백엔드에서 정의.

---

## 5. 정산(Settlements) API

- **목록**  
  - `GET /api/v1/settlements`  
  - Query: `periodStart`, `periodEnd`, `targetType`(partner|store), `targetId`, `status`, `page`, `per_page`.  
  - 응답: `{ records: SettlementRecord[], total }`.  
  - 관리자: 전체 조회. 총판: 자신의 총판/매장에 해당하는 정산만 조회 가능하도록 권한 제한.
- **정산 레코드 필드** (저장·응답 공통)  
  - 정산 기간(periodStart, periodEnd), 대상 구분(targetType: partner | store), 대상 ID(targetId)  
  - 순매출(netSalesAmount), 수익률(commissionRatePercent), 지급 금액(payoutAmount)  
  - 네트워크(network), 지갑 주소(walletAddress)  
  - 트랜잭션 해시(tx_hash), 지급 상태(status: paid | failed | hold), 지급 일자(paidAt)  
  - 실패 시 실패 사유(failureReason)

---

## 6. 정산·결제 확정·지급 로직 (백엔드 구현)

### 6.1 정산 기준

- **순매출(Net)** = 결제금액 − 부가세 − 환불.
- 정산 기준은 부가세(VAT) 제외 순매출.

### 6.2 결제 확정

- 결제 후 **7일 경과** + 환불 없음 확인 후 결제 상태 **CONFIRMED** 처리.
- 해당 시점에 커미션 확정 (매장·총판·본사 분배 계산 가능 상태로 저장).

### 6.2.1 수익률은 DB 조회 (총판별·매장별 상이)

- **총판 수익률·매장 수익률은 고정값(예: 40%, 30%)이 아님.** 정산 계산 시 **반드시 DB에서 조회**해 사용해야 함.
- **총판 수익률**: 슈퍼관리자가 **총판마다 다르게** 설정 가능 → **partners.commission_rate_percent** 에서 조회.
- **매장 수익률**: 각 총판이 **자기 매장마다 다르게** 설정 가능 (해당 총판 수익률 이하) → **stores.commission_rate_percent** 에서 조회.
- 결제 확정·정산 계산 시 해당 결제가 귀속된 매장(stores.id) / 총판(partners.id)을 찾고, 그 매장의 **stores.commission_rate_percent**, 상위 총판의 **partners.commission_rate_percent** 를 읽어와 커미션 계산에 사용.

### 6.3 커미션 계산 (통일 공식)

**공통**: 순매출(Net) = 결제금액 − 부가세 − 환불. 모든 수익은 **본사 기준 일괄 계산 후 분배**하며, 매장/총판이 직접 지급하는 구조가 아님.

#### 케이스 A: 총판 하위 매장에서 발생한 순매출 (일반)

- (예시) 해당 총판의 **partners.commission_rate_percent** = 40%, 해당 매장의 **stores.commission_rate_percent** = 30%, 순매출 100 USDT:
  - **매장 수익** = 순매출 × 매장 수익률 → 100 × 0.30 = **30 USDT**
  - **총판 수익** = 순매출 × (총판 수익률 − 매장 수익률) → 100 × (0.40 − 0.30) = **10 USDT**
  - **본사 수익** = 순매출 − 매장 − 총판 = 100 − 30 − 10 = **60 USDT** (또는 순매출 × (100% − 총판 수익률) = 100 × 0.60)

#### 케이스 B: 본사 직속 매장에서 발생한 순매출 (상위 총판 없음)

- **stores.partner_id = NULL** 인 본사 직속 매장. **stores.commission_rate_percent** 만 적용 (DB 조회).
  - **매장 수익** = 순매출 × 매장 수익률 (해당 stores.commission_rate_percent)
  - **총판 수익** = 0 (상위 총판 없음)
  - **본사 수익** = 순매출 − 매장 수익

#### 케이스 C: 총판 직속 회원에서 발생한 순매출 (하위 매장 없음)

- 회원이 **store_id 없이 partner_id만** 가진 경우(총판 직속 회원). **partners.commission_rate_percent** 만 적용 (DB 조회).
  - **매장 수익** = 0 (귀속 매장 없음)
  - **총판 수익** = 순매출 × 총판 수익률 (해당 partners.commission_rate_percent)
  - **본사 수익** = 순매출 × (100% − 총판 수익률)

**정리**: 매장이 있으면 “매장 수익 = 순매출 × 매장 수익률”, 총판이 있으면 “총판 수익 = 순매출 × (총판 수익률 − 매장 수익률)”, 본사는 “순매출 − 매장 수익 − 총판 수익”. 본사 직속 매장·총판 직속 회원도 위 공식으로 동일하게 계산(없는 계층은 0 처리).

### 6.4 자동 지급 (10일 단위)

- **주기**: 10일마다 자동 지급 (예: 1~10일 확정분 → 10일, 11~20일 → 20일, 21~말일 → 말일).
- **통화·네트워크**: USDT (TRON 또는 POLYGON 등 문서 명세에 맞게).
- **처리**:  
  - 매장/총판별 지급 금액을 해당 등록 지갑(네트워크/주소)으로 전송.  
  - 전송 후 **정산 페이지 저장 항목**에 맞게 레코드 갱신: tx_hash, status(paid/failed/hold), paidAt, 실패 시 failureReason.

### 6.5 정산 페이지 저장 항목 (문서와 동일)

- 정산 기간, 대상 구분(총판/매장), ID  
- 순매출 기준 금액, 수익률, 지급 금액  
- 네트워크, 지갑 주소  
- 트랜잭션 해시(tx_hash)  
- 지급 상태 (paid / failed / hold)  
- 지급 일자  
- 실패 사유 (있는 경우)

### 6.6 정산 트리 뷰 (프론트 요구사항)

- 프론트 **정산 페이지**에서 수익 구조·관리자별 수익을 한눈에 보여주기 위해 **유저 관리와 동일한 트리 구조**(슈퍼관리자 → 총판 → 매장 / 본사 직속 매장)로 표시합니다.
- **백엔드 추가 API 불필요**: 트리는 `GET /api/v1/partners`, `GET /api/v1/stores`, `GET /api/v1/settlements`만으로 구성합니다.  
  - 정산 목록을 `target_type` + `target_id`로 그룹하여 각 총판/매장 노드에 매핑.
  - 각 레코드로 "순매출 × 수익률 = 지급액" 식을 프론트에서 표시.
- **정산 API 응답**에 다음 필드가 있으면 트리·공식 표시에 충분합니다.  
  - `period_start`, `period_end`, `target_type`(partner|store), `target_id`, `net_sales_amount`, `commission_rate_percent`, `payout_amount`, `network`, `wallet_address`, `tx_hash`, `status`, `paid_at`, `failure_reason`

---

## 7. 백엔드 수정 사항 (프론트 연동 대응)

프론트에서 **유저 관리 트리(슈퍼관리자 → 총판/본사 직속 매장/본사 직속 회원)** 및 **본사 직속 매장 생성**을 사용하므로, 아래를 반드시 반영해야 합니다.

### 7.1 DB

| 항목 | 내용 |
|------|------|
| **stores.partner_id** | **nullable**로 변경. NULL이면 본사 직속 매장. 기존이 NOT NULL이면 `ALTER TABLE stores MODIFY partner_id VARCHAR(...) NULL;` 등으로 수정. |
| FK | partner_id가 NULL 허용이면 FK 제약은 유지해도 됨(NULL은 FK 검사 제외). |

### 7.2 매장 API

| 항목 | 내용 |
|------|------|
| **POST /api/v1/stores** | Request body의 **partnerId를 optional**로. **null 또는 미포함 시 본사 직속 매장**으로 생성. 관리자만 partnerId=null 허용. 총판이 호출 시에는 자신의 managed_partner_id와 동일해야 함. |
| **수익률 검증** | partnerId가 있을 때만 "매장 수익률 ≤ 해당 총판 수익률" 검사. 본사 직속(partnerId null)일 때는 해당 검사 생략. |
| **GET /api/v1/stores** | 관리자가 partner_id 쿼리 없이 호출 시 **전체 목록**(본사 직속 + 총판별 매장) 반환. 응답에 partner_id가 null인 행 포함. |

### 7.3 총판/매장 등록 시 인증 (Firebase)

| 항목 | 내용 |
|------|------|
| **POST /api/v1/partners** | 백엔드에서 users만 생성하지 말고, **Firebase Admin SDK**로 동일 이메일·비밀번호로 Firebase Auth 사용자 생성 후, 해당 Firebase UID로 users + partners 레코드 생성. (0.4절) |
| **POST /api/v1/stores** | 동일하게 **Firebase Admin SDK**로 Firebase 사용자 생성 후 users + stores 생성. |
| **금지** | 비밀번호를 백엔드 DB에 저장하거나, Firebase 없이 users만 insert하는 방식. |

### 7.4 유저/조직 트리 지원

| 항목 | 내용 |
|------|------|
| **GET /api/v1/users** | 관리자: partner_id/store_id 없이 호출 시 **전체 유저** 반환(per_page 등 페이징 가능). 총판: partner_id=자기 managed_partner_id, 매장: store_id=자기 managed_store_id 로 필터. |
| **GET /api/v1/partners** | 관리자 전용. 전체 총판 목록. **응답 각 항목에 manager_user_id(또는 user_id) 포함 권장** — 프론트 유저 관리 트리에서 총판 관리자 계정 표시용. |
| **GET /api/v1/partners/:id** | **단건 조회.** 관리자: 모든 id. 총판(level=1): **자기 managed_partner_id와 :id가 일치할 때만** 200 + 총판 객체(id, nick_name 등) 반환. 그 외 403/404. 총판 계정은 목록 API 대신 이 API만 호출해 본인 총판 표시명 조회. |
| **GET /api/v1/stores** | 관리자: 쿼리 없이 전체(본사 직속 포함). 총판: partner_id=자기 managed_partner_id. **매장(level=2)은 호출 불가(403).** 응답 각 항목에 user_id(매장 관리자) 포함 권장. |
| **GET /api/v1/stores/:id** | **단건 조회.** 관리자: 모든 id. 총판: 자기 소속 매장만. **매장(level=2): 자기 managed_store_id와 :id가 일치할 때만** 200 + 매장 객체 반환. 매장 계정은 목록 API 대신 이 API만 호출해 본인 매장 표시명 조회. |
| **auth/me** | level=1일 때 **managed_partner_id**, level=2일 때 **managed_store_id** 반환 (프론트 트리·권한 분기용). |
| **선택** | GET /api/v1/users 응답에서 level=1 유저에 managed_partner_id, level=2 유저에 managed_store_id 를 넣어주면 프론트 트리에서 "총판 OOO (관리자 이름)" 표시 가능. |

위 항목 적용 후 프론트의 유저 관리 트리·본사 직속 매장 생성과 정상 연동됩니다.

---

## 8. 요약 체크리스트

| 항목 | 담당 | 비고 |
|------|------|------|
| **DB: users에 store_id, partner_id 추가** | 백엔드 | 귀속 저장용 |
| **DB: partners 테이블 신규 (user_id로 managed_partner_id 연결)** | 백엔드 | |
| **DB: stores 테이블 신규 (partner_id nullable, 본사 직속 허용)** | 백엔드 | 7.1 참고 |
| **DB: settlement_records 테이블 신규** | 백엔드 | |
| firebase-register에서 store_id/partner_id 수신 및 users 귀속 저장 | 백엔드 | store 있으면 partner_id 자동 연결 |
| **총판/매장 등록 시 Firebase Admin SDK로 Auth 사용자 생성 후 users+partners/stores 생성** | 백엔드 | 0.4, 7.3 참고 |
| **가입 시 level: 0=본사, 1=총판(partner 첫 가입), 2=매장(store 첫 가입), 10=일반회원** | 백엔드 | partners.user_id / stores.user_id 연결 |
| **auth/me에 managed_store_id, managed_partner_id 반환** | 백엔드 | level=2 → managed_store_id, level=1 → managed_partner_id |
| **GET /api/v1/users** (관리자 전체 / 총판·매장 필터) | 백엔드 | 7.4 참고 |
| **GET /api/v1/partners/:id** (단건 조회, 총판은 자기 managed_partner_id만) | 백엔드 | §3 단건 조회, 7.4 참고 |
| **GET /api/v1/stores/:id** (단건 조회, 매장은 자기 managed_store_id만) | 백엔드 | §4 단건 조회, 7.4 참고 |
| **POST /api/v1/stores 시 partnerId optional, null = 본사 직속** | 백엔드 | 7.2 참고 |
| Partners CRUD + 권한(관리자), **GET /api/v1/partners/:id** (총판 본인만 허용) | 백엔드 | |
| Stores CRUD + 수익률 ≤ 총판(총판 매장만), 권한(관리자/해당 총판), **GET /api/v1/stores/:id** (매장 본인만 허용), 본사 직속 허용 | 백엔드 | |
| Settlements 목록 API + 권한(관리자/해당 총판) | 백엔드 | |
| 결제 확정(7일 경과, CONFIRMED) | 백엔드 | |
| 10일 단위 자동 지급 + USDT 전송 | 백엔드 | |
| 정산 레코드 저장(tx_hash, status, paidAt 등) | 백엔드 | |

프론트는 위 API와 auth/me·firebase-register 스펙에 맞춰 이미 호출·화면을 구현해 두었으므로, 백엔드에서 위 항목 및 **§7 백엔드 수정 사항**을 구현하면 연동이 완료됩니다.
