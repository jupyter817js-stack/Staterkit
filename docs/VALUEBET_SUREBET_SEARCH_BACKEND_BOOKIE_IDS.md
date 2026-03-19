# Valuebet / Surebet 검색 API — 부키 다중 선택 (백엔드 수정사항)

## 개요

프론트엔드에서 **밸류벳**·**슈어벳** 검색 시 부키(북메이커)를 **다중 선택**할 수 있도록 UI를 변경했습니다.  
이에 맞춰 검색 요청은 **단일 `bookie_id`** 대신 **`bookie_ids[]`** 배열을 지원하도록 백엔드를 수정해야 합니다.

---

## 요청 스펙 (POST, application/x-www-form-urlencoded)

### 기존 (단일 부키)

- `bookie_id`: number (단일 북메이커 ID)
- 없으면: 전체 부키

### 변경 후 (다중 부키)

- **`bookie_ids[]`**: number[] (북메이커 ID 배열)
  - 프론트는 `bookie_ids[]` 파라미터를 **여러 개** 보냅니다.  
    예: `bookie_ids[]=1&bookie_ids[]=2&bookie_ids[]=5`
- **`bookie_ids[]`가 없거나 비어 있으면**: **전체 부키**로 검색 (기존과 동일)
- **`bookie_ids[]`가 하나 이상 있으면**: 해당 ID들만 필터

### 하위 호환

- 기존처럼 **`bookie_id`** (단일)만 오는 요청도 계속 처리해도 됩니다.  
  `bookie_ids[]`가 없고 `bookie_id`가 있으면 → 해당 단일 부키로만 필터.

---

## 적용 대상 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST   | `/api/v1/valuebets/search` | 밸류벳 검색 |
| POST   | `/api/v1/surebets/search` | 슈어벳 검색 |

두 엔드포인트 모두 동일한 규칙으로 수정하면 됩니다.

---

## 프론트엔드 전송 예시

- **전체 부키**: `bookie_ids[]` 미전송 (또는 빈 배열)
- **부키 1, 2, 5 선택**:
  ```
  pagenum=10
  islive=false
  bookie_ids[]=1
  bookie_ids[]=2
  bookie_ids[]=5
  sport_ids[]=1
  sport_ids[]=2
  ```

---

## 백엔드 구현 가이드

1. **파라미터 파싱**
   - `bookie_ids[]` (또는 `bookie_ids`) 배열로 수신.
   - 언어/프레임워크별로 배열 키는 보통 `bookie_ids[]` 또는 `bookie_ids`로 올 수 있으므로 둘 다 처리 권장.

2. **필터 로직**
   - `bookie_ids`가 없거나 빈 배열 → 부키 조건 없음(전체).
   - `bookie_ids`가 있음 → `bookmaker_id IN (?)` 형태로 필터.

3. **우선순위**
   - `bookie_ids[]`가 있으면 그것만 사용.
   - 없을 때만 기존 `bookie_id`(단일) 사용 → 한 개만 있어도 배열 1개로 취급해 필터.

---

## 정리

| 항목 | 내용 |
|------|------|
| 새 파라미터 | `bookie_ids[]` (배열) |
| 없을 때 | 전체 부키 |
| 있을 때 | 해당 ID들만 필터 |
| 레거시 | `bookie_id` (단일) 유지 가능 |

이 규칙으로 **Valuebet 검색**과 **Surebet 검색** API를 수정하면 프론트와 동일한 동작을 보장할 수 있습니다.
