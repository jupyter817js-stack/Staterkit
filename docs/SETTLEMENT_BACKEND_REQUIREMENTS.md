# 정산 백엔드 요구사항 — 계산만 (자동 지급 미구현)

총판·매장에게 **누가 얼마를, 왜 그렇게 받아야 하는지** 계산한 결과만 API로 제공하는 범위입니다.  
**실제 자동 지급(송금) 기능은 이번에 구현하지 않습니다.**

---

## 1. 범위 정리

| 항목 | 현재 요구사항 |
|------|----------------|
| **정산 계산** | 기간별 순매출 기준으로 총판·매장별 **지급 예정 금액·수익률·근거** 계산 후 API 반환 |
| **수익률** | **반드시 DB에서 조회**. 총판 수익률 → `partners` 테이블, 매장 수익률 → `stores` 테이블. **30%, 40% 등 정적 값 사용 금지** |
| **자동 지급** | 미구현. tx_hash, 실제 송금, paid_at 등은 추후 단계에서 구현 |

---

## 2. 수익률 반드시 DB에서 조회

- **총판 수익률**  
  - 정산 대상이 **총판(partner)** 일 때 사용하는 수익률은 **DB의 `partners` 테이블(또는 동일 도메인 테이블)에 저장된 해당 총판의 수익률**을 사용해야 합니다.  
  - 예: `partners.commission_rate_percent` (또는 백엔드 컬럼명에 맞게).

- **매장 수익률**  
  - 정산 대상이 **매장(store)** 일 때 사용하는 수익률은 **DB의 `stores` 테이블에 저장된 해당 매장의 수익률**을 사용해야 합니다.  
  - 예: `stores.commission_rate_percent`.

- **정적 값 사용 금지**  
  - 30%, 40% 등을 코드/설정에 하드코딩해서 쓰지 말 것.  
  - 총판/매장별로 DB에 저장된 값이 다를 수 있으므로, 항상 해당 총판/매장 레코드에서 조회한 수익률로 계산할 것.

---

## 3. 계산 공식 (DB 수익률 사용)

- **매장 1건에 대한 매장 수익**  
  `payout_amount = net_sales_amount × (stores.commission_rate_percent / 100)`  
  - `net_sales_amount`: 해당 기간·해당 매장 귀속 순매출.  
  - `stores.commission_rate_percent`: **DB의 해당 매장 레코드에서 조회**.

- **총판 1건에 대한 총판 수익** (특정 매장에서 발생한 순매출 기준)  
  `payout_amount = net_sales_amount × ((partners.commission_rate_percent - stores.commission_rate_percent) / 100)`  
  - `partners.commission_rate_percent`: **DB의 해당 총판 레코드에서 조회**.  
  - `stores.commission_rate_percent`: **DB의 해당 매장 레코드에서 조회**.

- **본사 직속 매장**: 매장 수익만 계산(총판 없음).  
- **총판 직속 회원**(매장 없음): 총판 수익률만 적용(매장 수익률 0으로 간주 등 백엔드 정책에 맞게).

- **제약**: 매장 수익률 ≤ 총판 수익률 은 DB에 저장 시점에 보장한다고 가정. 계산 시에는 DB 값을 그대로 사용.

---

## 4. API: GET /api/v1/settlements

### 4.1 역할

- 선택한 **기간(period_start ~ period_end)** 내 확정된 순매출을 기준으로,  
  총판·매장별 **정산 계산 결과**(누가 얼마를, 어떤 수익률로 받아야 하는지)를 목록으로 반환.
- **자동 지급은 하지 않음**. 반환 데이터는 “지급 예정/계산 결과” 용도.

### 4.2 인증

- `Authorization: Bearer <token>` 필수.
- 토큰에서 현재 유저의 `level`, `managed_partner_id`, `managed_store_id` 등을 확인해 권한 필터 적용.

### 4.3 쿼리 파라미터 (선택)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| period_start | string | 기간 시작 (예: YYYY-MM-DD) |
| period_end | string | 기간 끝 |
| target_type | string | "partner" \| "store" |
| target_id | string | 총판 ID 또는 매장 ID |
| status | string | "calculated" \| "pending" \| "paid" \| "failed" \| "hold" (현재는 계산만 하므로 대부분 calculated/pending) |
| page | number | 페이지 |
| per_page | number | 페이지당 개수 (프론트 기본 100) |

### 4.4 권한별 필터링

- **본사/관리자**: 전체 총판·매장에 대한 정산 계산 결과 조회 가능.
- **총판**: `target_type=partner` 이고 `target_id=본인 총판 ID` 인 건 + 본인 하위 매장(`target_type=store`, target_id ∈ 본인 소속 매장 ID)만.
- **매장**: `target_type=store` 이고 `target_id=본인 매장 ID` 인 건만.

### 4.5 응답 (JSON)

- 배열 키: `records` 또는 `settlements` 둘 다 프론트에서 처리 가능.
- 필드명: 프론트는 **camelCase** 기준. snake_case만 지원 시 백엔드에서 camelCase로 내려주거나, 프론트에서 정규화 필요.

```json
{
  "records": [
    {
      "id": "string | number",
      "periodStart": "YYYY-MM-DD",
      "periodEnd": "YYYY-MM-DD",
      "targetType": "partner | store",
      "targetId": "string",
      "netSalesAmount": 100,
      "commissionRatePercent": 30,
      "payoutAmount": 30,
      "network": "TRON",
      "walletAddress": "Txxxx...",
      "txHash": null,
      "status": "calculated",
      "paidAt": null,
      "failureReason": null
    }
  ],
  "total": 100
}
```

