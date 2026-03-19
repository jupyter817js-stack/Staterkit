# 정적 팁 표시 데이터 API (밸류벳/슈어벳)

밸류벳·슈어벳 카드에 부키명, 스포츠명, 마켓 표시를 보여주기 위해 **정적 데이터**를 한 번에 조회해 프론트에서 캐시해 사용합니다.  
개별 팁마다 부키/스포츠/마켓 API를 반복 호출하지 않도록 아래 API를 제공해야 합니다.

---

## 1. 부키(북메이커) 목록 — 한 번에 전체 조회

**엔드포인트:** `GET /api/v1/bookmakers`

**역할:** 필터 옵션 + 팁 카드 내 부키명 표시용. 프론트는 이 목록을 한 번 불러와 `id → bookmakersName` 맵으로 캐시합니다.

**응답 예시:**
```json
[
  { "id": 1, "bookmakersName": "Bet365" },
  { "id": 2, "bookmakersName": "Unibet" }
]
```

**참고:** 기존 단건 조회 `GET /api/v1/bookmakers/:id` 는 팁 표시 경로에서는 더 이상 사용하지 않습니다(목록 한 번 조회 후 맵 조회).

---

## 2. 스포츠 목록 — 한 번에 전체 조회

**엔드포인트:** `GET /api/v1/sports`

**역할:** 필터 옵션 + 팁 카드 내 스포츠명 표시용. 프론트는 이 목록을 한 번 불러와 `id → name` 맵으로 캐시합니다.

**응답 예시:**
```json
[
  { "id": 1, "name": "Soccer" },
  { "id": 2, "name": "Basketball" }
]
```

**참고:** 기존 단건 조회 `GET /api/v1/sports/:id` 는 팁 표시 경로에서는 더 이상 사용하지 않습니다(목록 한 번 조회 후 맵 조회).

---

## 3. 마켓 표시 — 배치 조회 (캐시 보강용)

**엔드포인트:** `POST /api/v1/markets/display/batch`

**역할:** `(market_and_bet_type, market_and_bet_type_param)` 쌍에 대한 표시 문자열(또는 line/market 분리)을 한 번에 조회.  
프론트는 **응답 결과를 메모리 캐시**에 넣어 두고, 같은 (type, param)은 5초 갱신 시 재요청하지 않습니다.

**요청 본문:**
```json
[
  { "marketAndBetType": 488, "marketAndBetTypeParam": 0 },
  { "marketAndBetType": 489, "marketAndBetTypeParam": 55 }
]
```

**응답 예시:**
```json
[
  {
    "marketAndBetType": 488,
    "marketAndBetTypeParam": 0,
    "display": "+0.5 - AH1 - Total",
    "line": "+0.5",
    "market": "AH1 - Total"
  }
]
```

- `display`: 전체 표시 문자열 (line/market 미제공 시 " - " 기준으로 파싱해 사용)
- `line`, `market`: (선택) 있으면 그대로 사용

---

## 4. (선택) 마켓 전체 사전 한 번에 조회

배치 호출도 줄이고 싶다면, **마켓 표시 전체 사전**을 한 번에 내려주는 API를 추가할 수 있습니다.

**예시 엔드포인트:** `GET /api/v1/markets/display`

**응답 예시:**
```json
{
  "items": [
    {
      "marketAndBetType": 488,
      "marketAndBetTypeParam": 0,
      "display": "+0.5 - AH1 - Total",
      "line": "+0.5",
      "market": "AH1 - Total"
    }
  ]
}
```

프론트에서 이 목록을 한 번 로드해 `(type_param) → { line, market }` 맵으로 캐시하면, 배치 API는 신규/미캐시 (type, param) 발생 시에만 호출하거나 생략할 수 있습니다.

---

## 5. 프론트 동작 요약

| 데이터   | 조회 시점              | 저장 위치        | 5초 갱신 시           |
|----------|-------------------------|------------------|------------------------|
| 부키     | 페이지 로드 시 1회     | bookmakerOptions → Map | 추가 요청 없음 (맵 조회) |
| 스포츠   | 페이지 로드 시 1회     | sportOptions → Map     | 추가 요청 없음 (맵 조회) |
| 마켓     | 팁 데이터 로드 시 배치 | 메모리 캐시 (전역 Map) | 캐시에 없는 (type,param)만 배치 요청 |

이 구성을 위해 백엔드는 **1, 2, 3번 API**를 유지하면 되고, 4번은 선택입니다.
