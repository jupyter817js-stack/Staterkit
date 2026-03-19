# 구독 플랜 ID 발급 (백엔드에서 수행)

구독(Standard/Pro)을 사용하려면 NOWPayments에 **플랜을 한 번씩 생성**하고, 응답의 **plan id**를 백엔드 설정에 넣어야 합니다.

**플랜 생성·설정은 모두 백엔드(.NET)에서 수행합니다.**

- **절차·API 스펙·환경 변수:** `docs/BACKEND_SUBSCRIPTION.md` 의 **「5. 구독 플랜 생성」** 참고.
- 프론트(Next.js)에는 결제/구독/플랜 생성 API가 없습니다.
