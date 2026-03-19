# 정산(Settlement) 로직 설명 — 계산만 (프론트 + 백 연동)

**현재 범위**: 총판·매장에게 **누가 얼마를, 왜 그렇게 받아야 하는지** 계산해서 보여주는 기능만 구현.  
**자동 지급**은 추후 구현 예정.

---

## 1. 비즈니스 규칙 요약

- **구조**: 본사 → 총판(Partner) → 매장(Store) → 회원. 매장은 총판 소속 또는 **본사 직속**.
- **귀속**: 회원은 가입 시 링크(`/join?p=총판ID`, `/join?s=매장ID`)로만 귀속.
- **정산 기준**: 부가세(VAT) 제외 **순매출(Net)**. 결제 후 7일 경과·환불 없음 시 확정 등은 백엔드 정책.
- **현재 구현**: 기간별 순매출을 기준으로 **수익 계산 결과**만 API로 내려주고, 프론트는 트리/목록으로 “누가 얼마 받아야 하는지, 왜 그 금액인지” 표시.

---

## 2. 수익(커미션) 계산 공식

- **매장 수익**  
  `매장 수익 = 순매출 × 매장 수익률`  
  - **수익률**: 반드시 **DB의 해당 매장(store) 수익률**을 사용. 정적 값(예: 30%) 사용 금지.

- **총판 수익** (총판 하위 매장에서 발생한 순매출 기준)  
  `총판 수익 = 순매출 × (총판 수익률 − 매장 수익률)`  
  - **수익률**: 반드시 **DB의 해당 총판(partner) 수익률**과 **해당 매장(store) 수익률**을 사용. 정적 값(예: 40%, 30%) 사용 금지.

- **본사 수익**  
  `본사 수익 = 순매출 − 매장 수익 − 총판 수익`

- **본사 직속 매장**: 매장 수익만 적용. **총판 직속 회원**(매장 없음): 총판 수익률만 적용.
- **제약**: 매장 수익률 ≤ 총판 수익률 (DB에 저장된 값 기준).

---

## 3. 프론트엔드 동작

### 3.1 접근 권한

| 역할 | 접근 |
|------|------|
| 본사/관리자 | 전체 총판·매장·정산 계산 목록 |
| 총판 | 본인 + 본인 하위 매장만 |
| 매장 | 본인 매장 + 소속 총판만 |

### 3.2 데이터 로드

1. `getCurrentUser()` → 권한·managed_partner_id / managed_store_id 확인.
2. `listSettlements(params)` → `GET /api/v1/settlements` (기간·대상·페이징).
3. 총판/매장: 관리자는 `listPartners()`, `listStores()` / 총판·매장은 각각 본인만.
4. `buildSettlementTree(partners, stores, records)` 로 트리 구성 후, 트리/테이블에 “누가 얼마, 왜” 표시.

### 3.3 화면

- **설명 문구**: “선택한 기간의 순매출을 기준으로, 총판·매장별로 **누가 얼마를 받아야 하는지** 계산한 내역입니다. (실제 자동 지급 기능은 추후 구현 예정)”
- **수익 구조**: 예시는 30%, 40%로 표기하되, “실제 정산 계산 시에는 **DB에 저장된 총판·매장별 수익률**을 사용합니다”라고 안내.
- **상태**: `calculated` / `pending` / `hold` → “계산됨”, `paid` → “지급완료”, `failed` → “실패”. (현재 단계에서는 대부분 “계산됨”)

---

## 4. 참고 파일

| 경로 | 역할 |
|------|------|
| `shared/api/settlements.ts` | GET /api/v1/settlements 호출 |
| `shared/types/partner-store.ts` | SettlementRecord, Partner, Store |
| `shared/utils/settlementTree.ts` | buildSettlementTree |
| `pages/settlements.page.tsx` | 정산 페이지 |
| `pages/components/settlements/SettlementTreeView.tsx` | 트리 UI |
| `docs/SETTLEMENT_BACKEND_REQUIREMENTS.md` | **백엔드 요구사항 상세 (수익률 DB 조회 등)** |

백엔드 구현 시 반드시 **`docs/SETTLEMENT_BACKEND_REQUIREMENTS.md`** 를 참고하세요. 수익률은 DB에서 조회해야 합니다.
