import { useEffect } from "react";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";

const SUBSCRIPTION_UPDATED_EVENT = "subscription-updated";

/** 구독 결제 완료 시 서버에서 상태가 반영되면 발생하는 이벤트 이름 */
export function getSubscriptionUpdatedEventName(): string {
  return SUBSCRIPTION_UPDATED_EVENT;
}

/**
 * 구독 결제 완료 후 서버에서 subscription_plan이 갱신되면 발생하는 이벤트를 듣고
 * getCurrentUser로 유저를 다시 불러와 setState로 반영합니다.
 * Header, Sidebar, valuebet, surebet, landing 등 currentUser를 쓰는 페이지에서 호출하세요.
 */
export function useRefreshUserOnSubscriptionUpdate(
  setCurrentUser: (user: CurrentUser | null) => void
): void {
  useEffect(() => {
    const handler = () => {
      getCurrentUser().then((user) => setCurrentUser(user ?? null));
    };
    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handler);
  }, [setCurrentUser]);
}
