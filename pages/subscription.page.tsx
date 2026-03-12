import React, { useEffect } from "react";
import type { GetServerSideProps } from "next";

/** 구독은 랜딩 페이지 가격 섹션에서 진행합니다. 이 경로는 랜딩 #pricing으로 리다이렉트합니다. */
export default function SubscriptionPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/#pricing`;
      window.location.replace(url);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-defaulttextcolor/70">
      <span className="ti-spinner !w-8 !h-8 !border-2 inline-block" />
      <span className="ml-2">이동 중...</span>
    </div>
  );
}

SubscriptionPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
