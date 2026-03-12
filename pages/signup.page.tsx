'use client';

import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * 가입 페이지는 /join 단일 사용. /signup 은 /join 으로 리다이렉트 (쿼리 유지).
 */
export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace({ pathname: "/join", query: router.query });
  }, [router.isReady, router.query]);
  return (
    <div className="flex items-center justify-center min-h-[200px] text-defaulttextcolor/70">
      <span className="ti-spinner !w-8 !h-8 !border-2 inline-block" />
      <span className="ml-2">이동 중...</span>
    </div>
  );
}

SignupPage.layout = "Authenticationlayout";
