# SignalR 실시간 알림 — 프론트엔드 구현

`signalr_realtime_notification_spec.docx` 기준으로 구현한 내용입니다.

---

## 1. 구현 요약

| 항목 | 상태 | 파일 |
|------|------|------|
| SignalR 클라이언트 | ✅ | `@microsoft/signalr` 패키지 |
| Payment Hub 연결 | ✅ | `shared/hooks/usePaymentSignalR.ts` |
| 이벤트 수신 | ✅ | PaymentDetected, PaymentConfirmed, SubscriptionUpdated, InvoiceExpired |
| 자동 재연결 | ✅ | `.withAutomaticReconnect()` |
| 인증 | ✅ | `accessTokenFactory`로 Bearer 토큰 전달 |
| 폴링 폴백 | ✅ | SignalR 끊김 시 `GET /payment/api/v1/invoice/{id}` 12초 간격 |
| 토스트 표시 | ✅ | PaymentConfirmed 등 시 "결제가 반영되었습니다" |

---

## 2. 아키텍처

```
로그인 유저
  → PaymentSignalRProvider (ContentLayout, LandingLayout)
  → usePaymentSignalR: Hub 연결 (/api/hubs/payment)
  → 이벤트 수신 시: subscription-updated 발송, 토스트 표시

SignalR 끊김 + CRYPTO_INVOICE_ID_KEY 있음
  → SubscriptionPaymentPoller: getInvoiceStatus 폴링 (12초)
  → status === "finished" 시: subscription-updated 발송, 토스트 표시
```

---

## 3. Hub URL 및 이벤트

| 항목 | 값 |
|------|-----|
| Hub URL | `${NEXT_PUBLIC_API_URL}/api/hubs/payment` |
| 이벤트 | PaymentDetected, PaymentConfirmed, SubscriptionUpdated, InvoiceExpired |

---

## 4. 백엔드 요구사항 (필수)

SignalR은 **반드시** 구현되어야 합니다. 폴링은 보조 수단입니다.

| 항목 | 내용 |
|------|------|
| Hub 엔드포인트 | `MapHub<PaymentHub>("/api/hubs/payment")` |
| 인증 | JWT Bearer 토큰으로 사용자 매핑 (`Clients.User(userId)`) |
| 이벤트 | `SendAsync("PaymentConfirmed", { plan, expireDate })` 등 |
| CORS | 프론트엔드 도메인(예: `http://localhost:3000`) 허용 |
| Negotiation | `GET /api/hubs/payment/negotiate` 정상 응답 |

### "connection was stopped during negotiation" 오류 시

- `negotiate` 엔드포인트가 404/500 등으로 실패하는지 확인
- CORS: `Access-Control-Allow-Origin`에 프론트엔드 URL 포함
- ASP.NET Core: `app.UseCors()` → `SignalR` 허용, `MapHub` 전에 호출

---

## 5. 파일 구조

```
shared/
  hooks/
    usePaymentSignalR.ts      # Hub 연결, 이벤트 핸들러
  contexts/
    PaymentSignalRContext.tsx # Provider, connectionState, 토스트
  constants/
    subscription-payment.ts   # CRYPTO_INVOICE_ID_KEY, INVOICE_POLL_INTERVAL_MS

pages/
  components/
    subscription/
      SubscriptionPaymentPoller.tsx  # 폴링 폴백 (인보이스 + getCurrentUser)
      CryptoSubscriptionModal.tsx    # 인보이스 생성 시 CRYPTO_INVOICE_ID_KEY 저장
```
