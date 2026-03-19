# Valuebets 검색 응답 — bookmaker_event_name, bookmaker_league_name

## 현재 상태

**POST /api/v1/valuebets/search** 응답의 `bets[]` 각 항목에 이미 `bookmaker_event_name`, `bookmaker_league_name`이 포함되어 있음 (예: `"Canada - Colombia"`, `"First Round Pool A.World Baseball Classic. WBC. baseball. World Baseball Classic"`).

## 프론트엔드 반영

- `ValueBetTipDisplay`에 `bookmaker_event_name`, `bookmaker_league_name` 추가.
- `extractValueBetTips` / `extractValueBetTipsAsync`에서 API 응답의 bet 객체에서 위 필드를 읽어 tip에 세팅.
- 밸류벳 카드 클릭 시 `sendArbClickValuebet`으로 arb-clicks API에 `bookmaker_event_name`, `bookmaker_league_name`을 슈어벳과 동일하게 전달.
