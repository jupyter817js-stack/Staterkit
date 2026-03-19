# 총판·매장·정산 – 프론트엔드(Next.js) 구현 현황

총판 → 매장 → 회원 구조 및 링크 기반 자동 귀속·정산에 대해 **프론트에서 구현된 내용**을 정리한 문서입니다.  
기준 문서: `docs/[총판 → 매장 → 회원 구조  링크 기반 자동 귀속 및 정산.txt`

---

## 1. 구현 요약

| 구분 | 내용 |
|------|------|
| **가입** | 가입 페이지는 **1개** (`/join`). `/signup`은 쿼리 유지하며 `/join`으로 리다이렉트. |
| **귀속** | URL 쿼리 `p`(총판ID), `s`(매장ID) → 접속 시 쿠키 저장 → 가입 완료 시 백엔드에 `store_id`/`partner_id` 전달. |
| **역할** | `User`에 `storeId`/`partnerId`, `CurrentUser`에 `managed_partner_id`/`managed_store_id`. 레벨 0=본사, 1=총판, 2=매장, 10=일반회원. |
| **관리** | 관리자: 총판 관리(/partners), 매장·정산 조회. 총판: 매장 관리(/stores), 정산 조회(/settlements). |
| **메뉴** | 사이드바 "관리" 섹션: 관리자만 사용자/결제/총판, 관리자·총판 모두 매장·정산 노출. |

---

## 2. 타입·상수

### 2.1 `shared/types/partner-store.ts`

- **쿼리/쿠키 상수**  
  - `JOIN_QUERY_PARTNER` = `"p"`, `JOIN_QUERY_STORE` = `"s"`  
  - `COOKIE_STORE_ID`, `COOKIE_PARTNER_ID` (귀속 저장용 쿠키 키)
- **인터페이스**  
  - `Partner`: id, commissionRatePercent, walletNetwork, walletAddress, createdAt  
  - `Store`: id, partnerId, commissionRatePercent, walletNetwork, walletAddress, createdAt  
  - `SettlementRecord`: periodStart/End, targetType(partner|store), targetId, netSalesAmount, commissionRatePercent, payoutAmount, network, walletAddress, txHash, status(paid|failed|hold), paidAt, failureReason  

### 2.2 `shared/types/users.ts`

- **User**  
  - `store_id` / `storeId`, `partner_id` / `partnerId` (귀속)
- **CurrentUser**  
  - `managed_partner_id` / `managedPartnerId` (총판인 경우 본인 총판 ID)
- **역할**  
  - `USER_LEVEL.PARTNER = 1`, `USER_LEVEL.STORE = 2`, `USER_LEVEL.USER = 10` (백엔드와 동기화)

---

## 3. 귀속(Attribution) 유틸

### 3.1 `shared/utils/attribution.ts`

- **saveAttributionFromQuery(query)**  
  - URL 쿼리에서 `p`, `s` 읽어 쿠키에 저장. `s`가 있으면 매장 귀속(총판은 매장으로부터 자동 연결).
- **getAttributionFromCookie()**  
  - 쿠키에서 `{ store_id?, partner_id? }` 반환. 가입 API 호출 시 사용.
- **clearAttributionCookie()**  
  - 가입 완료 후 쿠키 삭제.

---

## 4. 인증·가입

### 4.1 `shared/api/auth.ts`

- **registerWithFirebaseToken(idToken, firstName, lastName, options?)**  
  - `options.store_id`, `options.partner_id`가 있으면 body에 포함하여 백엔드 `POST .../auth/firebase-register` 호출.  
  - 가입 성공 시 응답 토큰을 localStorage에 저장.

### 4.2 `shared/api/users.ts`

- **normalizeUser**  
  - API 응답의 `store_id`/`storeId`, `partner_id`/`partnerId` 매핑.
- **normalizeCurrentUser**  
  - `managed_partner_id` / `managedPartnerId` 매핑 (총판 본인 ID).

---

## 5. 가입 페이지·라우팅

### 5.1 `pages/join.tsx`

- 마운트 시 `router.query`로 **saveAttributionFromQuery** 호출.
- 폼 제출 시: **getAttributionFromCookie()** → **registerWithFirebaseToken(..., attribution)** → **clearAttributionCookie()** 후 대시보드로 이동.
- URL에 `p` 또는 `s`가 있으면:  
  - "링크로 접속하셨습니다. 가입 시 해당 매장/총판에 자동 귀속됩니다." 문구 표시.

