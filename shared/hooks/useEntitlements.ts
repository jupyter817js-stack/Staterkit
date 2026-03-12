import { useMemo } from "react";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import {
  getEntitlements,
  SUBSCRIPTION_PLAN,
  type Entitlements,
  type SubscriptionPlanType,
} from "@/shared/types/subscription";

/**
 * 현재 유저의 구독 플랜으로 Entitlements 반환.
 * 최고관리자(SUPER_ADMIN)는 구독 없이 PRO와 동일한 권한.
 * currentUser가 없거나 subscription_plan이 없으면 STANDARD 기본 권한.
 */
export function useEntitlements(
  currentUser: CurrentUser | null | undefined
): Entitlements {
  return useMemo(() => {
    if (currentUser?.level === USER_LEVEL.SUPER_ADMIN) {
      return getEntitlements(SUBSCRIPTION_PLAN.PRO);
    }
    return getEntitlements(currentUser?.subscription_plan);
  }, [currentUser?.level, currentUser?.subscription_plan]);
}

/** PRO 권한 여부 (PRO 구독 또는 최고관리자) */
export function useIsPro(
  currentUser: CurrentUser | null | undefined
): boolean {
  if (!currentUser) return false;
  if (currentUser.level === USER_LEVEL.SUPER_ADMIN) return true;
  return currentUser.subscription_plan === "PRO";
}

export type { Entitlements, SubscriptionPlanType };
