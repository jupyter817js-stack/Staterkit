# 결제·구독 프론트엔드 수정 체크리스트 (tb_user 전용)

백엔드가 **tb_user만 사용**하고 **tb_payment_history 미사용**으로 변경된 후 프론트 반영 사항입니다.

## 완료된 수정

- [x] **CurrentUser 타입** (`shared/types/users.ts`): `subscription_start_at`, `subscription_end_at` 추가
- [x] **auth/me 정규화** (`shared/api/users.ts`): 응답에 `subscription_start_at`, `subscription_end_at` 매핑
- [x] **PaymentHistoryItem** (`shared/types/payment-history.ts`): `paymentAmount` null 허용, `paymentDate`/`expiryDate` null, `status` = "active" | "expired"
- [x] **payment-history API** (`shared/api/payment-history.ts`): `normalizeItem`에서 payment_amount null·status active/expired 반영
- [x] **getMyPaymentHistory** (`shared/api/payments.ts`): `GET /api/v1/payments/my-history` 호출, tb_user 1건 기준 정규화
- [x] **PaymentHistoryTable**: 결제금액 null 시 "—", status "active" → "구독 중", "expired" → "만료" (i18n: `subscriptionStatusActive`, `subscriptionStatusExpired`)
- [x] **결제 완료 후 갱신**: 랜딩 `#pricing`에서 `payment_success`/`subscription_success` 쿼리 시 `getCurrentUser()` 재호출 후 `setCurrentUser(me)` (이미 구현됨)

## 구독 상태 판단 (참고)

- **구독 여부·플랜·만료일**: `getCurrentUser()` (auth/me) 의 `subscription_plan`, `subscription_start_at`, `subscription_end_at` 만 사용.
- **만료 여부**: `user?.subscription_end_at ? new Date(user.subscription_end_at) < new Date() : true`

## API·함수 정리

| 용도 | API | 프론트 함수 |
|------|-----|-------------|
| 현재 구독 플랜·만료일 | GET /api/v1/auth/me | `getCurrentUser()` (users.ts) |
| 내 구독 이력 (1건) | GET /api/v1/payments/my-history | `getMyPaymentHistory()` (payments.ts) |
| 관리자 결제/구독 목록 | GET /api/v1/payments/history | `listPaymentHistory()` (payment-history.ts) |

## my-history / history 공통

- `payment_amount`: **항상 null** → UI에서 "—" 또는 숨김
- `status`: **"active"** | **"expired"** → "구독 중" | "만료" 로 표시
