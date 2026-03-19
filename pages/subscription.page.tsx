import React, { useEffect } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

export default function SubscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !router.isReady) return;

    const rawPlan = router.query.plan;
    const plan =
      rawPlan === "PRO" || rawPlan === "STANDARD"
        ? rawPlan
        : Array.isArray(rawPlan) && (rawPlan[0] === "PRO" || rawPlan[0] === "STANDARD")
          ? rawPlan[0]
          : "PRO";

    const target = new URL(`${window.location.origin}/`);
    target.hash = "pricing";
    target.searchParams.set("openSubscription", "1");
    target.searchParams.set("plan", plan);
    window.location.replace(target.toString());
  }, [router.isReady, router.query.plan]);

  return (
    <div className="flex min-h-[200px] items-center justify-center text-defaulttextcolor/70">
      <span className="ti-spinner !h-8 !w-8 !border-2 inline-block" />
      <span className="ml-2">Redirecting...</span>
    </div>
  );
}

SubscriptionPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