### 5.2 `pages/signup.tsx`

- 쿼리 유지한 채 **/join**으로 리다이렉트.

### 5.3 랜딩·로그인

- 기존 `/signup` 링크를 **/join**으로 사용 (쿼리 유지).

---

## 6. API 모듈 (백엔드 연동 가정)

### 6.1 `shared/api/partners.ts`

- **listPartners()** – 총판 목록
- **createPartner({ id, commissionRatePercent, walletNetwork, walletAddress })** – 총판 생성
- **getPartnerJoinLink(partnerId)** – `/join?p={id}` 형태 링크 반환

### 6.2 `shared/api/stores.ts`

- **listStores(partnerId?)** – 매장 목록 (선택적으로 총판별)
- **createStore({ id, partnerId, commissionRatePercent, walletNetwork, walletAddress })** – 매장 생성
- **getStoreJoinLink(storeId)** – `/join?s={id}` 형태 링크 반환

### 6.3 `shared/api/settlements.ts`

- **listSettlements(params?)**  
  - periodStart, periodEnd, targetType, targetId, status, page, per_page  
  - 반환: `{ records: SettlementRecord[], total }`

---

## 7. 페이지

### 7.1 `pages/partners.tsx` (관리자 전용)

- 총판 목록 테이블 + 생성 폼 (ID, 수익률, 지갑 네트워크, 지갑 주소).
- 행별 "링크 복사" → **getPartnerJoinLink(partnerId)**.

### 7.2 `pages/stores.tsx` (관리자 또는 총판)

- **관리자**: 총판 선택 드롭다운 + 전체 매장 목록.
- **총판**: `currentUser.managedPartnerId`로 자신 소속 매장만.
- 매장 생성 폼 + 목록, "링크 복사" → **getStoreJoinLink(storeId)**.  
- 총판인데 `managed_partner_id` 없으면 "총판 정보가 없습니다" 안내.

### 7.3 `pages/settlements.tsx` (관리자 또는 총판)

- 정산 목록 테이블: 기간, 대상 구분, 대상 ID, 순매출, 수익률, 지급 금액, 네트워크, 지급 상태, tx_hash 등.

---

## 8. 사이드바·메뉴

### 8.1 `shared/layout-components/sidebar/nav.tsx`

- "관리" 섹션: **adminOrPartnerOnly** (관리자·총판 모두 진입).
- 자식 메뉴:  
  - 사용자 관리, 결제 관리, 총판 관리: **adminOnly**  
  - 매장 관리, 정산 관리: **partnerOnly** (관리자도 노출).

### 8.2 `shared/layout-components/sidebar/sidebar.tsx`

- **visibleMenuItems**:  
  - 상위: adminOnly, adminOrPartnerOnly, partnerOnly, proOnly 기준 필터.  
  - "관리" 하위 자식: adminOnly(사용자/결제/총판), partnerOnly(매장/정산) 기준으로 필터.  
  - 자식이 하나도 없으면 해당 상위 메뉴 숨김.
- 총판(PARTNER)일 때: 매장 관리, 정산 관리만 표시.

---

## 9. i18n

`shared/i18n/translations.ts` (ko/en):

- partnerManagement, storeManagement, settlementManagement  
- partners, stores, settlements  
- partnerJoinLink, storeJoinLink  
- commissionRate, walletNetwork, walletAddress  
- addPartner, addStore  
- period, targetType, payoutAmount, payoutStatus, txHash  

---

## 10. 프론트가 기대하는 백엔드 연동

- **POST .../auth/firebase-register**  
  - body에 `store_id`, `partner_id` (선택) 수신 후 회원 귀속 저장.
- **GET .../api/v1/auth/me**  
  - 응답에 `managed_partner_id` (총판 계정일 때 본인 총판 ID) 포함.
- **총판/매장/정산 API**  
  - 스펙은 `docs/BACKEND_PARTNER_STORE.md` 참고.  
  - 미구현 시 프론트는 호출만 하며, 실패 시 빈 목록 또는 에러 메시지 처리.

---

이 문서는 **현재 프론트에 구현된 범위**를 기술합니다. 정산 로직(7일 확정, 10일 지급, USDT 전송 등)은 백엔드에서 수행하며, 백엔드 할 일은 `BACKEND_PARTNER_STORE.md`에 정리되어 있습니다.
