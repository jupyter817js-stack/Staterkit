# 새 결제 시스템 요구사항

기존 NOWPayments 기반 구독 결제와 완전히 다른 **암호화폐 결제 시스템** 구축을 위한 요구사항 정리입니다.

---

## 1. 총체적 요구사항

- **프론트 ↔ 메인 백엔드 통신**: **Rsignal** 사용 (REST 대체 또는 병행)
- **결제 방식**: 이메일 발송 → **직접 인보이스 생성 + 결제 URL 반환**
- **플랜 조회**: API에서 플랜 목록 동적 조회
- **결제 통화**: 사용자가 currency + network 선택 (USDT TRON/TRC20, USDT POLYGON)
- **인보이스**: 생성 후 상태 조회 가능 (폴링)

---

## 2. API 스펙

| 구분 | 경로 | 설명 |
|------|------|------|
| 플랜 목록 | `GET /api/v1/plans` | 구독 플랜 조회 |
| 구독 인보이스 | `POST /api/v1/subscription/create` | planId, currency, network, userId |
| 인보이스 생성 | `POST /payment/api/v1/invoice` | (상세 미정) |
| 인보이스 상태 | `GET /payment/api/v1/invoice/{id}` | 상태 조회 |

상세: `crypto_payment_openapi.yaml`

---

## 3. 부문별 해야 할 사항

### 3.1 프론트엔드

| 항목 | 상태 | 비고 |
|------|------|------|
| Rsignal 연동 | ⏳ 대기 | 프론트 ↔ 메인 백엔드 통신을 Rsignal로 전환 |
| API 클라이언트 | ✅ 완료 | `shared/api/crypto-payment.ts` |
| 타입 정의 | ✅ 완료 | `shared/types/crypto-payment.ts` |
| CryptoSubscriptionModal | ✅ 완료 | 플랜/통화 선택, 인보이스 생성 |
| 랜딩 페이지 연동 | ✅ 완료 | Standard/Pro 버튼 → CryptoSubscriptionModal |
| 인보이스 폴링 / SignalR | ✅ 완료 | SignalR + 폴링 폴백, 구독 상태 갱신 |
| NOWPayments 제거 | ✅ 완료 | nowpayments.ts 삭제, 이메일 발송 UI 제거 |
| 통화 옵션 동적 로딩 | ⏳ 대기 | 백엔드 API 제공 시 |

상세: `FRONTEND_CRYPTO_PAYMENT.md`

### 3.2 백엔드

| 항목 | 상태 | 비고 |
|------|------|------|
| GET /api/v1/plans | ⏳ | 플랜 목록 반환 |
| POST /api/v1/subscription/create | ⏳ | 인보이스 생성, pay_url 반환 |
| GET /payment/api/v1/invoice/{id} | ⏳ | 인보이스 상태 |
| 결제 완료 웹훅/IPN | ⏳ | 구독 DB 갱신 |

### 3.3 인프라/설정

| 항목 | 상태 | 비고 |
|------|------|------|
| 결제 게이트웨이 연동 | ⏳ | 암호화폐 결제 서비스 |
| NEXT_PUBLIC_PAYMENT_API_URL | ⏳ | 결제 서비스 별도 도메인 시 |

---

## 4. 문서 목록

| 파일 | 내용 |
|------|------|
| `crypto_payment_openapi.yaml` | OpenAPI 3.0 스펙 |
| `FRONTEND_CRYPTO_PAYMENT.md` | 프론트엔드 구현 현황·할 일 |
| `README.md` | 본 문서 (총체 요구사항·부문별 할 일) |