### 4.6 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string \| number | ✅ | 정산(계산) 레코드 ID |
| periodStart | string | ✅ | 정산 기간 시작 |
| periodEnd | string | ✅ | 정산 기간 끝 |
| targetType | "partner" \| "store" | ✅ | 총판 정산 / 매장 정산 |
| targetId | string | ✅ | 총판 ID 또는 매장 ID |
| netSalesAmount | number | ✅ | 해당 대상의 해당 기간 순매출 (USDT) |
| commissionRatePercent | number | ✅ | **DB에서 조회한** 적용 수익률 (%) |
| payoutAmount | number | ✅ | 계산된 지급 예정 금액 (USDT) |
| network | string | ✅ | 해당 총판/매장의 지갑 네트워크 (DB에서 조회) |
| walletAddress | string | ✅ | 해당 총판/매장의 지갑 주소 (DB에서 조회) |
| txHash | string \| null | - | 현재 단계에서는 null. 추후 지급 구현 시 사용 |
| status | string | ✅ | "calculated" 또는 "pending" 권장. (paid/failed/hold는 추후 지급 단계) |
| paidAt | string \| null | - | 현재 단계에서는 null |
| failureReason | string \| null | - | 현재 단계에서는 null |

- **commissionRatePercent**:  
  - 매장 레코드 → `stores` 테이블의 해당 매장 수익률.  
  - 총판 레코드 → `partners` 테이블의 해당 총판 수익률.  
  - **정적 값(30%, 40% 등) 사용 금지.**

- **network, walletAddress**:  
  - 각각 해당 총판/매장의 `partners` / `stores` 테이블에 저장된 지갑 네트워크·주소를 사용.

---

## 5. 백엔드 처리 흐름 (계산만)

1. **기간·권한 확정**  
   - 쿼리에서 `period_start`, `period_end` 수신.  
   - 토큰으로 현재 유저 역할(본사/총판/매장) 및 managed_partner_id, managed_store_id 확정.

2. **순매출 집계**  
   - 결제 확정(예: 7일 경과·환불 없음)된 건만 대상으로, 기간 내 순매출을 **매장 단위·총판 단위**로 집계.  
   - 회원 귀속(store_id, partner_id)에 따라 어떤 매장/총판 소속인지 결정.

3. **수익률·지갑 정보 조회**  
   - 정산 대상이 되는 각 **총판 ID**에 대해 `partners` 테이블에서 `commission_rate_percent`, `wallet_network`, `wallet_address` 조회.  
   - 정산 대상이 되는 각 **매장 ID**에 대해 `stores` 테이블에서 `commission_rate_percent`, `wallet_network`, `wallet_address` 조회.  
   - **여기서 조회한 수익률만** 사용해 금액 계산. 정적 값 사용 금지.

4. **금액 계산**  
   - 매장: `payout_amount = net_sales_amount × (매장 수익률 / 100)`  
   - 총판: `payout_amount = net_sales_amount × ((총판 수익률 − 매장 수익률) / 100)`  
   - 본사 직속 매장/총판 직속 회원은 위 공식에서 해당하는 항만 적용.

5. **레코드 구성·권한 필터**  
   - 각 건에 대해 `periodStart`, `periodEnd`, `targetType`, `targetId`, `netSalesAmount`, `commissionRatePercent`, `payoutAmount`, `network`, `walletAddress` 채움.  
   - `status` 는 "calculated" 또는 "pending", `txHash`/`paidAt`/`failureReason` 은 null.  
   - 권한에 맞게 필터링 후 `records`(또는 `settlements`) + `total` 로 반환.

---

## 6. 체크리스트 (백엔드 검증용)

- [ ] 총판 수익률을 **partners 테이블(DB)** 에서만 조회하여 사용하는가? (정적 40% 등 사용 안 함)
- [ ] 매장 수익률을 **stores 테이블(DB)** 에서만 조회하여 사용하는가? (정적 30% 등 사용 안 함)
- [ ] GET /api/v1/settlements 응답에 `commissionRatePercent`, `payoutAmount`, `network`, `walletAddress` 가 DB 기반 계산/조회 결과인가?
- [ ] 현재 단계에서 자동 지급(송금) 로직을 호출하지 않는가?
- [ ] 권한별로 관리자/총판/매장이 볼 수 있는 target_id 범위가 제한되는가?
- [ ] (선택) GET /api/v1/settlements/tree 응답에 **totalPayoutAmount** 포함 시, 해당 기간 총 지급 예정액(USDT)을 한 번에 표시할 수 있음. 없으면 프론트에서 트리 노드의 settlement.payoutAmount 를 합산해 사용.

---

## 7. GET /api/v1/settlements/tree — 총 지급 예정액(총수익 표시용)

트리 구조와 함께 **해당 기간 총 지급 예정액**을 내려주면, 프론트에서 슈퍼관리자 옆에 "총 지급 예정: N USDT" 를 그대로 표시할 수 있습니다.

- **응답에 선택 필드 추가**  
  - `totalPayoutAmount` (number): 해당 기간 내 모든 총판·매장 정산의 `payoutAmount` 합계 (USDT).  
  - 없어도 됨. 없으면 프론트가 트리 노드의 `settlement.payoutAmount` 를 합산해 표시함.

---

이 문서를 기준으로 “계산만” 범위의 정산 백엔드를 구현하면 됩니다.  
자동 지급·tx_hash·paid_at 등은 추후 요구사항이 정해지면 별도 문서로 확장하는 것을 권장합니다.
